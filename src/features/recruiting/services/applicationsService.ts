import { recruitingStore } from '../store';
import {
  ApplicationStatus,
  type Applicant,
  type ApplicantPortalSnapshot,
  type RecruitingState,
} from '../types';
import { findApplicantByEmail } from '../utils';

const cloneApplicant = (applicant: Applicant): Applicant => ({ ...applicant });

// Async-shaped facade for application CRUD while the backing implementation remains local/shared-state.
export const applicationsService = {
  async listApplications(): Promise<Applicant[]> {
    return recruitingStore.getSnapshot().applicants.map(cloneApplicant);
  },

  async getApplicationById(applicantId: string): Promise<Applicant | null> {
    const applicant = recruitingStore.getSnapshot().applicants.find((entry) => entry.id === applicantId) ?? null;
    return applicant ? cloneApplicant(applicant) : null;
  },

  async getApplicationByEmail(email: string): Promise<Applicant | null> {
    const applicant = findApplicantByEmail(recruitingStore.getSnapshot().applicants, email);
    return applicant ? cloneApplicant(applicant) : null;
  },

  async createOrUpdateApplication(applicant: Applicant): Promise<Applicant> {
    recruitingStore.upsertApplicant(applicant);
    return cloneApplicant(applicant);
  },

  async updateApplicationStatus(applicantId: string, status: ApplicationStatus): Promise<Applicant | null> {
    recruitingStore.setStatus(applicantId, status);
    const updated = recruitingStore.getSnapshot().applicants.find((entry) => entry.id === applicantId) ?? null;
    return updated ? cloneApplicant(updated) : null;
  },

  async updateApplicationDecision(applicantId: string, status: ApplicationStatus, notes: string): Promise<Applicant | null> {
    recruitingStore.setApplicantDecision(applicantId, status, notes);
    const updated = recruitingStore.getSnapshot().applicants.find((entry) => entry.id === applicantId) ?? null;
    return updated ? cloneApplicant(updated) : null;
  },

  async lookupApplicantPortalSnapshot(email: string): Promise<ApplicantPortalSnapshot | null> {
    return recruitingStore.getApplicantPortalSnapshot(email);
  },

  getStateSnapshot(): RecruitingState {
    return recruitingStore.getSnapshot();
  },
};
