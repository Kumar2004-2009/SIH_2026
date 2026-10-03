"""
NETRA Device Management Routes
"""
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from datetime import datetime
from app.core.database import get_db
from app.models.models import Device, DeviceCreate, generate_id

router = APIRouter()


@router.get("", response_model=List[Device])
async def list_devices(vendor: Optional[str] = None, criticality: Optional[str] = None):
    db = get_db()
    query = {}
    if vendor:
        query["vendor"] = vendor
    if criticality:
        query["criticality"] = criticality

    cursor = db.devices.find(query, {"_id": 0}).sort("created_at", -1)
    devices = await cursor.to_list(length=100)
    return devices


@router.get("/{device_id}", response_model=Device)
async def get_device(device_id: str):
    db = get_db()
    dev = await db.devices.find_one({"device_id": device_id}, {"_id": 0})
    if not dev:
        raise HTTPException(status_code=404, detail="Device not found")
    return dev


@router.post("", response_model=Device)
async def create_device(payload: DeviceCreate):
    db = get_db()
    device_dict = payload.model_dump()
    device_dict["device_id"] = generate_id()
    device_dict["created_at"] = datetime.utcnow()
    device_dict["updated_at"] = datetime.utcnow()
    device_dict["last_audit_at"] = None
    device_dict["total_findings"] = 0
    device_dict["risk_score"] = 0.0
    device_dict["compliance_score"] = 0.0

    await db.devices.insert_one(device_dict)
    created = await db.devices.find_one({"device_id": device_dict["device_id"]}, {"_id": 0})
    return created


@router.delete("/{device_id}")
async def delete_device(device_id: str):
    db = get_db()
    result = await db.devices.delete_one({"device_id": device_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Device not found")
    # Clean related audits and findings
    await db.audits.delete_many({"device_id": device_id})
    await db.findings.delete_many({"device_id": device_id})
    return {"status": "success", "message": f"Device {device_id} deleted"}
