"""SQLAlchemy models for the DevOps OA backend."""

from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, JSON, Boolean, Enum
from sqlalchemy.orm import relationship
import enum
from database import Base


class ApplicationStatus(str, enum.Enum):
    """Status of an application."""
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class Application(Base):
    """Application submitted by a candidate."""
    __tablename__ = "applications"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False, index=True)
    interest = Column(String(500), nullable=True)  # One-liner about tech interest
    resume_filename = Column(String(255), nullable=True)  # Original filename
    resume_path = Column(String(500), nullable=True)  # Storage path
    status = Column(String(20), default=ApplicationStatus.PENDING.value, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    reviewed_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)  # Admin notes
    archived_at = Column(DateTime, nullable=True)  # When set, hidden from default list
    
    # Relationship to assessment link (created when approved)
    assessment_link_id = Column(Integer, ForeignKey("assessment_links.id"), nullable=True)
    assessment_link = relationship("AssessmentLink", back_populates="application")


class AssessmentLink(Base):
    """Assessment link for candidates."""
    __tablename__ = "assessment_links"
    
    id = Column(Integer, primary_key=True, index=True)
    token = Column(String(64), unique=True, index=True, nullable=False)
    email = Column(String(255), nullable=True, index=True)  # Email required to start
    label = Column(String(255), nullable=True)  # e.g., "Batch Nov 2025"
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    expires_at = Column(DateTime, nullable=True)
    
    # Relationship to attempts
    attempts = relationship("Attempt", back_populates="link", cascade="all, delete-orphan")
    # Relationship to application
    application = relationship("Application", back_populates="assessment_link", uselist=False)


class Attempt(Base):
    """Candidate's attempt at an assessment."""
    __tablename__ = "attempts"
    
    id = Column(Integer, primary_key=True, index=True)
    link_id = Column(Integer, ForeignKey("assessment_links.id"), nullable=False)
    started_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    last_activity_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    
    # Track which sections are completed
    sections_completed = Column(JSON, default=list)  # ["problem_solving", "coding", "system_design"]
    
    # Track integrity violations
    focus_loss_events = Column(Integer, default=0)  # Count of times assessment window lost focus
    is_flagged = Column(Boolean, default=False)  # Flag for admin review
    integrity_notes = Column(String(500), nullable=True)  # Notes about integrity concerns
    
    # Relationships
    link = relationship("AssessmentLink", back_populates="attempts")
    submissions = relationship("Submission", back_populates="attempt", cascade="all, delete-orphan")
    progress_snapshots = relationship("ProgressSnapshot", back_populates="attempt", cascade="all, delete-orphan")


class ProgressSnapshot(Base):
    """Periodic progress snapshot during an assessment (e.g. every 5 minutes)."""
    __tablename__ = "assessment_progress_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    attempt_id = Column(Integer, ForeignKey("attempts.id"), nullable=False)
    snapshot_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    sections_completed = Column(JSON, default=list)  # ["problem_solving", ...]
    current_section = Column(String(50), nullable=True)  # section they were on at snapshot time
    elapsed_seconds = Column(Integer, nullable=False)  # time since attempt started
    # Actual progress at snapshot time: MCQ answered count, coding/system_design lengths
    progress_detail = Column(JSON, nullable=True)  # { problem_solving: {answered_count, total}, coding: {length}, system_design: {length} }

    attempt = relationship("Attempt", back_populates="progress_snapshots")


class Submission(Base):
    """Submission for a specific section of the assessment."""
    __tablename__ = "submissions"
    
    id = Column(Integer, primary_key=True, index=True)
    attempt_id = Column(Integer, ForeignKey("attempts.id"), nullable=False)
    section = Column(String(50), nullable=False)  # problem_solving, coding, system_design
    payload = Column(JSON, nullable=False)  # The actual submission content
    coding_result = Column(JSON, nullable=True)  # Only for coding section: { passed, total, details }
    notes = Column(String(500), nullable=True)  # Admin notes (e.g., AI detection warnings)
    submitted_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationship
    attempt = relationship("Attempt", back_populates="submissions")
