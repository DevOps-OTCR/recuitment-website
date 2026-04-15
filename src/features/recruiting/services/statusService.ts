import { applicationsService } from './applicationsService';
import { type ApplicantPortalSnapshot } from '../types';

// Applicant-facing status lookups intentionally expose only a safe portal snapshot.
export const statusService = {
  async lookupApplicantStatusByEmail(email: string): Promise<ApplicantPortalSnapshot | null> {
    return applicationsService.lookupApplicantPortalSnapshot(email);
  },
};
