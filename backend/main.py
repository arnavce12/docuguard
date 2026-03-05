import os
import uuid
from fastapi import FastAPI, UploadFile, File, HTTPException, Request, Header
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from dotenv import load_dotenv

from gemini import analyze_document
from database import (
    upload_image, save_scan, get_user_scans,
    delete_user_scan, get_public_stats, supabase
)

load_dotenv()

# ── App setup ────────────────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="DocuGuard API", version="1.0.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https://.*\.vercel\.app|http://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "application/pdf"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


# ── Auth helper ───────────────────────────────────────────────────────────────
def get_user_id(authorization: str) -> str:
    """Extract and verify user ID from Supabase JWT."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    token = authorization.split(" ")[1]
    try:
        user = supabase.auth.get_user(token)
        return user.user.id
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


def validate_file(file: UploadFile, file_bytes: bytes):
    """Check file type and size."""
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type. Upload JPG, PNG, WEBP, or PDF."
        )
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="File too large. Maximum size is 10MB."
        )


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"message": "DocuGuard API is running"}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/analyze/public")
@limiter.limit("10/hour")
async def analyze_public(request: Request, file: UploadFile = File(...)):
    """
    Public demo endpoint — no login required.
    Runs analysis but does NOT store the image.
    Only saves aggregate data (no user_id, no file).
    """
    print(f"[DEBUG] Received public scan request: {file.filename}")
    file_bytes = await file.read()
    validate_file(file, file_bytes)

    print("[DEBUG] Running Gemini analysis...")
    result = analyze_document(file_bytes)
    print(f"[DEBUG] Analysis complete: {result['fraud_likelihood']}")

    # Save result without image or user_id for aggregate stats
    save_scan(
        fraud_likelihood=result["fraud_likelihood"],
        confidence_score=result["confidence_score"],
        red_flags=result["red_flags"],
        explanation=result["explanation"],
        is_public_demo=True
    )

    return result


@app.post("/analyze")
@limiter.limit("30/hour")
async def analyze_authenticated(
    request: Request,
    file: UploadFile = File(...),
    authorization: str = Header(None),
    label: str = None
):
    """
    Authenticated endpoint — stores image and result linked to user.
    """
    user_id = get_user_id(authorization)
    file_bytes = await file.read()
    validate_file(file, file_bytes)

    # Upload image to private Supabase storage
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    filename = f"{user_id}/{uuid.uuid4()}.{ext}"
    storage_path = upload_image(file_bytes, filename, file.content_type)

    # Run fraud analysis
    result = analyze_document(file_bytes)

    # Save everything to DB
    saved = save_scan(
        fraud_likelihood=result["fraud_likelihood"],
        confidence_score=result["confidence_score"],
        red_flags=result["red_flags"],
        explanation=result["explanation"],
        storage_path=storage_path,
        user_id=user_id,
        document_label=label,
        is_public_demo=False
    )

    return {**result, "scan_id": saved["id"]}


@app.get("/scans")
async def get_scans(authorization: str = Header(None)):
    """Get all scans for the authenticated user."""
    user_id = get_user_id(authorization)
    scans = get_user_scans(user_id)
    return {"scans": scans}


@app.delete("/scans/{scan_id}")
async def delete_scan(scan_id: str, authorization: str = Header(None)):
    """Delete a specific scan belonging to the authenticated user."""
    user_id = get_user_id(authorization)
    deleted = delete_user_scan(scan_id, user_id)
    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Scan not found or not authorized to delete"
        )
    return {"message": "Scan deleted successfully"}


@app.get("/stats")
async def public_stats():
    """Public aggregate statistics — no auth required."""
    stats = get_public_stats()
    return stats