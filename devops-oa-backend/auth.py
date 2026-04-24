"""Authentication and authorization helpers for the DevOps OA backend."""

from __future__ import annotations

import base64
import binascii
import hashlib
import hmac
import json
import secrets
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Any

import httpx
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from config import get_settings
from database import get_db
from models import Role, User

settings = get_settings()

PASSWORD_HASH_ALGORITHM = "pbkdf2_sha256"
PASSWORD_HASH_ITERATIONS = 390_000
TOKEN_ALGORITHM = "HS256"
DEFAULT_GRAPH_ME_URL = "https://graph.microsoft.com/v1.0/me"
DEFAULT_GRAPH_TIMEOUT_SECONDS = 10.0
EXTERNAL_AUTH_PASSWORD_HASH = "external-auth"


@dataclass(frozen=True)
class VerifiedMicrosoftUser:
    email: str
    display_name: str | None = None
    graph_id: str | None = None


bearer_scheme = HTTPBearer(auto_error=False)

ROLE_PERMISSIONS: dict[str, list[str]] = {
    Role.APPLICANT.value: [
        "view_own_profile",
        "view_own_interview_data",
    ],
    Role.CONSULTANT.value: [
        "view_assigned_interviews",
        "view_all_applicants",
        "submit_feedback",
    ],
    Role.LC.value: [
        "view_assigned_interviews",
        "view_all_applicants",
        "submit_feedback",
    ],
    Role.PM.value: [
        "view_assigned_interviews",
        "view_all_applicants",
        "submit_feedback",
    ],
    Role.PARTNER.value: [
        "view_assigned_interviews",
        "view_all_applicants",
        "submit_feedback",
        "assign_interviewers",
        "decide_round_1",
        "decide_round_2",
        "see_relative_score",
        "see_database",
    ],
}


def normalize_role(role: str | Role) -> str:
    if isinstance(role, Role):
        normalized = role.value
    else:
        normalized = (role or "").strip().lower()
    if normalized not in ROLE_PERMISSIONS:
        raise ValueError(f"Unsupported role: {role}")
    return normalized


def permissions_for_role(role: str | Role) -> list[str]:
    return ROLE_PERMISSIONS.get(normalize_role(role), [])


def has_permission(role: str | Role, permission: str) -> bool:
    return permission in permissions_for_role(role)


def permissions_for_user(user: User) -> list[str]:
    return permissions_for_role(user.role)


def role_for_user(user: User) -> str:
    return normalize_role(user.role)


def _attach_user_to_request(request: Request, user: User) -> None:
    request.state.user = user
    request.state.role = role_for_user(user)
    request.state.permissions = permissions_for_user(user)


async def get_verified_user(token: str) -> VerifiedMicrosoftUser:
    """Validate a Microsoft access token by calling Graph /me and extract identity."""
    graph_url = getattr(settings, "microsoft_graph_me_url", DEFAULT_GRAPH_ME_URL) or DEFAULT_GRAPH_ME_URL
    timeout = float(
        getattr(settings, "microsoft_graph_timeout_seconds", DEFAULT_GRAPH_TIMEOUT_SECONDS)
        or DEFAULT_GRAPH_TIMEOUT_SECONDS
    )

    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.get(
                graph_url,
                headers={"Authorization": f"Bearer {token}"},
                params={"$select": "id,displayName,mail,userPrincipalName"},
            )
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to verify Microsoft access token with Graph API.",
        ) from exc

    if response.status_code != status.HTTP_200_OK:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired Microsoft access token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = response.json()
    email = (payload.get("userPrincipalName") or payload.get("mail") or "").strip().lower()
    if not email or "@" not in email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Microsoft access token did not include a usable email address.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    display_name = payload.get("displayName")
    return VerifiedMicrosoftUser(
        email=email,
        display_name=display_name.strip() if isinstance(display_name, str) and display_name.strip() else None,
        graph_id=payload.get("id"),
    )


async def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Resolve the authenticated user from a Microsoft bearer token."""
    cached_user = getattr(request.state, "user", None)
    if cached_user is not None:
        return cached_user

    if credentials is None or credentials.scheme.lower() != "bearer" or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing bearer token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    verified_user = await get_verified_user(credentials.credentials)
    user = db.query(User).filter(User.email == verified_user.email).first()

    if user is None:
        user = User(
            email=verified_user.email,
            name=verified_user.display_name,
            password_hash=EXTERNAL_AUTH_PASSWORD_HASH,
            role=Role.APPLICANT,
            active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        if verified_user.display_name and user.name != verified_user.display_name:
            user.name = verified_user.display_name
            db.commit()
            db.refresh(user)

    if not user.active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is inactive.")

    _attach_user_to_request(request, user)
    return user


def requires_roles(*allowed_roles: Role | str):
    """FastAPI dependency factory for route-level role enforcement."""
    normalized_roles = {normalize_role(role) for role in allowed_roles}

    async def dependency(
        request: Request,
        current_user: User = Depends(get_current_user),
    ) -> User:
        user_role = role_for_user(current_user)
        if user_role not in normalized_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to this resource.",
            )
        _attach_user_to_request(request, current_user)
        return current_user

    return dependency


def requires_permissions(*required_permissions: str):
    """FastAPI dependency factory for route-level permission enforcement."""
    required = set(required_permissions)

    async def dependency(
        request: Request,
        current_user: User = Depends(get_current_user),
    ) -> User:
        user_permissions = set(permissions_for_user(current_user))
        if not required.issubset(user_permissions):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have the required permissions for this resource.",
            )
        _attach_user_to_request(request, current_user)
        return current_user

    return dependency


def _b64url_encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).rstrip(b"=").decode("ascii")


def _b64url_decode(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(f"{value}{padding}")


def _token_secret() -> str:
    configured_secret = (getattr(settings, "auth_token_secret", "") or "").strip()
    if configured_secret:
        return configured_secret

    legacy_secret = (settings.admin_password or "").strip()
    if legacy_secret and legacy_secret != "change-me-in-production":
        return legacy_secret

    if "sqlite" in (settings.database_url or "").lower():
        return "local-dev-auth-secret"

    raise RuntimeError(
        "AUTH_TOKEN_SECRET must be configured for non-local environments. "
        "ADMIN_PASSWORD can only act as a compatibility fallback when it is explicitly set."
    )


def hash_password(password: str) -> str:
    if not password:
        raise ValueError("Password is required")

    salt = secrets.token_bytes(16)
    derived = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        PASSWORD_HASH_ITERATIONS,
    )
    return (
        f"{PASSWORD_HASH_ALGORITHM}$"
        f"{PASSWORD_HASH_ITERATIONS}$"
        f"{_b64url_encode(salt)}$"
        f"{_b64url_encode(derived)}"
    )


def verify_password(password: str, password_hash: str) -> bool:
    try:
        algorithm, iterations_raw, salt_raw, digest_raw = password_hash.split("$", 3)
        if algorithm != PASSWORD_HASH_ALGORITHM:
            return False
        iterations = int(iterations_raw)
        salt = _b64url_decode(salt_raw)
        expected_digest = _b64url_decode(digest_raw)
    except (ValueError, TypeError, binascii.Error):
        return False

    derived = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        iterations,
    )
    return hmac.compare_digest(derived, expected_digest)


def issue_access_token(user_id: int) -> str:
    issued_at = datetime.utcnow()
    expires_at = issued_at + timedelta(hours=int(getattr(settings, "auth_token_expiration_hours", 24)))
    header = {"alg": TOKEN_ALGORITHM, "typ": "JWT"}
    payload = {
        "sub": str(user_id),
        "iat": int(issued_at.timestamp()),
        "exp": int(expires_at.timestamp()),
    }

    encoded_header = _b64url_encode(json.dumps(header, separators=(",", ":"), sort_keys=True).encode("utf-8"))
    encoded_payload = _b64url_encode(json.dumps(payload, separators=(",", ":"), sort_keys=True).encode("utf-8"))
    signing_input = f"{encoded_header}.{encoded_payload}".encode("utf-8")
    signature = hmac.new(_token_secret().encode("utf-8"), signing_input, hashlib.sha256).digest()
    return f"{encoded_header}.{encoded_payload}.{_b64url_encode(signature)}"


def decode_access_token(token: str) -> dict[str, Any]:
    try:
        encoded_header, encoded_payload, encoded_signature = token.split(".", 2)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from exc

    signing_input = f"{encoded_header}.{encoded_payload}".encode("utf-8")
    expected_signature = hmac.new(_token_secret().encode("utf-8"), signing_input, hashlib.sha256).digest()

    try:
        provided_signature = _b64url_decode(encoded_signature)
    except (ValueError, binascii.Error) as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from exc

    if not hmac.compare_digest(expected_signature, provided_signature):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    try:
        header = json.loads(_b64url_decode(encoded_header))
        payload = json.loads(_b64url_decode(encoded_payload))
    except (ValueError, TypeError, json.JSONDecodeError, binascii.Error) as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from exc

    if header.get("alg") != TOKEN_ALGORITHM:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    if not isinstance(payload.get("sub"), str):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    expires_at = payload.get("exp")
    if not isinstance(expires_at, int) or expires_at <= int(datetime.utcnow().timestamp()):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")

    return payload


def ensure_bootstrap_users() -> None:
    raw = (getattr(settings, "bootstrap_users_json", "") or "").strip()
    if not raw:
        return

    try:
        user_specs = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise RuntimeError("BOOTSTRAP_USERS_JSON must be valid JSON") from exc

    if not isinstance(user_specs, list):
        raise RuntimeError("BOOTSTRAP_USERS_JSON must be a JSON array")

    from database import SessionLocal
    from models import User

    db = SessionLocal()
    try:
        for spec in user_specs:
            if not isinstance(spec, dict):
                raise RuntimeError("Each bootstrap user must be a JSON object")

            email = str(spec.get("email", "")).strip().lower()
            password = str(spec.get("password", ""))
            role = normalize_role(str(spec.get("role", "")))
            name_value = spec.get("name")
            name = str(name_value).strip() if isinstance(name_value, str) and name_value.strip() else None
            active = bool(spec.get("active", True))

            if not email or "@" not in email:
                raise RuntimeError("Bootstrap users require a valid email")
            if not password:
                raise RuntimeError(f"Bootstrap user {email} is missing a password")

            user = db.query(User).filter(User.email == email).first()
            if user is None:
                user = User(email=email)
                db.add(user)

            user.name = name
            user.password_hash = hash_password(password)
            user.role = role
            user.active = active

        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
