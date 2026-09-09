from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.database import init_db
from app.db.seed import seed_database
from app.rag.vector_search import policy_vector_store
from app.api.agent import router as agent_router
from app.api.clients import router as clients_router
from app.api.approvals import router as approvals_router
from app.api.policies import router as policies_router
from app.api.audit import router as audit_router
from app.api.automation import router as automation_router
from app.api.eval import router as eval_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure tables, seed data, and index policies in vector store
    await init_db()
    await seed_database()
    await policy_vector_store.build_index()
    yield
    # Shutdown logic if needed


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Enterprise AI Agent Platform for Wealth Management Operations Automation",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(agent_router, prefix=settings.API_PREFIX)
app.include_router(clients_router, prefix=settings.API_PREFIX)
app.include_router(approvals_router, prefix=settings.API_PREFIX)
app.include_router(policies_router, prefix=settings.API_PREFIX)
app.include_router(audit_router, prefix=settings.API_PREFIX)
app.include_router(automation_router, prefix=settings.API_PREFIX)
app.include_router(eval_router, prefix=settings.API_PREFIX)


@app.get("/health")
async def health():
    return {
        "status": "HEALTHY",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "guardrails": "ACTIVE",
        "vector_index_size": len(policy_vector_store.chunks),
    }
