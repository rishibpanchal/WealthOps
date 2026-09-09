import pytest
from app.db.database import init_db
from app.db.seed import seed_database
from app.rag.vector_search import policy_vector_store


@pytest.mark.asyncio
async def test_policy_rag_vector_search():
    await init_db()
    await seed_database()
    await policy_vector_store.build_index()

    assert len(policy_vector_store.chunks) > 0

    # Search for rebalancing thresholds
    results = await policy_vector_store.search("rebalancing limits dual approval risk officer", top_k=2)
    assert len(results) > 0
    top = results[0]
    assert top["similarity_score"] > 0
    assert "rebalancing" in top["full_content"].lower() or "approval" in top["full_content"].lower()
