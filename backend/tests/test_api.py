import pytest
import httpx
from app.main import app


@pytest.mark.asyncio
async def test_api_endpoints():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        # Health check
        res = await client.get("/health")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "HEALTHY"

        # List clients
        res_clients = await client.get("/api/clients", headers={"X-User-Role": "OPERATIONS_ANALYST"})
        assert res_clients.status_code == 200
        clients = res_clients.json()
        assert len(clients) >= 20

        # Benchmark eval
        res_eval = await client.get("/api/eval/benchmark", headers={"X-User-Role": "ADMIN"})
        assert res_eval.status_code == 200
        eval_data = res_eval.json()
        assert "benchmark_summary" in eval_data
        assert eval_data["metrics"]["unauthorized_blocking_pct"] == 100.0
