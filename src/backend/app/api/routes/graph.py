"""
NETRA Security Graph & Attack Path Routes
"""
from fastapi import APIRouter
from app.core.database import get_db
from app.models.models import SecurityGraph
from app.services.security_graph import build_security_graph, build_demo_graph

router = APIRouter()


@router.get("", response_model=SecurityGraph)
async def get_security_graph():
    """
    Returns NetworkX generated topological security graph with attack paths,
    nodes, edges, and exposure risk metrics.
    """
    db = get_db()
    devices = await db.devices.find({}, {"_id": 0}).to_list(100)
    
    if not devices or len(devices) < 3:
        # Fallback to rich pre-built demonstration topology
        return build_demo_graph()

    graph = build_security_graph(devices)
    return graph


@router.get("/attack-paths")
async def get_attack_paths():
    """Returns identified multi-hop attack vectors from untrusted zones to crown jewels"""
    graph = await get_security_graph()
    return {
        "total_paths": len(graph.attack_paths),
        "paths": graph.attack_paths,
        "critical_crown_jewels": ["Database Server (10.0.0.50)", "Management Plane (192.168.1.0/24)"]
    }
