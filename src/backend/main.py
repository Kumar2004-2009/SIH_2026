"""
NETRA Backend - Main FastAPI Application
AI-Driven Multi-Vendor Network Security Compliance Auditor
| Organization: NTRO
"""
from fastapi import FastAPI
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from loguru import logger
import sys

from app.core.config import settings
from app.core.database import connect_db, disconnect_db
from app.api.routes import (
    health, devices, ingestion, compliance,
    findings, graph, remediation, reports, drift, audit, dashboard
)


def setup_logging():
    try:
        if hasattr(sys.stdout, "reconfigure"):
            sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

    logger.remove()
    logger.add(
        sys.stdout,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
        level="DEBUG" if settings.DEBUG else "INFO",
        colorize=True
    )


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()
    logger.info("[*] Starting NETRA Backend...")
    await connect_db()
    logger.info("[+] Database initialized successfully")
    
    # Seed demo data on startup
    from app.core.seeder import seed_demo_data
    await seed_demo_data()
    logger.info("[+] Demo data verification complete")
    
    yield
    
    logger.info("[*] Shutting down NETRA Backend...")
    await disconnect_db()


app = FastAPI(
    title="NETRA API",
    description="AI-Driven Multi-Vendor Network Security Compliance Auditor",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix="/api", tags=["Health"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(devices.router, prefix="/api/devices", tags=["Devices"])
app.include_router(ingestion.router, prefix="/api/ingestion", tags=["Ingestion"])
app.include_router(audit.router, prefix="/api/audit", tags=["Audit"])
app.include_router(compliance.router, prefix="/api/compliance", tags=["Compliance"])
app.include_router(findings.router, prefix="/api/findings", tags=["Findings"])
app.include_router(graph.router, prefix="/api/graph", tags=["Security Graph"])
app.include_router(remediation.router, prefix="/api/remediation", tags=["Remediation"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])
app.include_router(drift.router, prefix="/api/drift", tags=["Configuration Drift"])


@app.get("/")
async def root():
    return {
        "name": "NETRA",
        "version": "1.0.0",
        "description": "AI-Driven Multi-Vendor Network Security Compliance Auditor",
        "organization": "NTRO",
        "status": "operational"
    }


@app.get("/api/docs", include_in_schema=False)
async def redirect_api_docs():
    return RedirectResponse(url="/docs")


@app.get("/api/redoc", include_in_schema=False)
async def redirect_api_redoc():
    return RedirectResponse(url="/redoc")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level="debug" if settings.DEBUG else "info"
    )
