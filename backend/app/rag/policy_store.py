from typing import List, Dict, Any, Optional
from app.rag.vector_search import policy_vector_store


class PolicyKnowledgeService:
    """Service to supply agent orchestrator with grounded policy context."""

    @staticmethod
    async def retrieve_relevant_policies(query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        return await policy_vector_store.search(query, top_k=top_k)

    @staticmethod
    async def retrieve_rebalance_rules() -> List[Dict[str, Any]]:
        return await policy_vector_store.search("rebalancing threshold drift dual approval limits SOP", top_k=2)

    @staticmethod
    async def retrieve_risk_standards() -> List[Dict[str, Any]]:
        return await policy_vector_store.search("parametric value at risk VaR 95% drawdown Sharpe ratio", top_k=2)


policy_knowledge_service = PolicyKnowledgeService()
