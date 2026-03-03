import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_KEY")
)

BUCKET = os.getenv("SUPABASE_BUCKET", "documents")


def upload_image(file_bytes: bytes, filename: str, content_type: str) -> str:
    """Upload image to Supabase storage, return the storage path."""
    path = f"uploads/{filename}"
    print(f"[DEBUG] Uploading to Supabase bucket: {BUCKET}, path: {path}")
    try:
        supabase.storage.from_(BUCKET).upload(
            path,
            file_bytes,
            {"content-type": content_type, "upsert": "true"}
        )
        print("[DEBUG] Upload successful")
        return path
    except Exception as e:
        print(f"[DEBUG] Upload failed: {str(e)}")
        raise e


def get_signed_url(storage_path: str) -> str:
    """Generate a short-lived signed URL for a stored image."""
    response = supabase.storage.from_(BUCKET).create_signed_url(
        storage_path, 60
    )
    return response["signedURL"]


def save_scan(
    fraud_likelihood: str,
    confidence_score: int,
    red_flags: list,
    explanation: str,
    storage_path: str = None,
    user_id: str = None,
    document_label: str = None,
    is_public_demo: bool = False
) -> dict:
    """Save a scan result to the database, return the saved record."""
    data = {
        "fraud_likelihood": fraud_likelihood,
        "confidence_score": confidence_score,
        "red_flags": red_flags,
        "explanation": explanation,
        "is_public_demo": is_public_demo,
    }
    if storage_path:
        data["storage_path"] = storage_path
    if user_id:
        data["user_id"] = user_id
    if document_label:
        data["document_label"] = document_label

    response = supabase.table("scans").insert(data).execute()
    return response.data[0]


def get_user_scans(user_id: str) -> list:
    """Fetch all scans for a specific user, newest first."""
    response = (
        supabase.table("scans")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return response.data


def delete_user_scan(scan_id: str, user_id: str) -> bool:
    """Delete a scan only if it belongs to the requesting user."""
    response = (
        supabase.table("scans")
        .delete()
        .eq("id", scan_id)
        .eq("user_id", user_id)
        .execute()
    )
    return len(response.data) > 0


def get_public_stats() -> dict:
    """Aggregate stats for the public analytics page."""
    all_scans = (
        supabase.table("scans")
        .select("fraud_likelihood, confidence_score, red_flags, created_at")
        .execute()
        .data
    )

    total = len(all_scans)
    if total == 0:
        return {
            "total_scans": 0,
            "high_risk_count": 0,
            "avg_confidence": 0,
            "risk_distribution": {"high": 0, "medium": 0, "low": 0},
            "top_red_flags": [],
            "recent_scans": []
        }

    high = sum(1 for s in all_scans if s["fraud_likelihood"] == "high")
    medium = sum(1 for s in all_scans if s["fraud_likelihood"] == "medium")
    low = sum(1 for s in all_scans if s["fraud_likelihood"] == "low")
    avg_score = round(
        sum(s["confidence_score"] for s in all_scans) / total, 1
    )

    # Count red flag frequency
    flag_counts = {}
    for scan in all_scans:
        for flag in (scan["red_flags"] or []):
            flag_counts[flag] = flag_counts.get(flag, 0) + 1
    top_flags = sorted(flag_counts.items(), key=lambda x: x[1], reverse=True)[:6]

    # Recent 5 scans anonymized
    recent = sorted(all_scans, key=lambda x: x["created_at"], reverse=True)[:5]
    recent_anonymized = [
        {"fraud_likelihood": s["fraud_likelihood"], "created_at": s["created_at"]}
        for s in recent
    ]

    return {
        "total_scans": total,
        "high_risk_count": high,
        "avg_confidence": avg_score,
        "risk_distribution": {"high": high, "medium": medium, "low": low},
        "top_red_flags": [{"flag": f, "count": c} for f, c in top_flags],
        "recent_scans": recent_anonymized
    }