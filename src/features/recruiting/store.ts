import { useSyncExternalStore } from 'react';

import { recruitingMockState } from './mock-data';
import { ApplicationStatus, InterviewRound, type Applicant, type ApplicantPortalSnapshot, type Assignment, type Evaluation, type RecruitingState } from './types';
import { findApplicantByEmail, getApplicationStatusLabel } from './utils';

type RecruitingListener = () => void;
const RECRUITING_STATE_STORAGE_KEY = 'otcr-recruiting-state';

const cloneState = (state: RecruitingState): RecruitingState => ({
  applicants: state.applicants.map((applicant) => ({ ...applicant })),
  evaluations: state.evaluations.map((evaluation) => ({
    ...evaluation,
    rubric: { ...evaluation.rubric },
    strengths: [...evaluation.strengths],
    concerns: [...evaluation.concerns],
  })),
  assignments: state.assignments.map((assignment) => ({ ...assignment })),
  users: state.users.map((user) => ({ ...user })),
});

const loadPersistedState = (): RecruitingState => {
  if (typeof window === 'undefined') return cloneState(recruitingMockState);

  try {
    const raw = window.localStorage.getItem(RECRUITING_STATE_STORAGE_KEY);
    if (!raw) return cloneState(recruitingMockState);

    const parsed = JSON.parse(raw) as RecruitingState;
    if (
      !parsed ||
      !Array.isArray(parsed.applicants) ||
      !Array.isArray(parsed.evaluations) ||
      !Array.isArray(parsed.assignments) ||
      !Array.isArray(parsed.users)
    ) {
      return cloneState(recruitingMockState);
    }

    return cloneState(parsed);
  } catch {
    return cloneState(recruitingMockState);
  }
};

class RecruitingStore {
  private state: RecruitingState = loadPersistedState();

  private listeners = new Set<RecruitingListener>();

  subscribe = (listener: RecruitingListener) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getSnapshot = () => this.state;

  reset = () => {
    this.state = cloneState(recruitingMockState);
    this.emit();
  };

  setStatus = (applicantId: string, status: ApplicationStatus) => {
    this.state = {
      ...this.state,
      applicants: this.state.applicants.map((applicant) =>
        applicant.id === applicantId
          ? {
              ...applicant,
              status,
              currentRound:
                status === ApplicationStatus.Round1
                  ? InterviewRound.Round1
                  : status === ApplicationStatus.Round2
                    ? InterviewRound.Round2
                    : null,
              finalDecision:
                status === ApplicationStatus.Accepted
                  ? 'accepted'
                  : status === ApplicationStatus.Rejected
                    ? 'rejected'
                    : 'pending',
              updatedAt: new Date().toISOString(),
            }
          : applicant
      ),
    };

    this.emit();
  };

  upsertApplicant = (nextApplicant: Applicant) => {
    const exists = this.state.applicants.some((applicant) => applicant.id === nextApplicant.id);
    this.state = {
      ...this.state,
      applicants: exists
        ? this.state.applicants.map((applicant) => (applicant.id === nextApplicant.id ? { ...nextApplicant } : applicant))
        : [...this.state.applicants, { ...nextApplicant }],
    };
    this.emit();
  };

  addAssignment = (assignment: Assignment) => {
    this.state = {
      ...this.state,
      assignments: [...this.state.assignments, { ...assignment }],
      applicants: this.state.applicants.map((applicant) =>
        applicant.id === assignment.applicantId
          ? {
              ...applicant,
              assignedPrimaryInterviewerId:
                assignment.role === 'primary' ? assignment.interviewerId : applicant.assignedPrimaryInterviewerId,
              assignedSecondaryInterviewerId:
                assignment.role === 'secondary' ? assignment.interviewerId : applicant.assignedSecondaryInterviewerId,
              updatedAt: new Date().toISOString(),
            }
          : applicant
      ),
    };
    this.emit();
  };

  addEvaluation = (evaluation: Evaluation) => {
    this.state = {
      ...this.state,
      evaluations: [...this.state.evaluations, { ...evaluation, rubric: { ...evaluation.rubric }, strengths: [...evaluation.strengths], concerns: [...evaluation.concerns] }],
    };
    this.emit();
  };

  getApplicantByEmail = (email: string) => findApplicantByEmail(this.state.applicants, email);

  getApplicantPortalSnapshot = (email: string): ApplicantPortalSnapshot | null => {
    const applicant = findApplicantByEmail(this.state.applicants, email);
    if (!applicant) return null;

    return {
      applicantId: applicant.id,
      applicantName: applicant.name,
      applicantEmail: applicant.email,
      status: applicant.status,
      currentRound: applicant.currentRound,
      finalDecision: applicant.finalDecision,
      statusLabel: getApplicationStatusLabel(applicant.status),
    };
  };

  private emit() {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(RECRUITING_STATE_STORAGE_KEY, JSON.stringify(this.state));
    }
    this.listeners.forEach((listener) => listener());
  }
}

export const recruitingStore = new RecruitingStore();

export const useRecruitingStore = <T,>(selector: (state: RecruitingState) => T) =>
  useSyncExternalStore(recruitingStore.subscribe, () => selector(recruitingStore.getSnapshot()), () =>
    selector(recruitingStore.getSnapshot())
  );
