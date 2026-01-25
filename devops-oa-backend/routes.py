"""API routes for the DevOps OA backend."""

import secrets
import os
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Header, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr

from config import get_settings
from database import get_db
from models import AssessmentLink, Attempt, Submission, Application, ApplicationStatus

router = APIRouter()
settings = get_settings()

# Ensure uploads directory exists
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads", "resumes")
os.makedirs(UPLOAD_DIR, exist_ok=True)


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
    status: str
    created_at: datetime
    reviewed_at: Optional[datetime]
    notes: Optional[str]
    has_assessment_link: bool
    assessment_completed: bool = False
    assessment_token: Optional[str] = None
    focus_loss_events: int = 0
    is_flagged: bool = False
    integrity_notes: Optional[str] = None


class ApproveApplicationRequest(BaseModel):
    """Request to approve an application."""
    notes: Optional[str] = None


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
    
    # Save resume file
    file_ext = os.path.splitext(resume.filename)[1] if resume.filename else ".pdf"
    safe_filename = f"{secrets.token_urlsafe(16)}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, safe_filename)
    
    try:
        contents = await resume.read()
        with open(file_path, "wb") as f:
            f.write(contents)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save resume: {str(e)}")
    
    # Create application
    application = Application(
        name=name.strip(),
        email=email.lower().strip(),
        interest=interest.strip() if interest else None,
        resume_filename=resume.filename,
        resume_path=file_path,
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
# Admin Endpoints
# ============================================================================

def _get_admin_secret() -> str:
    """Admin password from settings (loaded from /etc/secrets/.env or .env)."""
    password = settings.admin_password
    if not password or password == "change-me-in-production":
        raise HTTPException(
            status_code=500,
            detail="ADMIN_PASSWORD not properly configured. Upload .env secret file to Render."
        )
    return password


def verify_admin_secret(x_admin_secret: str = Header(..., alias="X-Admin-Secret")):
    """Verify admin secret header."""
    expected = _get_admin_secret()
    
    if x_admin_secret != expected:
        raise HTTPException(status_code=403, detail="Invalid admin secret")
    return True


@router.get("/admin/applications", response_model=List[ApplicationListItem])
async def list_applications(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    _: bool = Depends(verify_admin_secret),
):
    """List all applications (admin only)."""
    query = db.query(Application)
    if status:
        query = query.filter(Application.status == status)
    
    applications = query.order_by(Application.created_at.desc()).all()
    
    result = []
    for app in applications:
        # Get attempt data if exists
        attempt = None
        assessment_token = None
        if app.assessment_link_id:
            attempt = db.query(Attempt).filter(Attempt.link_id == app.assessment_link_id).first()
            # Get the token from the assessment link
            link = db.query(AssessmentLink).filter(AssessmentLink.id == app.assessment_link_id).first()
            if link:
                assessment_token = link.token
        
        result.append(ApplicationListItem(
            id=app.id,
            name=app.name,
            email=app.email,
            interest=app.interest,
            resume_filename=app.resume_filename,
            status=app.status,
            created_at=app.created_at,
            reviewed_at=app.reviewed_at,
            notes=app.notes,
            has_assessment_link=app.assessment_link_id is not None,
            assessment_completed=attempt.completed_at is not None if attempt else False,
            assessment_token=assessment_token,
            focus_loss_events=attempt.focus_loss_events if attempt else 0,
            is_flagged=attempt.is_flagged if attempt else False,
            integrity_notes=attempt.integrity_notes if attempt else None,
        ))
    
    return result


@router.get("/admin/applications/{application_id}")
async def get_application(
    application_id: int,
    db: Session = Depends(get_db),
    _: bool = Depends(verify_admin_secret),
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
    _: bool = Depends(verify_admin_secret),
):
    """Stream resume file for admin (opens in new tab)."""
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application or not application.resume_path:
        raise HTTPException(status_code=404, detail="Resume not found")
    if not os.path.isfile(application.resume_path):
        raise HTTPException(status_code=404, detail="Resume file missing")
    filename = application.resume_filename or "resume.pdf"
    media_type = "application/pdf" if filename.lower().endswith(".pdf") else "application/octet-stream"
    return FileResponse(
        application.resume_path,
        filename=filename,
        media_type=media_type,
        headers={"Content-Disposition": f"inline; filename={filename!r}"},
    )


@router.get("/admin/submissions/{token}")
async def get_submission(
    token: str,
    db: Session = Depends(get_db),
    _: bool = Depends(verify_admin_secret),
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
        "submissions": [
            {
                "section": sub.section,
                "submitted_at": sub.submitted_at,
                "payload": sub.payload,
                "coding_result": sub.coding_result,
                "notes": sub.notes,
            }
            for sub in submissions
        ],
    }


@router.post("/admin/applications/{application_id}/approve")
async def approve_application(
    application_id: int,
    request: ApproveApplicationRequest,
    db: Session = Depends(get_db),
    _: bool = Depends(verify_admin_secret),
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
    _: bool = Depends(verify_admin_secret),
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


@router.post("/links", response_model=CreateLinkResponse)
async def create_link(
    request: CreateLinkRequest,
    db: Session = Depends(get_db),
    _: bool = Depends(verify_admin_secret),
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
    _: bool = Depends(verify_admin_secret),
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
    
    # Check if already submitted
    existing = db.query(Submission).filter(
        Submission.attempt_id == attempt.id,
        Submission.section == request.section,
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail=f"Section '{request.section}' already submitted")
    
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
    
    # Create submission with AI detection flag
    submission = Submission(
        attempt_id=attempt.id,
        section=request.section,
        payload=request.payload,
        coding_result=coding_result,
    )
    
    # Store AI flag info in notes for admin review
    if not ai_flag_present:
        submission.notes = "[WARNING] AI detection flag missing - possible AI assistance detected"
    
    db.add(submission)
    
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
# assessment_content.py. For local dev, copy assessment_content.example.py.

import sys
import importlib.util

# Try to load from Render secret files first, then local file
def _load_assessment_content():
    paths_to_try = [
        "/etc/secrets/assessment_content.py",  # Render secret files
        "assessment_content.py",  # Local development
    ]
    for path in paths_to_try:
        try:
            spec = importlib.util.spec_from_file_location("assessment_content", path)
            if spec and spec.loader:
                module = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(module)
                return module.get_assessment_content
        except (FileNotFoundError, ImportError):
            continue
    # Fallback: return a placeholder if no file found
    def placeholder():
        return {
            "estimatedMinutes": 0,
            "timeLimitMinutes": 0,
            "sections": [],
            "problemSolving": {"title": "Not configured", "questions": []},
            "coding": {"title": "Not configured", "problem": {}, "testCases": []},
            "systemDesign": {"title": "Not configured", "prompt": ""},
        }
    return placeholder

get_assessment_content = _load_assessment_content()
