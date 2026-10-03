"""
NETRA Ingestion Routes
Handles raw config file uploads, pastes, vendor detection, and sanitization
"""
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional, List
import os
from app.services.vendor_detector import detect_vendor, get_vendor_display_name
from app.services.sanitizer import sanitize_config
from app.models.models import VendorEnum

router = APIRouter()

SAMPLE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "sample_configs")


@router.post("/detect")
async def detect_config_vendor(config_text: str = Form(...)):
    """Detect vendor from pasted config text"""
    if not config_text.strip():
        raise HTTPException(status_code=400, detail="Empty configuration text")
    
    vendor = detect_vendor(config_text)
    sanitized_text, redactions = sanitize_config(config_text)

    return {
        "vendor": vendor,
        "vendor_name": get_vendor_display_name(vendor),
        "line_count": len(config_text.splitlines()),
        "redactions_applied": redactions,
        "sanitized_preview": sanitized_text[:1000]
    }


@router.post("/upload")
async def upload_config_file(file: UploadFile = File(...)):
    """Upload a raw config file and perform vendor detection + sanitization"""
    content = await file.read()
    try:
        config_text = content.decode("utf-8", errors="replace")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Cannot decode file: {e}")

    vendor = detect_vendor(config_text)
    sanitized_text, redactions = sanitize_config(config_text)

    return {
        "filename": file.filename,
        "size_bytes": len(content),
        "line_count": len(config_text.splitlines()),
        "vendor": vendor,
        "vendor_name": get_vendor_display_name(vendor),
        "redactions_applied": redactions,
        "raw_config": sanitized_text
    }


@router.get("/samples")
async def get_sample_configs():
    """Returns available pre-loaded vendor sample configs for quick auditing demo"""
    samples = []
    if os.path.exists(SAMPLE_DIR):
        for fname in os.listdir(SAMPLE_DIR):
            fpath = os.path.join(SAMPLE_DIR, fname)
            if os.path.isfile(fpath):
                with open(fpath, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()
                vendor = detect_vendor(content)
                samples.append({
                    "filename": fname,
                    "vendor": vendor,
                    "vendor_name": get_vendor_display_name(vendor),
                    "line_count": len(content.splitlines()),
                    "content": content
                })
    return samples
