"""
NETRA Configuration Drift Tracking Routes
"""
from fastapi import APIRouter, HTTPException, Form
from typing import List, Optional
from datetime import datetime, timedelta
from app.core.database import get_db
from app.models.models import DriftEntry, generate_id
from app.services.drift_engine import calculate_configuration_drift

router = APIRouter()


@router.get("", response_model=List[DriftEntry])
async def list_drift_entries(device_id: Optional[str] = None):
    db = get_db()
    query = {}
    if device_id:
        query["device_id"] = device_id
    entries = await db.drift.find(query, {"_id": 0}).sort("created_at", -1).to_list(50)
    return entries


@router.post("/compare")
async def compare_configs(
    device_id: str = Form(...),
    baseline_config: str = Form(...),
    current_config: str = Form(...)
):
    """Compare baseline configuration vs candidate configuration and evaluate security drift"""
    if not baseline_config.strip() or not current_config.strip():
        raise HTTPException(status_code=400, detail="Both baseline and current configs are required")

    drift = calculate_configuration_drift(
        device_id=device_id,
        config_a_id=generate_id(),
        config_b_id=generate_id(),
        config_a_text=baseline_config,
        config_b_text=current_config,
        config_a_date=datetime.utcnow() - timedelta(days=14),
        config_b_date=datetime.utcnow()
    )

    db = get_db()
    await db.drift.insert_one(drift.model_dump())

    return drift
