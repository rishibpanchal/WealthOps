from typing import Optional, List
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from app.core.security import get_current_user, CurrentUser
from app.db.database import AsyncSessionLocal
from app.db.models import PolicyDocument
from app.rag.vector_search import policy_vector_store


router = APIRouter(prefix="/policies", tags=["Policy RAG Knowledge Base"])


class PolicySearchRequest(BaseModel):
    query: str
    top_k: Optional[int] = 3
    category_filter: Optional[str] = None


@router.get("")
async def list_policies(current_user: CurrentUser = Depends(get_current_user)):
    """Retrieve full catalog of institutional wealth management policies."""
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(PolicyDocument).order_by(PolicyDocument.category))
        docs = result.scalars().all()
        return [
            {
                "id": d.id,
                "title": d.title,
                "category": d.category,
                "version": d.version,
                "summary": d.summary,
                "content": d.content,
            }
            for d in docs
        ]


@router.post("/search")
async def search_policies(
    req: PolicySearchRequest,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Semantic vector search across institutional policies with similarity scoring."""
    matches = await policy_vector_store.search(
        query=req.query,
        top_k=req.top_k or 3,
        category_filter=req.category_filter,
    )
    return {
        "query": req.query,
        "matches_found": len(matches),
        "results": matches,
    }
