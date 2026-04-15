import { recruitingStore } from './store';
import { ApplicationStatus, Role, type Applicant } from './types';
import type { ApplicantRecord } from '@/pages/devops/components/admin/types';

export type RecruitingRole = `${Role}`;
export type RecruitingDecisionAction =
  | 'reject_after_application_review'
  | 'advance_to_round_1'
  | 'reject_after_round_1'
  | 'advance_to_round_2'
  | 'reject_after_round_2'
  | 'accept_final';

type DecisionSnapshot = {
  status: ApplicationStatus;
  finalDecision: Applicant['finalDecision'];
  decisionLabel: string;
};

const upsertDecisionNote = (notes: string | null | undefined, decisionLabel: string) => {
  const cleaned = (notes ?? '')
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line) => !/^Decision:/i.test(line.trim()))
    .join('\n')
    .trim();

  return cleaned ? `${cleaned}\nDecision: ${decisionLabel}` : `Decision: ${decisionLabel}`;
};

const normalizeDecision = (action: RecruitingDecisionAction): DecisionSnapshot => {
  switch (action) {
    case 'reject_after_application_review':
      return { status: ApplicationStatus.Rejected, finalDecision: 'rejected', decisionLabel: 'Rejected after application review' };
    case 'advance_to_round_1':
      return { status: ApplicationStatus.Round1, finalDecision: 'pending', decisionLabel: 'Advanced to Round 1' };
    case 'reject_after_round_1':
      return { status: ApplicationStatus.Rejected, finalDecision: 'rejected', decisionLabel: 'Rejected after Round 1' };
    case 'advance_to_round_2':
      return { status: ApplicationStatus.Round2, finalDecision: 'pending', decisionLabel: 'Advanced to Round 2' };
    case 'reject_after_round_2':
      return { status: ApplicationStatus.Rejected, finalDecision: 'rejected', decisionLabel: 'Rejected after Round 2' };
    case 'accept_final':
      return { status: ApplicationStatus.Accepted, finalDecision: 'accepted', decisionLabel: 'Accepted final' };
  }
};

const findSharedApplicant = (applicant: Pick<ApplicantRecord, 'id' | 'email'>) => {
  const email = applicant.email.trim().toLowerCase();
  return (
    recruitingStore.getSnapshot().applicants.find((entry) => entry.email.trim().toLowerCase() === email) ??
    recruitingStore.getSnapshot().applicants.find((entry) => entry.id === String(applicant.id)) ??
    null
  );
};

// Manage-page adapter: translate admin decision actions into shared recruiting-store updates.
export const applyRecruitingDecision = (applicant: ApplicantRecord, action: RecruitingDecisionAction) => {
  const sharedApplicant = findSharedApplicant(applicant);
  if (!sharedApplicant) {
    throw new Error('No shared recruiting applicant was found for this record.');
  }

  const nextDecision = normalizeDecision(action);
  const reviewedAt = recruitingStore.setApplicantDecision(
    sharedApplicant.id,
    nextDecision.status,
    upsertDecisionNote(sharedApplicant.notes, nextDecision.decisionLabel)
  );

  return {
    applicantId: applicant.id,
    applicantEmail: applicant.email.trim().toLowerCase(),
    current_round: nextDecision.status,
    status: nextDecision.status,
    final_decision: nextDecision.finalDecision.toUpperCase(),
    reviewed_at: reviewedAt,
    latest_decision: action,
    decision_label: nextDecision.decisionLabel,
  };
};
