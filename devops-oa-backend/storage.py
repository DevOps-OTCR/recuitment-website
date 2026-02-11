"""Supabase Storage helper for resume files. If Supabase is not configured, returns None."""

from io import BytesIO
from typing import Optional
from config import get_settings

_settings = get_settings()
_supabase_client = None

RESUMES_BUCKET = "resumes"


def get_supabase_storage():
    """Lazy-init Supabase client. Returns None if URL or key not set."""
    global _supabase_client
    if not _settings.supabase_url or not _settings.supabase_key:
        return None
    if _supabase_client is None:
        try:
            from supabase import create_client
            _supabase_client = create_client(
                _settings.supabase_url,
                _settings.supabase_key,
            )
        except Exception:
            return None
    return _supabase_client


def ensure_resumes_bucket():
    """Create the resumes bucket if it does not exist (idempotent). Buckets are private by default (Supabase Storage Quickstart)."""
    import logging
    log = logging.getLogger(__name__)
    client = get_supabase_storage()
    if not client:
        return
    try:
        buckets = client.storage.list_buckets() or []
        names = [getattr(b, "name", b.get("name") if isinstance(b, dict) else None) for b in buckets]
        if RESUMES_BUCKET not in names:
            # Quickstart: supabase.storage.create_bucket('avatars'); buckets are private by default
            client.storage.create_bucket(RESUMES_BUCKET)
            log.info("Created storage bucket %s", RESUMES_BUCKET)
    except Exception as e:
        log.warning("Could not ensure bucket %s: %s. Create it in Supabase Dashboard → Storage if needed.", RESUMES_BUCKET, e)


def upload_resume(object_key: str, content: bytes, content_type: str = "application/pdf") -> tuple[bool, str]:
    """Upload resume bytes to Supabase Storage. Returns (True, '') on success, (False, error_message) on failure."""
    client = get_supabase_storage()
    if not client:
        return False, "Supabase Storage not configured (SUPABASE_URL/SUPABASE_KEY)"
    try:
        # upload(path, file, file_options=...) — file must be bytes or path, not BytesIO
        client.storage.from_(RESUMES_BUCKET).upload(
            object_key,
            content,
            file_options={"content-type": content_type},
        )
        return True, ""
    except Exception as e:
        msg = str(e) or type(e).__name__
        import logging
        logging.getLogger(__name__).exception("Resume upload failed: %s", msg)
        return False, msg


def download_resume(object_key: str) -> Optional[bytes]:
    """Download resume bytes from Supabase Storage. Returns None if not found or not configured."""
    client = get_supabase_storage()
    if not client:
        return None
    try:
        data = client.storage.from_(RESUMES_BUCKET).download(object_key)
        return data
    except Exception:
        return None


def is_supabase_path(resume_path: Optional[str]) -> bool:
    """True if path is a Supabase storage key (no leading slash, not a local path)."""
    if not resume_path:
        return False
    # Local paths are absolute or contain path separators
    return not resume_path.startswith("/") and "\\" not in resume_path
