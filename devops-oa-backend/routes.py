"""API routes for the DevOps OA backend."""

import secrets
import os
import enum
from datetime import datetime
from typing import Any, Optional, List, Literal
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse, Response, RedirectResponse
from sqlalchemy import func, inspect, text
from sqlalchemy.orm import Session, joinedload
from pydantic import BaseModel, Field

from auth import (
    get_current_user,
    has_permission,
    permissions_for_user,
    requires_permissions,
    requires_roles,
    role_for_user,
)
from config import get_settings
from database import get_db
from models import (
    AssessmentLink,
    Attempt,
    Submission,
    Application,
    ApplicationStatus,
    Evaluation,
    InterviewAssignment,
    ProgressSnapshot,
    DecisionStatus,
    Role,
    User,
)
from storage import upload_resume, download_resume, is_supabase_path, get_supabase_storage

router = APIRouter()
settings = get_settings()

# Local uploads fallback when Supabase is not configured
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads", "resumes")
os.makedirs(UPLOAD_DIR, exist_ok=True)


# ============================================================================
# Health Check
# ============================================================================

def _persistence_info():
    """Return database and storage backend types (no secrets)."""
    db_url = (settings.database_url or "").lower()
    database = "postgres" if "postgres" in db_url else "sqlite"
    storage = "supabase" if (settings.supabase_url and settings.supabase_key) else "local"
    return {"database": database, "storage": storage}


@router.get("/health")
async def health_check():
    """Health check endpoint to verify API is running and report persistence backends."""
    return {
        "status": "OK",
        "message": "Your API is running",
        "timestamp": datetime.utcnow().isoformat(),
        "persistence": _persistence_info(),
    }


@router.get("/health/persistence")
async def health_persistence(db: Session = Depends(get_db)):
    """
    Verify persistent storage is reachable.
    Returns 200 if DB and (when configured) Supabase storage are working.
    """
    from sqlalchemy import text
    from storage import get_supabase_storage
    out = {"database": "ok", "storage": None}
    # 1. Database: run a trivial read
    db.execute(text("SELECT 1"))
    # 2. Storage: if Supabase configured, verify connection
    client = get_supabase_storage()
    if client:
        try:
            client.storage.list_buckets()
            out["storage"] = "ok"
        except Exception as e:
            raise HTTPException(status_code=503, detail=f"Storage unreachable: {e}")
    else:
        out["storage"] = "local"
    return {"status": "OK", "checks": out, "persistence": _persistence_info()}


# ============================================================================
# Pydantic Schemas
# ============================================================================

# Application schemas
class ApplicationResponse(BaseModel):
    """Response for application submission."""
    id: int
    name: str
    email: str
    status: str
    created_at: datetime
    message: str


class ApplicationListItem(BaseModel):
    """Application item for admin list view."""
    id: int
    name: str
    email: str
    interest: Optional[str]
    resume_filename: Optional[str]
    resume_url: Optional[str] = None
    status: str
    final_decision: str
    cycle_name: Optional[str]
    created_at: datetime
    reviewed_at: Optional[datetime]
    notes: Optional[str]
    has_assessment_link: bool
    assessment_completed: bool = False
    assessment_token: Optional[str] = None
    focus_loss_events: int = 0
    is_flagged: bool = False
    integrity_notes: Optional[str] = None
    archived_at: Optional[datetime] = None
    recruiting_status: str
    current_round: Optional[str] = None


class EvaluationRecommendation(str, enum.Enum):
    YES = "YES"
    LEAN_YES = "LEAN YES"
    MAYBE = "MAYBE"
    LEAN_NO = "LEAN NO"
    NO = "NO"


class EvaluationPayload(BaseModel):
    interviewer_name: str = Field(min_length=1, max_length=100)
    interviewee_name: str = Field(min_length=1, max_length=255)
    interviewee_gender: Literal["Male", "Female", "Other"]
    interviewer_role: Literal["Primary", "Secondary"]
    round: Literal["Round 1", "Round 2"]
    leadership_score: int = Field(ge=1, le=3)
    interest_in_otcr_score: int = Field(ge=1, le=3)
    behavioral_performance_score: int = Field(ge=1, le=3)
    business_acumen_score: int = Field(ge=1, le=3)
    qualitative_creativity_score: int = Field(ge=1, le=3)
    quantitative_structure_score: int = Field(ge=1, le=3)
    case_performance_score: int = Field(ge=1, le=3)
    creativity_conversation_score: int = Field(ge=1, le=3)
    recommendation: EvaluationRecommendation
    final_round_summary: str = Field(min_length=1)
    overall_performance_overview: str = Field(min_length=1)


class EvaluationResponse(BaseModel):
    id: int
    application_id: int
    applicant_name: str
    applicant_email: str
    interviewer_name: str
    interviewee_name: str
    interviewee_gender: str
    interviewer_role: str
    round: str
    leadership_score: int
    interest_in_otcr_score: int
    behavioral_performance_score: int
    business_acumen_score: int
    qualitative_creativity_score: int
    quantitative_structure_score: int
    case_performance_score: int
    creativity_conversation_score: int
    recommendation: str
    recommendation_bucket: str
    final_round_summary: Optional[str] = None
    overall_performance_overview: Optional[str] = None
    comments: Optional[str] = None
    created_at: datetime


class AssignableUserResponse(BaseModel):
    id: int
    email: str
    name: Optional[str]
    role: str
    active: bool


class InterviewAssignmentResponse(BaseModel):
    id: int
    application_id: int
    applicant_name: str
    applicant_email: str
    interest: Optional[str] = None
    notes: Optional[str] = None
    cycle_name: Optional[str] = None
    status: str
    recruiting_status: str
    current_round: Optional[str] = None
    final_decision: str
    role: Literal["primary", "secondary"]
    round: Literal["Round 1", "Round 2"]
    interviewer_id: int
    interviewer_name: Optional[str]
    interviewer_email: str
    interviewer_role: str
    assigned_by_user_id: Optional[int] = None
    assigned_by_user_name: Optional[str] = None
    assigned_at: datetime
    room: Optional[str] = None
    scheduled_time: Optional[datetime] = None


class UpsertInterviewAssignmentsRequest(BaseModel):
    round: Literal["Round 1", "Round 2"]
    primary_interviewer_id: int
    secondary_interviewer_id: int
    room: Optional[str] = None
    scheduled_time: Optional[datetime] = None


class ApplicationDecisionRequest(BaseModel):
    action: Literal[
        "reject_after_application_review",
        "advance_to_round_1",
        "reject_after_round_1",
        "advance_to_round_2",
        "reject_after_round_2",
        "accept_final",
    ]
    notes: Optional[str] = None


class DatabaseTableSummary(BaseModel):
    table: str
    count: int


class DatabaseOverviewResponse(BaseModel):
    generated_at: datetime
    persistence: dict[str, str]
    tables: List[DatabaseTableSummary]


class DatabaseTablePreviewResponse(BaseModel):
    table: str
    count: int
    columns: List[str]
    rows: List[dict[str, Any]]


class ApproveApplicationRequest(BaseModel):
    """Request to approve an application."""
    notes: Optional[str] = None


def _extract_resume_url(application: Application) -> Optional[str]:
    """Return a usable resume URL from stored file info or seeded spreadsheet metadata."""
    if application.resume_path and not os.path.isfile(application.resume_path) and not is_supabase_path(application.resume_path):
        # If a non-file URL was stored directly, use it.
        if application.resume_path.startswith("http://") or application.resume_path.startswith("https://"):
            return application.resume_path

    data = application.application_data or {}
    if isinstance(data, dict):
        raw = data.get("Resume Link") or data.get("resume_link") or data.get("resumeUrl")
        if isinstance(raw, str):
            value = raw.strip()
            if value.startswith("http://") or value.startswith("https://"):
                return value
    return None


def _clean_decision_notes(notes: Optional[str]) -> str:
    return "\n".join(
        line.rstrip()
        for line in (notes or "").splitlines()
        if not line.strip().lower().startswith("decision:")
    ).strip()


def _append_decision_note(notes: Optional[str], decision_label: str, extra_notes: Optional[str] = None) -> str:
    pieces: list[str] = []
    cleaned_notes = _clean_decision_notes(notes)
    if cleaned_notes:
        pieces.append(cleaned_notes)
    if extra_notes:
        cleaned_extra_notes = extra_notes.strip()
        if cleaned_extra_notes:
            pieces.append(cleaned_extra_notes)
    pieces.append(f"Decision: {decision_label}")
    return "\n".join(piece for piece in pieces if piece.strip())


def _collect_application_rounds(application: Application) -> set[str]:
    rounds = {
        (assignment.round or "").strip().lower()
        for assignment in (application.interview_assignments or [])
        if assignment.round
    }
    rounds.update(
        (evaluation.round or "").strip().lower()
        for evaluation in (application.evaluations or [])
        if evaluation.round
    )
    return {round_name for round_name in rounds if round_name}


def _derive_recruiting_status(application: Application) -> tuple[str, Optional[str]]:
    rounds = _collect_application_rounds(application)
    notes = (application.notes or "").lower()

    if application.final_decision == DecisionStatus.YES:
        return "accepted", None
    if application.status == ApplicationStatus.REJECTED.value or application.final_decision == DecisionStatus.NO:
        return "rejected", None
    if "advanced to round 2" in notes or "round 2" in rounds:
        return "round_2", "Round 2"
    if "advanced to round 1" in notes or "round 1" in rounds:
        return "round_1", "Round 1"
    return "applied", None


def _user_to_assignable_response(user: User) -> AssignableUserResponse:
    return AssignableUserResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        role=role_for_user(user),
        active=user.active,
    )


def _recommendation_bucket(recommendation: EvaluationRecommendation | str) -> DecisionStatus:
    if recommendation in (EvaluationRecommendation.YES, EvaluationRecommendation.LEAN_YES, "YES", "LEAN YES"):
        return DecisionStatus.YES
    if recommendation in (EvaluationRecommendation.NO, EvaluationRecommendation.LEAN_NO, "NO", "LEAN NO"):
        return DecisionStatus.NO
    return DecisionStatus.MAYBE


def _evaluation_recommendation_label(evaluation: Evaluation) -> str:
    if evaluation.recommendation_label:
        return evaluation.recommendation_label
    if evaluation.recommendation:
        return evaluation.recommendation.value if isinstance(evaluation.recommendation, enum.Enum) else evaluation.recommendation
    return EvaluationRecommendation.MAYBE.value


def _normalize_rubric_score(score: Optional[int], default: int = 2) -> int:
    if score is None:
        return default
    if score < 1:
        return 1
    if score > 3:
        return 3
    return score


def _evaluation_to_response(evaluation: Evaluation) -> EvaluationResponse:
    recommendation_label = _evaluation_recommendation_label(evaluation)
    recommendation_bucket = (
        evaluation.recommendation.value
        if isinstance(evaluation.recommendation, enum.Enum)
        else evaluation.recommendation or _recommendation_bucket(recommendation_label).value
    )

    return EvaluationResponse(
        id=evaluation.id,
        application_id=evaluation.application_id,
        applicant_name=evaluation.application.name if evaluation.application else "",
        applicant_email=evaluation.application.email if evaluation.application else "",
        interviewer_name=evaluation.interviewer_name,
        interviewee_name=evaluation.interviewee_name or (evaluation.application.name if evaluation.application else ""),
        interviewee_gender=evaluation.interviewee_gender or "Other",
        interviewer_role=evaluation.interviewer_role or "Primary",
        round=evaluation.round or "Round 1",
        leadership_score=_normalize_rubric_score(evaluation.leadership_score),
        interest_in_otcr_score=_normalize_rubric_score(evaluation.interest_in_otcr_score),
        behavioral_performance_score=_normalize_rubric_score(evaluation.behavioral_performance_score),
        business_acumen_score=_normalize_rubric_score(evaluation.business_acumen_score),
        qualitative_creativity_score=_normalize_rubric_score(evaluation.qualitative_creativity_score),
        quantitative_structure_score=_normalize_rubric_score(evaluation.quantitative_structure_score),
        case_performance_score=_normalize_rubric_score(evaluation.case_performance_score),
        creativity_conversation_score=_normalize_rubric_score(evaluation.creativity_conversation_score),
        recommendation=recommendation_label,
        recommendation_bucket=recommendation_bucket,
        final_round_summary=evaluation.final_round_summary,
        overall_performance_overview=evaluation.overall_performance_overview,
        comments=evaluation.comments,
        created_at=evaluation.created_at,
    )


def _assignment_to_response(assignment: InterviewAssignment) -> InterviewAssignmentResponse:
    application = assignment.application
    if application is None:
        raise HTTPException(status_code=500, detail="Assignment missing application relationship.")

    recruiting_status, current_round = _derive_recruiting_status(application)
    interviewer = assignment.interviewer
    assigned_by_user = assignment.assigned_by_user

    return InterviewAssignmentResponse(
        id=assignment.id,
        application_id=application.id,
        applicant_name=application.name,
        applicant_email=application.email,
        interest=application.interest,
        notes=application.notes,
        cycle_name=application.cycle.name if application.cycle else None,
        status=application.status,
        recruiting_status=recruiting_status,
        current_round=current_round,
        final_decision=application.final_decision.value,
        role=assignment.role,
        round=assignment.round,
        interviewer_id=assignment.interviewer_id,
        interviewer_name=interviewer.name if interviewer else None,
        interviewer_email=interviewer.email if interviewer else "",
        interviewer_role=role_for_user(interviewer) if interviewer else "",
        assigned_by_user_id=assignment.assigned_by_user_id,
        assigned_by_user_name=assigned_by_user.name if assigned_by_user else None,
        assigned_at=assignment.assigned_at,
        room=assignment.room,
        scheduled_time=assignment.scheduled_time,
    )


def _application_to_list_item(application: Application) -> ApplicationListItem:
    attempt = None
    assessment_token = None
    if application.assessment_link:
        link = application.assessment_link
        assessment_token = link.token
        if link.attempts:
            attempt = link.attempts[0]

    recruiting_status, current_round = _derive_recruiting_status(application)

    return ApplicationListItem(
        id=application.id,
        name=application.name,
        email=application.email,
        interest=application.interest,
        resume_filename=application.resume_filename,
        resume_url=_extract_resume_url(application),
        status=application.status,
        final_decision=application.final_decision.value,
        cycle_name=application.cycle.name if application.cycle else None,
        created_at=application.created_at,
        reviewed_at=application.reviewed_at,
        notes=application.notes,
        has_assessment_link=application.assessment_link_id is not None,
        assessment_completed=attempt.completed_at is not None if attempt else False,
        assessment_token=assessment_token,
        focus_loss_events=attempt.focus_loss_events if attempt else 0,
        is_flagged=attempt.is_flagged if attempt else False,
        integrity_notes=attempt.integrity_notes if attempt else None,
        archived_at=application.archived_at,
        recruiting_status=recruiting_status,
        current_round=current_round,
    )


DATABASE_PREVIEW_TABLES = {
    "applications": "created_at",
    "evaluations": "created_at",
    "interview_assignments": "assigned_at",
    "assessment_links": "created_at",
    "attempts": "started_at",
    "submissions": "submitted_at",
    "cycles": "id",
    "assessment_progress_snapshots": "snapshot_at",
    "users": "created_at",
}


def _serialize_db_value(value: Any) -> Any:
    if isinstance(value, enum.Enum):
        return value.value
    if isinstance(value, datetime):
        return value.isoformat()
    return value


class CreateLinkRequest(BaseModel):
    """Request to create an assessment link."""
    email: Optional[str] = None  # Email required to start the assessment
    label: Optional[str] = None
    expires_at: Optional[datetime] = None


class CreateLinkResponse(BaseModel):
    """Response with created link details."""
    token: str
    url: str
    email: Optional[str] = None
    label: Optional[str] = None
    expires_at: Optional[datetime] = None


class StartAssessmentRequest(BaseModel):
    """Request to start assessment with email verification."""
    email: str


class QuestionOption(BaseModel):
    """Option for MCQ questions."""
    id: str
    text: str


class Question(BaseModel):
    """Problem-solving question."""
    id: str
    type: str  # "mcq" or "short_answer"
    questionText: str
    options: Optional[List[QuestionOption]] = None


class CodingProblem(BaseModel):
    """Coding problem definition."""
    title: str
    description: str
    starterCode: str
    testCases: List[dict]  # Visible test cases for the candidate


class AssessmentConfig(BaseModel):
    """Full assessment configuration."""
    estimatedMinutes: int
    timeLimitMinutes: Optional[int] = None
    sections: List[str]
    problemSolving: dict
    coding: dict
    systemDesign: dict


class ProgressResponse(BaseModel):
    """Response with attempt progress."""
    started_at: datetime
    last_activity_at: datetime
    completed_at: Optional[datetime] = None
    sections_completed: List[str]


class SubmitRequest(BaseModel):
    """Request to submit a section."""
    section: str  # problem_solving, coding, system_design
    payload: dict


class SubmitResponse(BaseModel):
    """Response after submission."""
    success: bool
    section: str
    coding_result: Optional[dict] = None  # Only for coding section


class ResultResponse(BaseModel):
    """Minimal result view for candidate."""
    submitted_at: Optional[datetime] = None
    sections_completed: List[str]
    completed: bool


class AuthenticatedUserResponse(BaseModel):
    id: int
    email: str
    name: Optional[str]
    role: str
    active: bool
    permissions: List[str]


class MyApplicationResponse(BaseModel):
    id: int
    name: str
    email: str
    status: str
    final_decision: str
    created_at: datetime
    reviewed_at: Optional[datetime]
    assessment_token: Optional[str] = None
    assessment_url: Optional[str] = None
    assessment_completed: bool = False
    sections_completed: List[str] = Field(default_factory=list)
    evaluation_count: int = 0
    latest_interview_round: Optional[str] = None


def _user_to_response(user: User) -> AuthenticatedUserResponse:
    return AuthenticatedUserResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        role=role_for_user(user),
        active=user.active,
        permissions=permissions_for_user(user),
    )


def _evaluation_identity_candidates(user: User) -> list[str]:
    identities = {user.email.strip().lower()}
    if user.name:
        identities.add(user.name.strip().lower())
    return sorted(value for value in identities if value)


# ============================================================================
# Application Endpoints (Public)
# ============================================================================

@router.post("/applications", response_model=ApplicationResponse)
async def submit_application(
    name: str = Form(...),
    email: str = Form(...),
    interest: str = Form(""),
    resume: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """Submit an application with resume."""
    # Validate email format
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Invalid email address")
    
    # Check for existing application with same email
    existing = db.query(Application).filter(Application.email == email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=400, 
            detail="An application with this email already exists. Please contact us if you need to update your application."
        )
    
    # Save resume file (Supabase Storage or local disk)
    file_ext = os.path.splitext(resume.filename)[1] if resume.filename else ".pdf"
    safe_filename = f"{secrets.token_urlsafe(16)}{file_ext}"
    contents = await resume.read()
    content_type = "application/pdf" if file_ext.lower() == ".pdf" else "application/octet-stream"

    if get_supabase_storage():
        ok, err = upload_resume(safe_filename, contents, content_type)
        if not ok:
            raise HTTPException(status_code=500, detail=f"Failed to save resume to storage. {err}".strip())
        resume_path = safe_filename  # storage object key
    else:
        file_path = os.path.join(UPLOAD_DIR, safe_filename)
        try:
            with open(file_path, "wb") as f:
                f.write(contents)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to save resume: {str(e)}")
        resume_path = file_path

    # Create application
    application = Application(
        name=name.strip(),
        email=email.lower().strip(),
        interest=interest.strip() if interest else None,
        resume_filename=resume.filename,
        resume_path=resume_path,
        status=ApplicationStatus.PENDING.value,
    )
    db.add(application)
    db.commit()
    db.refresh(application)
    
    return ApplicationResponse(
        id=application.id,
        name=application.name,
        email=application.email,
        status=application.status,
        created_at=application.created_at,
        message="Your application has been submitted successfully! We'll review it and get back to you soon.",
    )


@router.get("/applications/check/{email}")
async def check_application_status(email: str, db: Session = Depends(get_db)):
    """Check application status by email (public)."""
    application = db.query(Application).filter(
        Application.email == email.lower()
    ).first()
    
    if not application:
        return {"found": False, "message": "No application found with this email."}
    
    response = {
        "found": True,
        "status": application.status,
        "name": application.name,
        "created_at": application.created_at,
    }
    
    # If approved and has assessment link, include token
    if application.status == ApplicationStatus.APPROVED.value and application.assessment_link:
        response["assessment_token"] = application.assessment_link.token
        response["assessment_url"] = f"{settings.frontend_base_url}/{application.assessment_link.token}"
    
    return response


# ============================================================================
# Authenticated User Endpoints
# ============================================================================

@router.get("/auth/me", response_model=AuthenticatedUserResponse)
async def get_authenticated_user(
    current_user: User = Depends(get_current_user),
):
    """Return the authenticated Microsoft Entra user plus resolved backend role/permissions."""
    return _user_to_response(current_user)


@router.get("/auth/me/application", response_model=MyApplicationResponse)
async def get_my_application(
    db: Session = Depends(get_db),
    current_user: User = Depends(requires_roles(Role.APPLICANT)),
):
    """Return the signed-in applicant's own application and interview progress."""
    application = (
        db.query(Application)
        .options(
            joinedload(Application.assessment_link).joinedload(AssessmentLink.attempts),
            joinedload(Application.evaluations),
        )
        .filter(Application.email == current_user.email)
        .first()
    )
    if not application:
        raise HTTPException(status_code=404, detail="Application not found for the signed-in user.")

    attempt = None
    assessment_token = None
    assessment_url = None
    if application.assessment_link:
        assessment_token = application.assessment_link.token
        assessment_url = f"{settings.frontend_base_url}/{assessment_token}"
        if application.assessment_link.attempts:
            attempt = max(
                application.assessment_link.attempts,
                key=lambda entry: entry.started_at or datetime.min,
            )

    latest_evaluation = None
    if application.evaluations:
        latest_evaluation = max(
            application.evaluations,
            key=lambda entry: entry.created_at or datetime.min,
        )

    return MyApplicationResponse(
        id=application.id,
        name=application.name,
        email=application.email,
        status=application.status,
        final_decision=application.final_decision.value,
        created_at=application.created_at,
        reviewed_at=application.reviewed_at,
        assessment_token=assessment_token,
        assessment_url=assessment_url,
        assessment_completed=bool(attempt and attempt.completed_at),
        sections_completed=list(attempt.sections_completed or []) if attempt else [],
        evaluation_count=len(application.evaluations or []),
        latest_interview_round=latest_evaluation.round if latest_evaluation else None,
    )


@router.get("/auth/me/interviews", response_model=List[EvaluationResponse])
async def list_my_interviews(
    application_id: Optional[int] = None,
    limit: int = 250,
    db: Session = Depends(get_db),
    current_user: User = Depends(requires_permissions("view_assigned_interviews")),
):
    """Return evaluations authored by the signed-in interviewer."""
    identities = _evaluation_identity_candidates(current_user)
    query = db.query(Evaluation).options(joinedload(Evaluation.application))

    if identities:
        query = query.filter(func.lower(Evaluation.interviewer_name).in_(identities))
    if application_id is not None:
        query = query.filter(Evaluation.application_id == application_id)

    evaluations = (
        query.order_by(Evaluation.created_at.desc(), Evaluation.id.desc())
        .limit(max(1, min(limit, 500)))
        .all()
    )
    return [_evaluation_to_response(evaluation) for evaluation in evaluations]


@router.get("/auth/me/assigned-interviews", response_model=List[InterviewAssignmentResponse])
async def list_my_assigned_interviews(
    db: Session = Depends(get_db),
    current_user: User = Depends(requires_permissions("view_assigned_interviews")),
):
    """Return interview assignments scoped to the signed-in interviewer."""
    assignments = (
        db.query(InterviewAssignment)
        .options(
            joinedload(InterviewAssignment.application).joinedload(Application.cycle),
            joinedload(InterviewAssignment.application).joinedload(Application.evaluations),
            joinedload(InterviewAssignment.application).joinedload(Application.interview_assignments),
            joinedload(InterviewAssignment.interviewer),
            joinedload(InterviewAssignment.assigned_by_user),
        )
        .filter(InterviewAssignment.interviewer_id == current_user.id)
        .order_by(
            InterviewAssignment.scheduled_time.is_(None),
            InterviewAssignment.scheduled_time.desc(),
            InterviewAssignment.assigned_at.desc(),
            InterviewAssignment.id.desc(),
        )
        .all()
    )
    return [_assignment_to_response(assignment) for assignment in assignments]


# ============================================================================
# Admin Endpoints
# ============================================================================


@router.get("/admin/interviewers", response_model=List[AssignableUserResponse])
async def list_interviewers(
    db: Session = Depends(get_db),
    _current_user: User = Depends(requires_permissions("assign_interviewers")),
):
    """List active interviewer users who can participate in staffing."""
    allowed_roles = {
        Role.CONSULTANT.value,
        Role.LC.value,
        Role.PM.value,
        Role.PARTNER.value,
        Role.EXECUTIVE.value,
        Role.ADMIN.value,
    }
    users = (
        db.query(User)
        .filter(User.active.is_(True))
        .order_by(User.name.is_(None), User.name.asc(), User.email.asc())
        .all()
    )
    return [
        _user_to_assignable_response(user)
        for user in users
        if role_for_user(user) in allowed_roles
    ]


@router.get("/admin/assignments", response_model=List[InterviewAssignmentResponse])
async def list_assignments(
    application_id: Optional[int] = None,
    db: Session = Depends(get_db),
    _current_user: User = Depends(requires_permissions("view_all_applicants")),
):
    """List interview staffing assignments."""
    query = db.query(InterviewAssignment).options(
        joinedload(InterviewAssignment.application).joinedload(Application.cycle),
        joinedload(InterviewAssignment.application).joinedload(Application.evaluations),
        joinedload(InterviewAssignment.application).joinedload(Application.interview_assignments),
        joinedload(InterviewAssignment.interviewer),
        joinedload(InterviewAssignment.assigned_by_user),
    )
    if application_id is not None:
        query = query.filter(InterviewAssignment.application_id == application_id)

    assignments = query.order_by(
        InterviewAssignment.scheduled_time.desc(),
        InterviewAssignment.assigned_at.desc(),
        InterviewAssignment.id.desc(),
    ).all()
    return [_assignment_to_response(assignment) for assignment in assignments]


@router.put("/admin/applications/{application_id}/assignments", response_model=List[InterviewAssignmentResponse])
async def upsert_assignments(
    application_id: int,
    payload: UpsertInterviewAssignmentsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(requires_permissions("assign_interviewers")),
):
    """Create or update the primary/secondary interviewer assignments for an application round."""
    application = (
        db.query(Application)
        .options(
            joinedload(Application.cycle),
            joinedload(Application.evaluations),
            joinedload(Application.interview_assignments),
        )
        .filter(Application.id == application_id)
        .first()
    )
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    primary_user = db.query(User).filter(User.id == payload.primary_interviewer_id, User.active.is_(True)).first()
    secondary_user = db.query(User).filter(User.id == payload.secondary_interviewer_id, User.active.is_(True)).first()
    if not primary_user or not secondary_user:
        raise HTTPException(status_code=400, detail="Both primary and secondary interviewers are required.")

    primary_role = role_for_user(primary_user)
    secondary_role = role_for_user(secondary_user)
    if primary_role not in {Role.PM.value, Role.PARTNER.value, Role.EXECUTIVE.value, Role.ADMIN.value}:
        raise HTTPException(status_code=400, detail="Primary interviewer must be PM, Partner, Executive, or Admin.")
    if secondary_role not in {Role.CONSULTANT.value, Role.LC.value}:
        raise HTTPException(status_code=400, detail="Secondary interviewer must be Consultant or LC.")

    existing_assignments = (
        db.query(InterviewAssignment)
        .filter(
            InterviewAssignment.application_id == application.id,
            InterviewAssignment.round == payload.round,
        )
        .all()
    )
    assignment_by_role = {assignment.role: assignment for assignment in existing_assignments}
    assigned_at = datetime.utcnow()
    shared_room = payload.room.strip() if payload.room else None

    next_assignments = [
        ("primary", primary_user.id),
        ("secondary", secondary_user.id),
    ]

    persisted_assignments: list[InterviewAssignment] = []
    for role_name, interviewer_id in next_assignments:
        assignment = assignment_by_role.get(role_name)
        if assignment is None:
            assignment = InterviewAssignment(
                application_id=application.id,
                round=payload.round,
                role=role_name,
                interviewer_id=interviewer_id,
            )
            db.add(assignment)

        assignment.interviewer_id = interviewer_id
        assignment.assigned_by_user_id = current_user.id
        assignment.assigned_at = assigned_at
        assignment.room = shared_room
        assignment.scheduled_time = payload.scheduled_time
        persisted_assignments.append(assignment)

    for role_name, assignment in assignment_by_role.items():
        if role_name not in {"primary", "secondary"}:
            db.delete(assignment)

    application.reviewed_at = datetime.utcnow()
    db.commit()

    assignments = (
        db.query(InterviewAssignment)
        .options(
            joinedload(InterviewAssignment.application).joinedload(Application.cycle),
            joinedload(InterviewAssignment.application).joinedload(Application.evaluations),
            joinedload(InterviewAssignment.application).joinedload(Application.interview_assignments),
            joinedload(InterviewAssignment.interviewer),
            joinedload(InterviewAssignment.assigned_by_user),
        )
        .filter(
            InterviewAssignment.application_id == application.id,
            InterviewAssignment.round == payload.round,
        )
        .order_by(InterviewAssignment.role.asc())
        .all()
    )
    return [_assignment_to_response(assignment) for assignment in assignments]


@router.post("/admin/applications/{application_id}/decision", response_model=ApplicationListItem)
async def update_application_decision(
    application_id: int,
    payload: ApplicationDecisionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Persist a recruiting pipeline decision for an applicant."""
    if payload.action in {
        "reject_after_application_review",
        "advance_to_round_1",
        "reject_after_round_1",
    }:
        required_permission = "decide_round_1"
    else:
        required_permission = "decide_round_2"

    if not has_permission(current_user.role, required_permission):
        raise HTTPException(
            status_code=403,
            detail="You do not have the required permissions for this resource.",
        )

    application = (
        db.query(Application)
        .options(
            joinedload(Application.assessment_link).joinedload(AssessmentLink.attempts),
            joinedload(Application.evaluations),
            joinedload(Application.interview_assignments),
            joinedload(Application.cycle),
        )
        .filter(Application.id == application_id)
        .first()
    )
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    decision_map = {
        "reject_after_application_review": ("Rejected after application review", ApplicationStatus.REJECTED.value, DecisionStatus.NO),
        "advance_to_round_1": ("Advanced to Round 1", application.status, DecisionStatus.MAYBE),
        "reject_after_round_1": ("Rejected after Round 1", ApplicationStatus.REJECTED.value, DecisionStatus.NO),
        "advance_to_round_2": ("Advanced to Round 2", application.status, DecisionStatus.MAYBE),
        "reject_after_round_2": ("Rejected after Round 2", ApplicationStatus.REJECTED.value, DecisionStatus.NO),
        "accept_final": ("Accepted final", application.status, DecisionStatus.YES),
    }

    decision_label, next_status, next_final_decision = decision_map[payload.action]
    application.status = next_status
    application.final_decision = next_final_decision
    application.reviewed_at = datetime.utcnow()
    application.notes = _append_decision_note(application.notes, decision_label, payload.notes)

    db.commit()
    db.refresh(application)
    application = (
        db.query(Application)
        .options(
            joinedload(Application.assessment_link).joinedload(AssessmentLink.attempts),
            joinedload(Application.evaluations),
            joinedload(Application.interview_assignments),
            joinedload(Application.cycle),
        )
        .filter(Application.id == application.id)
        .first()
    )
    return _application_to_list_item(application)


@router.get("/admin/applications", response_model=List[ApplicationListItem])
async def list_applications(
    status: Optional[str] = None,
    archived: Optional[str] = None,
    db: Session = Depends(get_db),
    _current_user: User = Depends(requires_permissions("view_all_applicants")),
):
    """List applications (admin only). archived=0 or omit = exclude archived; archived=1 = include; archived=only = only archived."""
    query = db.query(Application).options(
        joinedload(Application.assessment_link).joinedload(AssessmentLink.attempts),
        joinedload(Application.evaluations),
        joinedload(Application.interview_assignments),
        joinedload(Application.cycle),
    )
    if status:
        query = query.filter(Application.status == status)
    if archived is None or archived == "0" or archived == "false":
        query = query.filter(Application.archived_at.is_(None))
    elif archived == "only":
        query = query.filter(Application.archived_at.isnot(None))
    # archived=1 or "true" = include all (no filter)

    applications = query.order_by(Application.created_at.desc()).all()

    return [_application_to_list_item(app) for app in applications]


@router.get("/admin/applications/{application_id}")
async def get_application(
    application_id: int,
    db: Session = Depends(get_db),
    _current_user: User = Depends(requires_permissions("view_all_applicants")),
):
    """Get application details (admin only)."""
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    return {
        "id": application.id,
        "name": application.name,
        "email": application.email,
        "resume_filename": application.resume_filename,
        "resume_path": application.resume_path,
        "resume_url": _extract_resume_url(application),
        "status": application.status,
        "created_at": application.created_at,
        "reviewed_at": application.reviewed_at,
        "notes": application.notes,
        "assessment_link": {
            "token": application.assessment_link.token,
            "url": f"{settings.frontend_base_url}/{application.assessment_link.token}",
        } if application.assessment_link else None,
    }


@router.get("/admin/applications/{application_id}/resume")
async def get_application_resume(
    application_id: int,
    db: Session = Depends(get_db),
    _current_user: User = Depends(requires_permissions("view_all_applicants")),
):
    """Stream resume file for admin (opens in new tab). From Supabase Storage or local disk."""
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Resume not found")
    if not application.resume_path:
        resume_url = _extract_resume_url(application)
        if resume_url:
            return RedirectResponse(resume_url)
        raise HTTPException(status_code=404, detail="Resume not found")
    filename = application.resume_filename or "resume.pdf"
    media_type = "application/pdf" if filename.lower().endswith(".pdf") else "application/octet-stream"
    disposition = f"inline; filename={filename!r}"

    if is_supabase_path(application.resume_path):
        data = download_resume(application.resume_path)
        if data is None:
            raise HTTPException(status_code=404, detail="Resume file missing")
        return Response(
            content=data,
            media_type=media_type,
            headers={"Content-Disposition": disposition},
        )
    if not os.path.isfile(application.resume_path):
        resume_url = _extract_resume_url(application)
        if resume_url:
            return RedirectResponse(resume_url)
        raise HTTPException(status_code=404, detail="Resume file missing")
    return FileResponse(
        application.resume_path,
        filename=filename,
        media_type=media_type,
        headers={"Content-Disposition": disposition},
    )


@router.get("/admin/evaluations", response_model=List[EvaluationResponse])
async def list_evaluations(
    application_id: Optional[int] = None,
    limit: int = 250,
    db: Session = Depends(get_db),
    _current_user: User = Depends(requires_permissions("see_relative_score")),
):
    """List saved interviewer evaluations (admin only)."""
    query = db.query(Evaluation).options(joinedload(Evaluation.application))
    if application_id is not None:
        query = query.filter(Evaluation.application_id == application_id)

    evaluations = (
        query.order_by(Evaluation.created_at.desc(), Evaluation.id.desc())
        .limit(max(1, min(limit, 500)))
        .all()
    )

    return [_evaluation_to_response(evaluation) for evaluation in evaluations]


@router.post("/admin/applications/{application_id}/evaluations", response_model=EvaluationResponse)
async def create_evaluation(
    application_id: int,
    payload: EvaluationPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(requires_permissions("submit_feedback")),
):
    """Create an interviewer evaluation for an application (admin only)."""
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    recommendation_bucket = _recommendation_bucket(payload.recommendation)
    evaluation = Evaluation(
        application_id=application.id,
        interviewer_name=(current_user.name or current_user.email).strip(),
        round=payload.round,
        interviewee_name=payload.interviewee_name.strip(),
        interviewee_gender=payload.interviewee_gender,
        interviewer_role=payload.interviewer_role,
        leadership_score=payload.leadership_score,
        interest_in_otcr_score=payload.interest_in_otcr_score,
        behavioral_performance_score=payload.behavioral_performance_score,
        business_acumen_score=payload.business_acumen_score,
        qualitative_creativity_score=payload.qualitative_creativity_score,
        quantitative_structure_score=payload.quantitative_structure_score,
        case_performance_score=payload.case_performance_score,
        creativity_conversation_score=payload.creativity_conversation_score,
        recommendation=recommendation_bucket.value,
        recommendation_label=payload.recommendation.value,
        culture_fit_score=payload.behavioral_performance_score,
        technical_score=payload.case_performance_score,
        communication_score=payload.case_performance_score,
        comments=payload.overall_performance_overview.strip(),
        final_round_summary=payload.final_round_summary.strip(),
        overall_performance_overview=payload.overall_performance_overview.strip(),
    )

    application.reviewed_at = datetime.utcnow()

    db.add(evaluation)
    db.commit()
    db.refresh(evaluation)

    evaluation = (
        db.query(Evaluation)
        .options(joinedload(Evaluation.application))
        .filter(Evaluation.id == evaluation.id)
        .first()
    )
    return _evaluation_to_response(evaluation)


@router.put("/admin/evaluations/{evaluation_id}", response_model=EvaluationResponse)
async def update_evaluation(
    evaluation_id: int,
    payload: EvaluationPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(requires_permissions("submit_feedback")),
):
    """Update an existing interviewer evaluation."""
    evaluation = (
        db.query(Evaluation)
        .options(joinedload(Evaluation.application))
        .filter(Evaluation.id == evaluation_id)
        .first()
    )
    if not evaluation:
        raise HTTPException(status_code=404, detail="Evaluation not found")

    identities = set(_evaluation_identity_candidates(current_user))
    if (evaluation.interviewer_name or "").strip().lower() not in identities:
        raise HTTPException(status_code=403, detail="You can only edit your own feedback.")

    recommendation_bucket = _recommendation_bucket(payload.recommendation)

    evaluation.round = payload.round
    evaluation.interviewee_name = payload.interviewee_name.strip()
    evaluation.interviewee_gender = payload.interviewee_gender
    evaluation.interviewer_role = payload.interviewer_role
    evaluation.leadership_score = payload.leadership_score
    evaluation.interest_in_otcr_score = payload.interest_in_otcr_score
    evaluation.behavioral_performance_score = payload.behavioral_performance_score
    evaluation.business_acumen_score = payload.business_acumen_score
    evaluation.qualitative_creativity_score = payload.qualitative_creativity_score
    evaluation.quantitative_structure_score = payload.quantitative_structure_score
    evaluation.case_performance_score = payload.case_performance_score
    evaluation.creativity_conversation_score = payload.creativity_conversation_score
    evaluation.recommendation = recommendation_bucket.value
    evaluation.recommendation_label = payload.recommendation.value
    evaluation.culture_fit_score = payload.behavioral_performance_score
    evaluation.technical_score = payload.case_performance_score
    evaluation.communication_score = payload.case_performance_score
    evaluation.comments = payload.overall_performance_overview.strip()
    evaluation.final_round_summary = payload.final_round_summary.strip()
    evaluation.overall_performance_overview = payload.overall_performance_overview.strip()
    if evaluation.application is not None:
        evaluation.application.reviewed_at = datetime.utcnow()

    db.commit()
    db.refresh(evaluation)

    evaluation = (
        db.query(Evaluation)
        .options(joinedload(Evaluation.application))
        .filter(Evaluation.id == evaluation.id)
        .first()
    )
    return _evaluation_to_response(evaluation)


@router.get("/admin/database/overview", response_model=DatabaseOverviewResponse)
async def get_database_overview(
    db: Session = Depends(get_db),
    _current_user: User = Depends(requires_permissions("see_database")),
):
    """Return row counts for the main backend tables (admin only)."""
    inspector = inspect(db.bind)
    summaries: List[DatabaseTableSummary] = []

    for table_name in DATABASE_PREVIEW_TABLES:
        if not inspector.has_table(table_name):
            continue
        count = db.execute(text(f"SELECT COUNT(*) FROM {table_name}")).scalar() or 0
        summaries.append(DatabaseTableSummary(table=table_name, count=int(count)))

    return DatabaseOverviewResponse(
        generated_at=datetime.utcnow(),
        persistence=_persistence_info(),
        tables=summaries,
    )


@router.get("/admin/database/tables/{table_name}", response_model=DatabaseTablePreviewResponse)
async def get_database_table_preview(
    table_name: str,
    limit: int = 25,
    db: Session = Depends(get_db),
    _current_user: User = Depends(requires_permissions("see_database")),
):
    """Return a preview of rows from a whitelisted table (admin only)."""
    if table_name not in DATABASE_PREVIEW_TABLES:
        raise HTTPException(status_code=404, detail="Unsupported table")

    inspector = inspect(db.bind)
    if not inspector.has_table(table_name):
        raise HTTPException(status_code=404, detail="Table not found")

    safe_limit = max(1, min(limit, 100))
    order_column = DATABASE_PREVIEW_TABLES[table_name]

    total_count = db.execute(text(f"SELECT COUNT(*) FROM {table_name}")).scalar() or 0
    result = db.execute(
        text(f"SELECT * FROM {table_name} ORDER BY {order_column} DESC LIMIT :limit"),
        {"limit": safe_limit},
    )

    rows = []
    for row in result.mappings().all():
        rows.append({key: _serialize_db_value(value) for key, value in row.items()})

    return DatabaseTablePreviewResponse(
        table=table_name,
        count=int(total_count),
        columns=list(result.keys()),
        rows=rows,
    )


@router.get("/admin/submissions/{token}")
async def get_submission(
    token: str,
    db: Session = Depends(get_db),
    _current_user: User = Depends(requires_permissions("see_database")),
):
    """Get all submissions for an assessment token (admin only)."""
    link = db.query(AssessmentLink).filter(AssessmentLink.token == token).first()
    if not link:
        raise HTTPException(status_code=404, detail="Assessment link not found")
    
    attempt = db.query(Attempt).filter(Attempt.link_id == link.id).first()
    if not attempt:
        raise HTTPException(status_code=404, detail="No attempt found for this assessment")
    
    submissions = db.query(Submission).filter(Submission.attempt_id == attempt.id).all()
    
    # Get the applicant name from Application if linked
    applicant_name = None
    application = db.query(Application).filter(Application.assessment_link_id == link.id).first()
    if application:
        applicant_name = application.name
    
    # Get MCQ answer key for scoring (maps question text to correct answer)
    try:
        mcq_answer_key = get_mcq_answer_key() or {}
    except Exception:
        mcq_answer_key = {}
    
    # Build a lookup by question text for matching
    answer_key_by_text = {}
    for q_id, info in (mcq_answer_key or {}).items():
        if isinstance(info, dict) and "questionText" in info and "correctAnswer" in info:
            answer_key_by_text[info["questionText"]] = info["correctAnswer"]
    
    # Process submissions to add MCQ scoring
    processed_submissions = []
    for sub in submissions:
        sub_data = {
            "section": sub.section,
            "submitted_at": sub.submitted_at,
            "payload": sub.payload,
            "coding_result": sub.coding_result,
            "notes": sub.notes,
        }
        
        # Add MCQ scoring for problem_solving section
        if sub.section == "problem_solving" and sub.payload and isinstance(sub.payload, dict):
            mcq_results = []
            correct_count = 0
            total_mcq = 0
            
            for q_id, q_data in sub.payload.items():
                # Handle both old format (just answer string) and new format (dict with metadata)
                if isinstance(q_data, dict):
                    # New enhanced format with question metadata
                    user_answer = q_data.get("answer", "")
                    question_text = q_data.get("questionText", "")
                    question_type = q_data.get("type", "mcq")
                    options = q_data.get("options", [])
                    
                    # Check if it's a short answer (manual review)
                    if question_type == "short_answer" or "short" in q_id.lower():
                        mcq_results.append({
                            "questionId": q_id,
                            "questionText": question_text,
                            "userAnswer": user_answer,
                            "isManualReview": True,
                        })
                        continue
                    
                    # MCQ: look up correct answer by question text
                    correct_answer = answer_key_by_text.get(question_text)
                    is_correct = correct_answer is not None and user_answer == correct_answer
                    
                    if correct_answer:
                        total_mcq += 1
                        if is_correct:
                            correct_count += 1
                    
                    mcq_results.append({
                        "questionId": q_id,
                        "questionText": question_text,
                        "userAnswer": user_answer,
                        "correctAnswer": correct_answer,
                        "isCorrect": is_correct,
                        "options": options,
                        "isManualReview": False,
                    })
                else:
                    # Old format: just the answer string (legacy submissions)
                    user_answer = str(q_data)
                    
                    if "short" in q_id.lower():
                        mcq_results.append({
                            "questionId": q_id,
                            "questionText": "Short Answer (legacy format)",
                            "userAnswer": user_answer,
                            "isManualReview": True,
                        })
                    else:
                        mcq_results.append({
                            "questionId": q_id,
                            "questionText": f"Question {q_id} (legacy format - cannot match)",
                            "userAnswer": user_answer,
                            "correctAnswer": None,
                            "isCorrect": None,
                            "isManualReview": False,
                        })
            
            sub_data["mcq_results"] = mcq_results
            sub_data["mcq_score"] = {"correct": correct_count, "total": total_mcq}
        
        processed_submissions.append(sub_data)
    
    # Progress snapshots (every 5 min during assessment) for timeline view
    progress_snapshots = []
    try:
        snapshots = (
            db.query(ProgressSnapshot)
            .filter(ProgressSnapshot.attempt_id == attempt.id)
            .order_by(ProgressSnapshot.snapshot_at.asc())
            .all()
        )
        for s in snapshots:
            progress_snapshots.append({
                "snapshot_at": s.snapshot_at.isoformat() if s.snapshot_at else None,
                "sections_completed": s.sections_completed or [],
                "current_section": s.current_section,
                "elapsed_seconds": s.elapsed_seconds,
                "progress_detail": s.progress_detail,
            })
    except Exception:
        # Table may not exist yet (assessment_progress_snapshots); return empty list
        progress_snapshots = []

    return {
        "token": token,
        "applicant_name": applicant_name,
        "email": link.email,
        "started_at": attempt.started_at,
        "completed_at": attempt.completed_at,
        "sections_completed": attempt.sections_completed or [],
        "focus_loss_events": attempt.focus_loss_events,
        "is_flagged": attempt.is_flagged,
        "integrity_notes": attempt.integrity_notes,
        "submissions": processed_submissions,
        "progress_snapshots": progress_snapshots,
    }


@router.post("/admin/applications/{application_id}/approve")
async def approve_application(
    application_id: int,
    request: ApproveApplicationRequest,
    db: Session = Depends(get_db),
    _current_user: User = Depends(requires_roles(Role.PARTNER, Role.EXECUTIVE)),
):
    """Approve an application and generate assessment link (admin only)."""
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    if application.status == ApplicationStatus.APPROVED.value:
        raise HTTPException(status_code=400, detail="Application already approved")
    
    # Generate assessment link
    token = secrets.token_urlsafe(16)
    link = AssessmentLink(
        token=token,
        email=application.email,  # Link is tied to this email
        label=f"Application #{application.id} - {application.name}",
    )
    db.add(link)
    db.flush()  # Get the link ID
    
    # Update application
    application.status = ApplicationStatus.APPROVED.value
    application.reviewed_at = datetime.utcnow()
    application.notes = request.notes
    application.assessment_link_id = link.id
    
    db.commit()
    
    return {
        "success": True,
        "application_id": application.id,
        "status": application.status,
        "assessment_link": {
            "token": token,
            "url": f"{settings.frontend_base_url}/{token}",
        },
    }


@router.post("/admin/applications/{application_id}/reject")
async def reject_application(
    application_id: int,
    request: ApproveApplicationRequest,
    db: Session = Depends(get_db),
    _current_user: User = Depends(requires_roles(Role.PARTNER, Role.EXECUTIVE)),
):
    """Reject an application (admin only)."""
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    application.status = ApplicationStatus.REJECTED.value
    application.reviewed_at = datetime.utcnow()
    application.notes = request.notes
    
    db.commit()
    
    return {
        "success": True,
        "application_id": application.id,
        "status": application.status,
    }


@router.post("/admin/applications/{application_id}/archive")
async def archive_application(
    application_id: int,
    db: Session = Depends(get_db),
    _current_user: User = Depends(requires_roles(Role.PARTNER, Role.EXECUTIVE)),
):
    """Archive an application (hide from default list). Admin only."""
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    application.archived_at = datetime.utcnow()
    db.commit()
    return {"success": True, "application_id": application.id, "archived": True}


@router.post("/admin/applications/{application_id}/unarchive")
async def unarchive_application(
    application_id: int,
    db: Session = Depends(get_db),
    _current_user: User = Depends(requires_roles(Role.PARTNER, Role.EXECUTIVE)),
):
    """Restore an archived application. Admin only."""
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    application.archived_at = None
    db.commit()
    return {"success": True, "application_id": application.id, "archived": False}


@router.delete("/admin/applications/{application_id}")
async def delete_application(
    application_id: int,
    db: Session = Depends(get_db),
    _current_user: User = Depends(requires_roles(Role.PARTNER, Role.EXECUTIVE)),
):
    """Permanently delete an application and its assessment link/attempts. Admin only."""
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    link_id = application.assessment_link_id
    application.assessment_link_id = None
    db.flush()
    try:
        if link_id:
            attempts = db.query(Attempt).filter(Attempt.link_id == link_id).all()
            attempt_ids = [a.id for a in attempts]

            # Delete dependent rows first to avoid FK constraint failures
            if attempt_ids:
                # Newer deployments may have progress snapshots table
                try:
                    db.query(ProgressSnapshot).filter(ProgressSnapshot.attempt_id.in_(attempt_ids)).delete(synchronize_session=False)
                except Exception:
                    # Table may not exist yet
                    pass
                db.query(Submission).filter(Submission.attempt_id.in_(attempt_ids)).delete(synchronize_session=False)

            db.query(Attempt).filter(Attempt.link_id == link_id).delete(synchronize_session=False)
            db.query(AssessmentLink).filter(AssessmentLink.id == link_id).delete(synchronize_session=False)

        db.delete(application)
        db.commit()
        return {"success": True, "application_id": application_id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete application: {e}")


@router.post("/links", response_model=CreateLinkResponse)
async def create_link(
    request: CreateLinkRequest,
    db: Session = Depends(get_db),
    _current_user: User = Depends(requires_roles(Role.PARTNER, Role.EXECUTIVE)),
):
    """Create a new assessment link (admin only)."""
    token = secrets.token_urlsafe(16)
    
    link = AssessmentLink(
        token=token,
        email=request.email.lower() if request.email else None,
        label=request.label,
        expires_at=request.expires_at,
    )
    db.add(link)
    db.commit()
    db.refresh(link)
    
    url = f"{settings.frontend_base_url}/{token}"
    
    return CreateLinkResponse(
        token=token,
        url=url,
        email=link.email,
        label=link.label,
        expires_at=link.expires_at,
    )


@router.post("/admin/test-link")
async def get_admin_test_link(
    db: Session = Depends(get_db),
    _current_user: User = Depends(requires_roles(Role.PARTNER, Role.EXECUTIVE)),
):
    """Get or create a reusable admin test link (admin only).
    
    This link can be used for testing without creating applications.
    It does not require email verification.
    """
    # Look for existing admin test link
    existing = db.query(AssessmentLink).filter(
        AssessmentLink.label == "_ADMIN_TEST_LINK_"
    ).first()
    
    if existing:
        # Delete any existing attempts so it can be reused
        db.query(Attempt).filter(Attempt.link_id == existing.id).delete()
        db.query(Submission).filter(
            Submission.attempt_id.in_(
                db.query(Attempt.id).filter(Attempt.link_id == existing.id)
            )
        ).delete(synchronize_session=False)
        db.commit()
        
        return {
            "token": existing.token,
            "url": f"{settings.frontend_base_url}/{existing.token}",
            "message": "Existing test link reset and ready to use",
        }
    
    # Create new admin test link (no email required)
    token = secrets.token_urlsafe(16)
    link = AssessmentLink(
        token=token,
        email=None,  # No email verification required
        label="_ADMIN_TEST_LINK_",
    )
    db.add(link)
    db.commit()
    db.refresh(link)
    
    return {
        "token": token,
        "url": f"{settings.frontend_base_url}/{token}",
        "message": "New test link created",
    }


# ============================================================================
# Assessment Endpoints
# ============================================================================

def get_link_or_404(token: str, db: Session) -> AssessmentLink:
    """Get assessment link by token or raise 404."""
    link = db.query(AssessmentLink).filter(AssessmentLink.token == token).first()
    if not link:
        raise HTTPException(status_code=404, detail="Assessment link not found")
    
    # Check expiry
    if link.expires_at and link.expires_at < datetime.utcnow():
        raise HTTPException(status_code=410, detail="Assessment link has expired")
    
    return link


def get_or_create_attempt(link: AssessmentLink, db: Session) -> Attempt:
    """Get existing attempt or create new one (one per link)."""
    attempt = db.query(Attempt).filter(Attempt.link_id == link.id).first()
    if not attempt:
        attempt = Attempt(link_id=link.id, sections_completed=[])
        db.add(attempt)
        db.commit()
        db.refresh(attempt)
    return attempt


@router.get("/assessment/{token}")
async def get_assessment_config(token: str, db: Session = Depends(get_db)):
    """Get assessment configuration for a token."""
    link = get_link_or_404(token, db)
    
    # Return the full assessment config plus whether email is required
    config = get_assessment_content()
    config["requiresEmail"] = link.email is not None
    
    # Add secret AI detection flag (hidden watermark)
    # This flag should be returned in submissions to verify authenticity
    config["_aiDetectionFlag"] = secrets.token_hex(16)
    
    return config


@router.get("/assessment/{token}/progress", response_model=ProgressResponse)
async def get_progress(token: str, db: Session = Depends(get_db)):
    """Get progress for an assessment attempt."""
    link = get_link_or_404(token, db)
    attempt = db.query(Attempt).filter(Attempt.link_id == link.id).first()
    
    if not attempt:
        raise HTTPException(status_code=404, detail="No attempt started yet")
    
    return ProgressResponse(
        started_at=attempt.started_at,
        last_activity_at=attempt.last_activity_at,
        completed_at=attempt.completed_at,
        sections_completed=attempt.sections_completed or [],
    )


@router.post("/assessment/{token}/start", response_model=ProgressResponse)
async def start_assessment(
    token: str,
    request: Optional[StartAssessmentRequest] = None,
    db: Session = Depends(get_db),
):
    """Start or resume an assessment attempt (idempotent).
    
    If the link has an email associated, the request must include the matching email.
    """
    link = get_link_or_404(token, db)
    
    # Verify email if required
    if link.email:
        if not request or not request.email:
            raise HTTPException(
                status_code=400, 
                detail="Email verification required to start this assessment."
            )
        if request.email.lower().strip() != link.email.lower():
            raise HTTPException(
                status_code=403, 
                detail="Email does not match. Please use the email you applied with."
            )
    
    attempt = get_or_create_attempt(link, db)
    
    return ProgressResponse(
        started_at=attempt.started_at,
        last_activity_at=attempt.last_activity_at,
        completed_at=attempt.completed_at,
        sections_completed=attempt.sections_completed or [],
    )


@router.post("/assessment/{token}/submit", response_model=SubmitResponse)
async def submit_section(
    token: str,
    request: SubmitRequest,
    db: Session = Depends(get_db),
):
    """Submit a section of the assessment."""
    link = get_link_or_404(token, db)
    attempt = get_or_create_attempt(link, db)
    
    valid_sections = ["problem_solving", "coding", "system_design"]
    if request.section not in valid_sections:
        raise HTTPException(status_code=400, detail=f"Invalid section: {request.section}")
    
    # Check if already submitted (allow override)
    existing = db.query(Submission).filter(
        Submission.attempt_id == attempt.id,
        Submission.section == request.section,
    ).first()
    
    coding_result = None
    ai_flag_present = False
    
    # Check for AI detection flag in payload
    if "_aiDetectionFlag" in request.payload:
        ai_flag_present = True
        # Remove it before storing (don't store the flag in the submission)
        request.payload.pop("_aiDetectionFlag", None)
    
    # For coding section, run against test cases
    if request.section == "coding":
        coding_result = await run_code_tests(request.payload)
    
    # Create or update submission with AI detection flag
    if existing:
        submission = existing
    else:
        submission = Submission(
            attempt_id=attempt.id,
            section=request.section,
        )
        db.add(submission)

    submission.payload = request.payload
    submission.coding_result = coding_result
    submission.submitted_at = datetime.utcnow()
    submission.notes = None
    if not ai_flag_present:
        submission.notes = "[WARNING] AI detection flag missing - possible AI assistance detected"
    
    # Update sections completed - create new list to trigger SQLAlchemy change detection
    sections_completed = list(attempt.sections_completed or [])
    if request.section not in sections_completed:
        sections_completed.append(request.section)
    attempt.sections_completed = sections_completed  # Assign new list
    attempt.last_activity_at = datetime.utcnow()
    
    # Check if all sections complete
    if set(sections_completed) == set(valid_sections):
        attempt.completed_at = datetime.utcnow()
    
    # Force SQLAlchemy to detect the change
    from sqlalchemy.orm.attributes import flag_modified
    flag_modified(attempt, "sections_completed")
    
    db.commit()
    
    return SubmitResponse(
        success=True,
        section=request.section,
        coding_result=coding_result,
    )


class TestCodeRequest(BaseModel):
    """Request to test code without submitting."""
    code: str
    language: str = "python3"


@router.post("/assessment/{token}/test-code")
async def test_code(
    token: str,
    request: TestCodeRequest,
    db: Session = Depends(get_db),
):
    """Test code against test cases without submitting (no state change)."""
    link = get_link_or_404(token, db)
    
    # Just run the tests and return results
    result = await run_code_tests({
        "code": request.code,
        "language": request.language,
    })
    
    return result


# Max character counts for progress_detail content (avoid huge snapshots)
PROGRESS_DETAIL_MAX_CODE = 100_000
PROGRESS_DETAIL_MAX_SYSTEM_DESIGN = 50_000
PROGRESS_DETAIL_MAX_ANSWER = 5_000


def _truncate_progress_detail(detail: Optional[dict]) -> Optional[dict]:
    """Truncate progress_detail content to avoid storing huge payloads."""
    if not detail:
        return detail
    out = {}
    if "problem_solving" in detail and isinstance(detail["problem_solving"], dict):
        ps = detail["problem_solving"]
        answers = ps.get("answers")
        if isinstance(answers, list):
            out["problem_solving"] = {
                "answered_count": ps.get("answered_count"),
                "total": ps.get("total"),
                "answers": [
                    {**a, "answer": (a.get("answer") or "")[:PROGRESS_DETAIL_MAX_ANSWER]}
                    for a in answers
                ],
            }
        else:
            out["problem_solving"] = ps
    if "coding" in detail and isinstance(detail["coding"], dict):
        code = (detail["coding"].get("code") or "")[:PROGRESS_DETAIL_MAX_CODE]
        out["coding"] = {"code": code}
    if "system_design" in detail and isinstance(detail["system_design"], dict):
        text = (detail["system_design"].get("response") or "")[:PROGRESS_DETAIL_MAX_SYSTEM_DESIGN]
        out["system_design"] = {"response": text}
    return out if out else detail


class ProgressSnapshotRequest(BaseModel):
    """Progress snapshot sent every 5 minutes during assessment."""
    sections_completed: List[str] = []
    current_section: Optional[str] = None
    elapsed_seconds: int = 0
    progress_detail: Optional[dict] = None  # Full content: problem_solving.answers[], coding.code, system_design.response


@router.post("/assessment/{token}/progress-snapshot")
async def record_progress_snapshot(
    token: str,
    request: ProgressSnapshotRequest,
    db: Session = Depends(get_db),
):
    """Record a progress snapshot (e.g. every 5 min). Used to show progression in submission review."""
    link = get_link_or_404(token, db)
    attempt = db.query(Attempt).filter(Attempt.link_id == link.id).first()
    if not attempt:
        raise HTTPException(status_code=404, detail="No attempt started yet")
    if attempt.completed_at:
        return {"ok": True}  # Ignore snapshots after completion

    # Limit snapshots per attempt (e.g. 50 = ~4 hours at 5-min intervals)
    existing = db.query(ProgressSnapshot).filter(ProgressSnapshot.attempt_id == attempt.id).count()
    if existing >= 50:
        return {"ok": True}

    progress_detail = _truncate_progress_detail(request.progress_detail)
    snapshot = ProgressSnapshot(
        attempt_id=attempt.id,
        sections_completed=request.sections_completed,
        current_section=request.current_section,
        elapsed_seconds=request.elapsed_seconds,
        progress_detail=progress_detail,
    )
    db.add(snapshot)
    db.commit()
    return {"ok": True}


@router.post("/assessment/{token}/focus-loss")
async def log_focus_loss(token: str, db: Session = Depends(get_db)):
    """Log when assessment window loses focus (integrity tracking)."""
    link = get_link_or_404(token, db)
    attempt = db.query(Attempt).filter(Attempt.link_id == link.id).first()
    
    if not attempt:
        raise HTTPException(status_code=404, detail="No attempt found")
    
    # Increment focus loss counter
    attempt.focus_loss_events = (attempt.focus_loss_events or 0) + 1
    
    # Flag if too many focus loss events (more than 2)
    if attempt.focus_loss_events > 2:
        attempt.is_flagged = True
        attempt.integrity_notes = f"Multiple focus loss events detected ({attempt.focus_loss_events})"
    
    attempt.last_activity_at = datetime.utcnow()
    db.commit()
    
    return {
        "success": True,
        "focus_loss_count": attempt.focus_loss_events,
        "flagged": attempt.is_flagged
    }


@router.get("/assessment/{token}/result", response_model=ResultResponse)
async def get_result(token: str, db: Session = Depends(get_db)):
    """Get minimal result view for the candidate."""
    link = get_link_or_404(token, db)
    attempt = db.query(Attempt).filter(Attempt.link_id == link.id).first()
    
    if not attempt:
        return ResultResponse(
            submitted_at=None,
            sections_completed=[],
            completed=False,
        )
    
    return ResultResponse(
        submitted_at=attempt.completed_at,
        sections_completed=attempt.sections_completed or [],
        completed=attempt.completed_at is not None,
    )


# ============================================================================
# Code Execution (Judge0/Piston)
# ============================================================================

async def run_code_tests(payload: dict) -> dict:
    """Run code against test cases using Judge0 or Piston."""
    code = payload.get("code", "")
    language = payload.get("language", "python3")
    
    # Get test cases from assessment content
    content = get_assessment_content()
    test_cases = content["coding"]["testCases"]
    hidden_tests = content["coding"].get("hiddenTestCases", [])
    all_tests = test_cases + hidden_tests
    
    results = []
    passed = 0
    total = len(all_tests)
    
    for i, test in enumerate(all_tests):
        test_input = test.get("input", "")
        expected_output = test.get("expectedOutput", "").strip()
        
        try:
            # Execute code
            result = await execute_code(code, test_input, language)
            actual_output = result.get("stdout", "").strip()
            is_pass = actual_output == expected_output
            
            if is_pass:
                passed += 1
            
            results.append({
                "test": i + 1,
                "passed": is_pass,
                "expected": expected_output if i < len(test_cases) else "[hidden]",
                "actual": actual_output if i < len(test_cases) else "[hidden]",
                "error": result.get("stderr", "") or result.get("compile_output", ""),
            })
        except Exception as e:
            results.append({
                "test": i + 1,
                "passed": False,
                "error": str(e),
            })
    
    return {
        "passed": passed,
        "total": total,
        "details": results[:len(test_cases)],  # Only show visible test results
    }


async def execute_code(code: str, stdin: str, language: str) -> dict:
    """Execute code - uses local mock if no API key, otherwise Judge0."""
    # If no API key, use local mock execution
    if not settings.code_exec_api_key:
        return mock_execute_code(code, stdin)
    
    # Use Judge0 API
    return await execute_code_judge0(code, stdin, language)


def mock_execute_code(code: str, stdin: str) -> dict:
    """Mock code execution for local development without Judge0 API key."""
    import subprocess
    import tempfile
    import os
    
    try:
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
            f.write(code)
            f.flush()
            temp_path = f.name
        
        result = subprocess.run(
            ['python3', temp_path],
            input=stdin,
            capture_output=True,
            text=True,
            timeout=5,
        )
        
        os.unlink(temp_path)
        
        return {
            "stdout": result.stdout,
            "stderr": result.stderr,
            "compile_output": "",
            "status": "Accepted" if result.returncode == 0 else "Runtime Error",
        }
    except subprocess.TimeoutExpired:
        if 'temp_path' in locals():
            os.unlink(temp_path)
        return {
            "stdout": "",
            "stderr": "Time Limit Exceeded",
            "compile_output": "",
            "status": "Time Limit Exceeded",
        }
    except Exception as e:
        if 'temp_path' in locals():
            try:
                os.unlink(temp_path)
            except:
                pass
        return {
            "stdout": "",
            "stderr": str(e),
            "compile_output": "",
            "status": "Error",
        }


async def execute_code_judge0(code: str, stdin: str, language: str) -> dict:
    """Execute code using Judge0 API."""
    import httpx
    
    # Language IDs for Judge0
    language_ids = {
        "python3": 71,
        "python": 71,
    }
    
    language_id = language_ids.get(language, 71)
    
    async with httpx.AsyncClient() as client:
        # Submit code
        submit_url = f"{settings.code_exec_api_url}/submissions"
        headers = {
            "Content-Type": "application/json",
            "X-RapidAPI-Key": settings.code_exec_api_key,
            "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
        }
        
        payload = {
            "source_code": code,
            "language_id": language_id,
            "stdin": stdin,
            "cpu_time_limit": 5,
            "memory_limit": 128000,
        }
        
        response = await client.post(
            submit_url,
            json=payload,
            headers=headers,
            params={"wait": "true"},
        )
        
        if response.status_code != 200 and response.status_code != 201:
            raise Exception(f"Judge0 API error: {response.text}")
        
        result = response.json()
        return {
            "stdout": result.get("stdout", ""),
            "stderr": result.get("stderr", ""),
            "compile_output": result.get("compile_output", ""),
            "status": result.get("status", {}).get("description", ""),
        }


# ============================================================================
# Assessment Content (Questions, Problems, Prompts)
# ============================================================================
# Assessment content is loaded from a separate file that is GITIGNORED
# to keep questions private. On Render, use Secret Files to upload
# assessment_content.py. If missing, the app still starts using placeholders.

import os
import importlib.util

def _load_assessment_module():
    """Load assessment_content.py from secret path or cwd; fall back to example or placeholders."""
    paths_to_try = [
        "/etc/secrets/assessment_content.py",  # Render secret files
        os.path.join(os.path.dirname(__file__), "assessment_content.py"),  # backend dir
        "assessment_content.py",
        os.path.join(os.path.dirname(__file__), "assessment_content.example.py"),
    ]
    for path in paths_to_try:
        try:
            if not os.path.isfile(path):
                continue
            spec = importlib.util.spec_from_file_location("assessment_content", path)
            if spec and spec.loader:
                module = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(module)
                get_content = getattr(module, "get_assessment_content", None)
                get_key = getattr(module, "get_mcq_answer_key", None)
                if get_content is None:
                    continue
                return get_content, get_key if get_key else (lambda: {})
        except (FileNotFoundError, ImportError, Exception):
            continue
    def placeholder_content():
        return {
            "estimatedMinutes": 0,
            "timeLimitMinutes": 0,
            "sections": [],
            "problemSolving": {"title": "Not configured", "questions": []},
            "coding": {"title": "Not configured", "problem": {}, "testCases": []},
            "systemDesign": {"title": "Not configured", "prompt": ""},
        }
    return placeholder_content, lambda: {}

_get_assessment_content, get_mcq_answer_key = _load_assessment_module()
get_assessment_content = _get_assessment_content
