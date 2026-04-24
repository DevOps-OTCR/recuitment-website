import { ApplicationStatus, InterviewRound, Role, type Applicant, type AssignmentRole, type Evaluation, type RecruitingUser } from './types';

const statusLabels: Record<ApplicationStatus, string> = {
  [ApplicationStatus.Applied]: 'Applied',
  [ApplicationStatus.Round1]: 'Round 1',
  [ApplicationStatus.Round2]: 'Round 2',
  [ApplicationStatus.Accepted]: 'Accepted',
  [ApplicationStatus.Rejected]: 'Rejected',
};

export const getApplicationStatusLabel = (status: ApplicationStatus) => statusLabels[status];

export const getInterviewRoundLabel = (round: InterviewRound | null) => {
  if (round === null) return 'No active round';
  return round === InterviewRound.Round1 ? 'Round 1' : 'Round 2';
};

export const isPartnerOrPm = (user: Pick<RecruitingUser, 'role'>) =>
  user.role === Role.Partner || user.role === Role.PM;

export const isConsultantOrLc = (user: Pick<RecruitingUser, 'role'>) =>
  user.role === Role.Consultant || user.role === Role.LC;

export const canReviewApplicants = (user: Pick<RecruitingUser, 'role'>) =>
  isPartnerOrPm(user) || isConsultantOrLc(user);

export const isValidAssignmentForRole = (role: AssignmentRole, user: Pick<RecruitingUser, 'role'>) => {
  if (role === 'primary') return isPartnerOrPm(user);
  return isConsultantOrLc(user);
};

export const calculateEvaluationAverage = (evaluation: Evaluation) => {
  const values = Object.values(evaluation.rubric);
  const total = values.reduce((sum, score) => sum + score, 0);
  return Number((total / values.length).toFixed(1));
};

export const getApplicantScoreSummary = (applicantId: string, evaluations: Evaluation[]) => {
  const applicantEvaluations = evaluations.filter((evaluation) => evaluation.applicantId === applicantId);

  if (applicantEvaluations.length === 0) {
    return {
      evaluationCount: 0,
      averageScore: null,
      latestRecommendation: null,
    };
  }

  const averageScore =
    applicantEvaluations.reduce((sum, evaluation) => sum + calculateEvaluationAverage(evaluation), 0) / applicantEvaluations.length;

  const latestEvaluation = applicantEvaluations
    .slice()
    .sort((left, right) => new Date(right.submittedAt).getTime() - new Date(left.submittedAt).getTime())[0];

  return {
    evaluationCount: applicantEvaluations.length,
    averageScore: Number(averageScore.toFixed(1)),
    latestRecommendation: latestEvaluation.recommendation,
  };
};

export const findApplicantByEmail = (applicants: Applicant[], email: string) => {
  const normalizedEmail = email.trim().toLowerCase();
  return applicants.find((applicant) => applicant.email.trim().toLowerCase() === normalizedEmail) ?? null;
};
