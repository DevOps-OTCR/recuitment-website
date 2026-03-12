"""SQLAlchemy models for the DevOps OA backend."""

from datetime import datetime
from sqlalchemy.sql import func
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, JSON, Boolean, Enum
from sqlalchemy.orm import relationship
import enum
from database import Base

# --- ENUMS ---

class DecisionStatus(enum.Enum):
    YES = "YES"
    NO = "NO"
    MAYBE = "MAYBE"

class ApplicationStatus(str, enum.Enum):
    """Status of an application."""
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

# --- MODELS ---

class Cycle(Base):
    __tablename__ = "cycles"
    
    id = Column(Integer, primary_key=True, index=True)
    semester = Column(String(50), nullable=False)  # e.g., "SP26", "FA25"
    name = Column(String(50), nullable=False)      # e.g., "Cycle 1", "Cycle 2"
    is_active = Column(Boolean, default=True)

    applications = relationship("Application", back_populates="cycle")


class AssessmentLink(Base):
    """Assessment link for candidates."""
    __tablename__ = "assessment_links"
    
    id = Column(Integer, primary_key=True, index=True)
    token = Column(String(64), unique=True, index=True, nullable=False)
    email = Column(String(255), nullable=True, index=True)  # Email required to start
    label = Column(String(255), nullable=True)  # e.g., "Batch Nov 2025"
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    expires_at = Column(DateTime, nullable=True)
    
    attempts = relationship("Attempt", back_populates="link", cascade="all, delete-orphan")
    application = relationship("Application", back_populates="assessment_link", uselist=False)


class Application(Base):
    """Application submitted by a candidate."""
    __tablename__ = "applications"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # --- Cycle Routing ---
    cycle_id = Column(Integer, ForeignKey("cycles.id"), nullable=True)
    
    # --- Candidate Info ---
    name = Column(String(255), nullable=False)             
    first_name = Column(String(100), nullable=True)        
    last_name = Column(String(100), nullable=True)         
    email = Column(String(255), nullable=False, index=True)
    major = Column(String(100), nullable=True)
    gpa = Column(String(20), nullable=True) 
    grad_year = Column(String(10), nullable=True)
    interest = Column(String(500), nullable=True)          
    
    # --- Files & Links ---
    resume_filename = Column(String(255), nullable=True) 
    resume_path = Column(String(500), nullable=True)  
    assessment_link_id = Column(Integer, ForeignKey("assessment_links.id"), nullable=True)
    
    # --- Status Tracking ---
    status = Column(String(20), default=ApplicationStatus.PENDING.value, nullable=False) 
    final_decision = Column(Enum(DecisionStatus), default=DecisionStatus.MAYBE, nullable=False)
    
    # --- Metadata & Logging ---
    application_data = Column(JSON, nullable=True)         
    notes = Column(Text, nullable=True)                    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    reviewed_at = Column(DateTime, nullable=True)
    archived_at = Column(DateTime, nullable=True) 
    
    # --- Relationships ---
    cycle = relationship("Cycle", back_populates="applications")
    evaluations = relationship("Evaluation", back_populates="application")
    assessment_link = relationship("AssessmentLink", back_populates="application", uselist=False)


class Evaluation(Base):
    """Evaluation data from Google Forms/Interviewers."""
    __tablename__ = "evaluations"
    
    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False)
    interviewer_name = Column(String(100), nullable=False)
    round = Column(String(50)) 
    
    culture_fit_score = Column(Integer)
    technical_score = Column(Integer)
    communication_score = Column(Integer)
    
    recommendation = Column(Enum(DecisionStatus), nullable=False)
    comments = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    application = relationship("Application", back_populates="evaluations")


class Attempt(Base):
    """Candidate's attempt at an assessment."""
    __tablename__ = "attempts"
    
    id = Column(Integer, primary_key=True, index=True)
    link_id = Column(Integer, ForeignKey("assessment_links.id"), nullable=False)
    started_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    last_activity_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    
    sections_completed = Column(JSON, default=list)  
    focus_loss_events = Column(Integer, default=0)  
    is_flagged = Column(Boolean, default=False)  
    integrity_notes = Column(String(500), nullable=True)  
    
    link = relationship("AssessmentLink", back_populates="attempts")
    submissions = relationship("Submission", back_populates="attempt", cascade="all, delete-orphan")
    progress_snapshots = relationship("ProgressSnapshot", back_populates="attempt", cascade="all, delete-orphan")


class ProgressSnapshot(Base):
    """Periodic progress snapshot during an assessment."""
    __tablename__ = "assessment_progress_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    attempt_id = Column(Integer, ForeignKey("attempts.id"), nullable=False)
    snapshot_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    sections_completed = Column(JSON, default=list)  
    current_section = Column(String(50), nullable=True)  
    elapsed_seconds = Column(Integer, nullable=False)  
    progress_detail = Column(JSON, nullable=True)  

    attempt = relationship("Attempt", back_populates="progress_snapshots")


class Submission(Base):
    """Submission for a specific section of the assessment."""
    __tablename__ = "submissions"
    
    id = Column(Integer, primary_key=True, index=True)
    attempt_id = Column(Integer, ForeignKey("attempts.id"), nullable=False)
    section = Column(String(50), nullable=False)  
    payload = Column(JSON, nullable=False)  
    coding_result = Column(JSON, nullable=True)  
    notes = Column(String(500), nullable=True)  
    submitted_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    attempt = relationship("Attempt", back_populates="submissions")
