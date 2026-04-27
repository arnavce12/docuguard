"""
DocuGuard — Unified FastAPI Entry Point
---------------------------------------
This single file replaces all individual Vercel handler files for LOCAL development.
Run locally with:
    uvicorn api.index:app --reload --port 8000

The old standalone files (analyze.py, analyze_public.py, etc.) are kept as reference
and for Vercel deployment compatibility. They will be removed before final production deploy.
"""

import os
from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
from dotenv import load_dotenv

# Load env vars from api/.env when running locally
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

from core.database import (
    download_image,
    get_signed_url,
    save_scan,
    get_user_scans,
    delete_user_scan,
    save_kyd_scan,
    get_user_kyd_scans,
    delete_user_kyd_scan,
    update_scan_name,
    get_public_stats,
    supabase,
)
from core.gemini import analyze_document, analyze_document_kyd

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

app = FastAPI(
    title="DocuGuard API",
    description="Document fraud detection and analysis powered by Gemini AI.",
    version="1.0.0",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # tighten this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Auth helper
# ---------------------------------------------------------------------------

def get_user_id(request: Request) -> str:
    """Extract and validate the Bearer token, returning the Supabase user_id."""
    authorization = request.headers.get("Authorization", "")
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    token = authorization.split(" ")[1]
    try:
        user = supabase.auth.get_user(token)
        return user.user.id
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------

class AnalyzeRequest(BaseModel):
    storage_path: str
    label: Optional[str] = None

class AnalyzePublicRequest(BaseModel):
    storage_path: str

class KydRequest(BaseModel):
    storage_path: str

class RenameRequest(BaseModel):
    id: str
    type: str
    new_name: str

# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/api/health")
def health_check():
    """Simple liveness probe."""
    return {"status": "ok"}


@app.get("/api/stats")
def stats():
    """Public aggregated scan statistics."""
    try:
        return get_public_stats()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/analyze")
def analyze(body: AnalyzeRequest, request: Request):
    """
    Authenticated document fraud analysis.
    Requires a valid Supabase JWT in the Authorization header.
    """
    user_id = get_user_id(request)

    try:
        file_bytes = download_image(body.storage_path)
        result = analyze_document(file_bytes)
        saved = save_scan(
            fraud_likelihood=result["fraud_likelihood"],
            confidence_score=result["confidence_score"],
            red_flags=result["red_flags"],
            explanation=result["explanation"],
            storage_path=body.storage_path,
            user_id=user_id,
            document_label=body.label or result.get("document_label"),
            is_public_demo=False,
            health_score=result.get("health_score")
        )
        return {**result, "scan_id": saved["id"]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/analyze-public")
def analyze_public(body: AnalyzePublicRequest):
    """
    Public (unauthenticated) document fraud analysis.
    Only aggregate stats are saved; no user data is stored.
    """
    try:
        file_bytes = download_image(body.storage_path)
        result = analyze_document(file_bytes)
        save_scan(
            fraud_likelihood=result["fraud_likelihood"],
            confidence_score=result["confidence_score"],
            red_flags=result["red_flags"],
            explanation=result["explanation"],
            is_public_demo=True,
            health_score=result.get("health_score")
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/kyd")
def kyd(body: KydRequest, request: Request):
    """
    Know Your Document — authenticated analysis that identifies document type,
    purpose, and key fields present.
    """
    user_id = get_user_id(request)

    try:
        file_bytes = download_image(body.storage_path)
        result = analyze_document_kyd(file_bytes)
        saved = save_kyd_scan(
            document_type=result.get("document_type"),
            common_name=result.get("common_name"),
            issuing_authority=result.get("issuing_authority"),
            purpose=result.get("purpose"),
            typical_use_cases=result.get("typical_use_cases"),
            key_fields_present=result.get("key_fields_present"),
            data_categories=result.get("data_categories"),
            notes=result.get("notes"),
            storage_path=body.storage_path,
            user_id=user_id,
        )
        return {**result, "scan_id": saved["id"] if saved else None}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/scans")
def list_scans(request: Request):
    """Return all scans for the authenticated user, newest first."""
    user_id = get_user_id(request)
    try:
        scans = get_user_scans(user_id)
        return {"scans": scans}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.delete("/api/scans")
def delete_scan(id: str, request: Request):
    """Delete a specific scan by its ID (must belong to the authenticated user)."""
    user_id = get_user_id(request)
    try:
        deleted = delete_user_scan(id, user_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Scan not found or not authorized to delete")
        return {"message": "Scan deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/history")
def unified_history(request: Request):
    """Return unified history of all scans (KYD + Fraud) for the authenticated user, newest first."""
    user_id = get_user_id(request)
    try:
        scans = get_user_scans(user_id)
        kyd_scans = get_user_kyd_scans(user_id)
        
        combined = []
        for s in scans:
            combined.append({
                "id": s["id"],
                "type": "fraud",
                "document_name": s["document_label"] or "Unnamed Document",
                "result": s["fraud_likelihood"],
                "confidence": s["confidence_score"],
                "date": s["created_at"],
                "raw": s,
            })
            
        for k in kyd_scans:
            combined.append({
                "id": k["id"],
                "type": "kyd",
                "document_name": k["common_name"] or "Unknown Document",
                "result": "Identified",
                "confidence": None,
                "date": k["created_at"],
                "raw": k,
            })
            
        # Sort combined list by date descending
        combined.sort(key=lambda x: x["date"], reverse=True)
        return {"history": combined}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/history")
def delete_history_item(id: str, type: str, request: Request):
    """Delete a specific scan from history based on its type."""
    user_id = get_user_id(request)
    try:
        deleted = False
        if type == "fraud":
            deleted = delete_user_scan(id, user_id)
        elif type == "kyd":
            deleted = delete_user_kyd_scan(id, user_id)
        else:
            raise HTTPException(status_code=400, detail="Invalid scan type")
            
        if not deleted:
            raise HTTPException(status_code=404, detail="Scan not found or not authorized to delete")
        return {"message": "Scan deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.patch("/api/history")
def rename_history_item(body: RenameRequest, request: Request):
    """Update the display name of a scan or KYD analysis."""
    user_id = get_user_id(request)
    try:
        updated = update_scan_name(body.id, body.type, user_id, body.new_name)
        if not updated:
            raise HTTPException(status_code=404, detail="Item not found or not authorized")
        return {"message": "Document renamed successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/signed-url")
def get_file_url(path: str, request: Request):
    """Generate a signed URL for a private storage path."""
    user_id = get_user_id(request)
    print(f"[DEBUG] Signed URL request - path: {path}, user_id: {user_id}")
    
    if not path.startswith(f"{user_id}/") and not path.startswith("public/"):
        print(f"[DEBUG] Unauthorized access attempt - path: {path}, user_id: {user_id}")
        raise HTTPException(status_code=403, detail="Unauthorized access to this file")
        
    try:
        url = get_signed_url(path)
        print(f"[DEBUG] Signed URL generated: {url}")
        return {"url": url}
    except Exception as e:
        print(f"[DEBUG] Error generating signed URL: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
