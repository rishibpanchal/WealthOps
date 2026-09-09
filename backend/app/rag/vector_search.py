import re
import math
from typing import List, Dict, Any, Optional
import numpy as np
from sqlalchemy import select
from app.db.database import AsyncSessionLocal
from app.db.models import PolicyDocument


class PolicyChunk:
    def __init__(self, doc_id: str, title: str, category: str, section_title: str, text: str):
        self.doc_id = doc_id
        self.title = title
        self.category = category
        self.section_title = section_title
        self.text = text
        self.vector: Optional[np.ndarray] = None


class PolicyVectorStore:
    """
    High-performance, in-memory semantic vector index with cosine similarity search.
    Provides fast RAG retrieval without requiring external vector DB daemons.
    """

    def __init__(self):
        self.chunks: List[PolicyChunk] = []
        self.vocab: Dict[str, int] = {}
        self.idf: Dict[str, float] = {}
        self._is_indexed = False

    def _tokenize(self, text: str) -> List[str]:
        cleaned = re.sub(r"[^a-zA-Z0-9\s]", " ", text.lower())
        tokens = [t for t in cleaned.split() if len(t) > 2]
        return tokens

    async def build_index(self):
        """Extracts and chunks all institutional policy documents from database."""
        async with AsyncSessionLocal() as session:
            result = await session.execute(select(PolicyDocument))
            docs = result.scalars().all()

        self.chunks = []
        for doc in docs:
            # Chunk by markdown headers ##
            sections = re.split(r"(?=\n##\s+)", doc.content)
            for section in sections:
                clean_sec = section.strip()
                if not clean_sec:
                    continue
                header_match = re.match(r"##\s+(.*)", clean_sec)
                sec_title = header_match.group(1).strip() if header_match else doc.title
                chunk = PolicyChunk(
                    doc_id=doc.id,
                    title=doc.title,
                    category=doc.category,
                    section_title=sec_title,
                    text=clean_sec,
                )
                self.chunks.append(chunk)

        if not self.chunks:
            return

        # Compute TF-IDF semantic embeddings
        doc_freq: Dict[str, int] = {}
        tokenized_chunks = []
        for c in self.chunks:
            tokens = set(self._tokenize(c.text + " " + c.title + " " + c.category))
            tokenized_chunks.append(tokens)
            for t in tokens:
                doc_freq[t] = doc_freq.get(t, 0) + 1

        total_docs = len(self.chunks)
        self.vocab = {t: idx for idx, t in enumerate(doc_freq.keys())}
        self.idf = {t: math.log((total_docs + 1) / (df + 1)) + 1.0 for t, df in doc_freq.items()}

        vocab_size = len(self.vocab)
        for i, c in enumerate(self.chunks):
            vec = np.zeros(vocab_size, dtype=np.float32)
            tokens = self._tokenize(c.text + " " + c.title + " " + c.category)
            for t in tokens:
                if t in self.vocab:
                    idx = self.vocab[t]
                    vec[idx] += self.idf.get(t, 1.0)
            norm = np.linalg.norm(vec)
            if norm > 0:
                vec /= norm
            c.vector = vec

        self._is_indexed = True

    async def search(self, query: str, top_k: int = 3, category_filter: Optional[str] = None) -> List[Dict[str, Any]]:
        """Performs cosine similarity search against policy documents."""
        if not self._is_indexed or not self.chunks:
            await self.build_index()

        query_tokens = self._tokenize(query)
        vocab_size = len(self.vocab)
        q_vec = np.zeros(vocab_size, dtype=np.float32)

        for t in query_tokens:
            if t in self.vocab:
                idx = self.vocab[t]
                q_vec[idx] += self.idf.get(t, 1.0)

        q_norm = np.linalg.norm(q_vec)
        if q_norm > 0:
            q_vec /= q_norm

        scores = []
        for c in self.chunks:
            if category_filter and c.category != category_filter:
                continue
            if c.vector is not None and q_norm > 0:
                sim = float(np.dot(q_vec, c.vector))
            else:
                sim = 0.0
            scores.append((sim, c))

        scores.sort(key=lambda x: x[0], reverse=True)
        top_results = scores[:top_k]

        return [
            {
                "doc_id": c.doc_id,
                "title": c.title,
                "category": c.category,
                "section_title": c.section_title,
                "similarity_score": round(max(0.1, score), 3),
                "content_snippet": c.text[:400] + ("..." if len(c.text) > 400 else ""),
                "full_content": c.text,
            }
            for score, c in top_results
        ]


policy_vector_store = PolicyVectorStore()
