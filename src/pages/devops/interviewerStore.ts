import { applicants as seedApplicants, recruitingUsers } from '@/features/recruiting/mock-data';
import { recruitingStore } from '@/features/recruiting';
import { ApplicationStatus, InterviewRound as RecruitingInterviewRound, Role, type Applicant, type Assignment, type Evaluation, type RecruitingUser } from '@/features/recruiting/types';
import { mockApplicants } from '@/pages/devops/components/admin/mockData';
import type { ApplicantRecord, FeedbackEntry, InterviewRound, InterviewerRole } from '@/pages/devops/components/admin/types';

const INTERVIEWER_USER_KEY = 'otcr-tech-current-interviewer-id';

const normalizeRole = (role: Role): RecruitingUser['role'] => role;

const roleToLabel = (role: Role) => {
  switch (role) {
    case Role.Partner:
      return 'Partner';
    case Role.PM:
      return 'PM';
    case Role.LC:
      return 'Consultant';
    case Role.Consultant:
      return 'Consultant';
    case Role.Applicant:
      return 'Applicant';
  }
};

const roleToInterviewerRole = (assignmentRole: Assignment['role']): InterviewerRole =>
  assignmentRole === 'primary' ? 'Primary' : 'Secondary';

const recruitingRoundToAdminRound = (round: RecruitingInterviewRound): InterviewRound =>
  round === RecruitingInterviewRound.Round2 ? 'Round 2' : 'Round 1';

const adminRoundToRecruitingRound = (round: InterviewRound): RecruitingInterviewRound =>
  round === 'Round 2' ? RecruitingInterviewRound.Round2 : RecruitingInterviewRound.Round1;

const recommendationMap: Record<Evaluation['recommendation'], FeedbackEntry['recommendation']> = {
  strong_yes: 'YES',
  yes: 'YES',
  lean_yes: 'LEAN YES',
  lean_no: 'LEAN NO',
  no: 'NO',
};

const reverseRecommendationMap: Record<FeedbackEntry['recommendation'], Evaluation['recommendation']> = {
  YES: 'yes',
  'LEAN YES': 'lean_yes',
  MAYBE: 'lean_no',
  'LEAN NO': 'lean_no',
  NO: 'no',
};

const persistedResumeLookup = new Map(
  mockApplicants
    .filter((applicant) => applicant.resume_url)
    .map((applicant) => [applicant.email.trim().toLowerCase(), applicant.resume_url as string])
);

const toApplicantRecord = (applicant: Applicant): ApplicantRecord => ({
  id: applicant.id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0),
  name: applicant.name,
  email: applicant.email,
  interest: applicant.whyOtcr,
  resume_filename: applicant.resume.split('/').pop() ?? applicant.resume,
  status: applicant.status,
  final_decision: applicant.finalDecision.toUpperCase(),
  cycle_name: `Cycle ${applicant.cycle}`,
  created_at: applicant.submittedAt,
  reviewed_at: applicant.updatedAt,
  notes: applicant.notes,
  has_assessment_link: false,
  assessment_completed: false,
  assessment_token: null,
  focus_loss_events: 0,
  is_flagged: false,
  integrity_notes: null,
  archived_at: null,
  assigned_exec: null,
  resume_url: persistedResumeLookup.get(applicant.email.trim().toLowerCase()) ?? null,
});

const getAllApplicantRecords = () => {
  const recruitingApplicants = recruitingStore.getSnapshot().applicants.map(toApplicantRecord);
  const byEmail = new Map<string, ApplicantRecord>();

  recruitingApplicants.forEach((applicant) => {
    byEmail.set(applicant.email.trim().toLowerCase(), applicant);
  });

  return Array.from(byEmail.values());
};

const applicantIdToNumericId = new Map(seedApplicants.map((applicant) => [applicant.id, toApplicantRecord(applicant).id]));
const numericApplicantIdToStringId = new Map(Array.from(applicantIdToNumericId.entries()).map(([key, value]) => [value, key]));

const deriveApplicantNumericId = (applicantId: string) =>
  applicantIdToNumericId.get(applicantId) ?? applicantId.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);

const toFeedbackEntry = (evaluation: Evaluation): FeedbackEntry => {
  const applicant = seedApplicants.find((entry) => entry.id === evaluation.applicantId);

  return {
    id: evaluation.id,
    applicantId: deriveApplicantNumericId(evaluation.applicantId),
    applicantName: applicant?.name ?? evaluation.applicantId,
    interviewerName: recruitingUsers.find((user) => user.id === evaluation.interviewerId)?.name ?? 'Unknown reviewer',
    intervieweeName: applicant?.name ?? evaluation.applicantId,
    intervieweeGender: 'Other',
    interviewerRole: evaluation.interviewerRole === Role.Consultant || evaluation.interviewerRole === Role.LC ? 'Secondary' : 'Primary',
    round: recruitingRoundToAdminRound(evaluation.round),
    leadershipScore: Math.min(3, Math.max(1, Math.round((evaluation.rubric.teamwork + evaluation.rubric.motivation) / 3))) as FeedbackEntry['leadershipScore'],
    interestInOtcrScore: Math.min(3, Math.max(1, Math.round(evaluation.rubric.motivation / 2))) as FeedbackEntry['interestInOtcrScore'],
    behavioralPerformanceScore: Math.min(3, Math.max(1, Math.round(evaluation.rubric.communication / 2))) as FeedbackEntry['behavioralPerformanceScore'],
    businessAcumenScore: Math.min(3, Math.max(1, Math.round(evaluation.rubric.problemSolving / 2))) as FeedbackEntry['businessAcumenScore'],
    qualitativeCreativityScore: Math.min(3, Math.max(1, Math.round(evaluation.rubric.problemSolving / 2))) as FeedbackEntry['qualitativeCreativityScore'],
    quantitativeStructureScore: Math.min(3, Math.max(1, Math.round(evaluation.rubric.structure / 2))) as FeedbackEntry['quantitativeStructureScore'],
    casePerformanceScore: Math.min(3, Math.max(1, Math.round((evaluation.rubric.problemSolving + evaluation.rubric.structure) / 4))) as FeedbackEntry['casePerformanceScore'],
    creativityConversationScore: Math.min(3, Math.max(1, Math.round((evaluation.rubric.communication + evaluation.rubric.teamwork) / 4))) as FeedbackEntry['creativityConversationScore'],
    recommendation: recommendationMap[evaluation.recommendation],
    finalRoundSummary: evaluation.concerns.join(', '),
    overallPerformanceOverview: evaluation.summary,
    submittedAt: evaluation.submittedAt,
  };
};

const groupFeedbackEntries = (entries: FeedbackEntry[]) =>
  entries.reduce<Record<number, FeedbackEntry[]>>((acc, entry) => {
    acc[entry.applicantId] = [entry, ...(acc[entry.applicantId] ?? [])];
    return acc;
  }, {});

export const getInterviewerUsers = () =>
  recruitingUsers.filter((user) => user.role !== Role.Applicant).map((user) => ({
    ...user,
    roleLabel: roleToLabel(user.role),
    normalizedRole: normalizeRole(user.role),
  }));

export const getCurrentInterviewerId = () => {
  if (typeof window === 'undefined') return recruitingUsers[0]?.id ?? null;
  return window.localStorage.getItem(INTERVIEWER_USER_KEY) ?? recruitingUsers[0]?.id ?? null;
};

export const setCurrentInterviewerId = (userId: string) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(INTERVIEWER_USER_KEY, userId);
};

export const getInterviewerWorkspaceSnapshot = (currentUserId: string) => {
  const users = getInterviewerUsers();
  const currentUser = users.find((user) => user.id === currentUserId) ?? users[0] ?? null;
  const { assignments, evaluations } = recruitingStore.getSnapshot();
  const applicantRecords = getAllApplicantRecords();
  const assignedApplicantIds = new Set(assignments.filter((assignment) => assignment.interviewerId === currentUser?.id).map((assignment) => assignment.applicantId));
  const assignedApplicants = applicantRecords.filter((applicant) => {
    const stringId = numericApplicantIdToStringId.get(applicant.id);
    return stringId ? assignedApplicantIds.has(stringId) : false;
  });

  const feedbackByApplicant = groupFeedbackEntries(evaluations.map(toFeedbackEntry));

  return {
    users,
    currentUser,
    assignments,
    applicants: assignedApplicants,
    feedbackByApplicant,
  };
};

export const submitInterviewerFeedback = (
  user: Pick<RecruitingUser, 'id' | 'role'>,
  entry: Omit<FeedbackEntry, 'id' | 'submittedAt'>
) => {
  const applicantId = numericApplicantIdToStringId.get(entry.applicantId);
  if (!applicantId) {
    throw new Error('This applicant is not backed by an interview assignment.');
  }

  const { assignments } = recruitingStore.getSnapshot();
  const matchingAssignment = assignments.find(
    (assignment) =>
      assignment.applicantId === applicantId &&
      assignment.interviewerId === user.id &&
      assignment.round === adminRoundToRecruitingRound(entry.round)
  );

  if (!matchingAssignment) {
    throw new Error('You are not assigned to submit feedback for this applicant in that round.');
  }

  const nextEvaluation: Evaluation = {
    id: `eval-${applicantId}-${user.id}-${Date.now()}`,
    applicantId,
    interviewerId: user.id,
    interviewerRole: user.role,
    round: adminRoundToRecruitingRound(entry.round),
    recommendation: reverseRecommendationMap[entry.recommendation],
    rubric: {
      communication: Math.min(5, entry.behavioralPerformanceScore + 2),
      structure: Math.min(5, entry.quantitativeStructureScore + 2),
      problemSolving: Math.min(5, entry.casePerformanceScore + 2),
      motivation: Math.min(5, entry.interestInOtcrScore + 2),
      teamwork: Math.min(5, entry.leadershipScore + 2),
    },
    summary: entry.overallPerformanceOverview,
    strengths: [entry.overallPerformanceOverview],
    concerns: [entry.finalRoundSummary],
    submittedAt: new Date().toISOString(),
  };

  recruitingStore.upsertEvaluation(nextEvaluation);

  return toFeedbackEntry(nextEvaluation);
};

export const getApplicantStatusLabel = (status: string) => {
  switch (status) {
    case ApplicationStatus.Applied:
      return 'Applied';
    case ApplicationStatus.Round1:
      return 'Round 1';
    case ApplicationStatus.Round2:
      return 'Round 2';
    case ApplicationStatus.Accepted:
      return 'Accepted';
    case ApplicationStatus.Rejected:
      return 'Rejected';
    default:
      return status;
  }
};

export const getAssignmentLabel = (userId: string, applicantId: number, round: InterviewRound, assignments: Assignment[]) => {
  const recruitingApplicantId = numericApplicantIdToStringId.get(applicantId);
  const matchingAssignment = assignments.find(
    (assignment) =>
      assignment.interviewerId === userId &&
      assignment.applicantId === recruitingApplicantId &&
      recruitingRoundToAdminRound(assignment.round) === round
  );

  if (!matchingAssignment) return null;
  return matchingAssignment.role === 'primary' ? 'Primary interviewer' : 'Secondary interviewer';
};
