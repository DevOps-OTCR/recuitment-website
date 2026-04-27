import type {
  AdminApplicationResponse,
  AdminEvaluationResponse,
  AssignableUserResponse,
  InterviewAssignmentResponse,
} from '@/lib/admin-api';
import type { AdminAuthenticatedUser, AdminPermission, AdminUserRole } from '@/lib/admin-auth';
import type {
  ApplicantRecord,
  FeedbackEntry,
  InterviewRound,
  InterviewerRole,
} from '@/pages/devops/components/admin/types';

export type RecruitingViewerRole = 'partner' | 'pm' | 'lc' | 'consultant' | 'applicant';

export type AssignmentCandidate = AssignableUserResponse & {
  routeRole: RecruitingViewerRole;
};

const roleDisplayLabels: Record<AdminUserRole, string> = {
  APPLICANT: 'Applicant',
  CONSULTANT: 'Consultant',
  LC: 'LC',
  PM: 'PM',
  PARTNER: 'Partner',
  EXECUTIVE: 'Executive',
  ADMIN: 'Admin',
};

export const roleToViewerRole = (role: AdminUserRole | null | undefined): RecruitingViewerRole => {
  switch (role) {
    case 'CONSULTANT':
      return 'consultant';
    case 'LC':
      return 'lc';
    case 'PM':
    case 'ADMIN':
      return 'pm';
    case 'PARTNER':
    case 'EXECUTIVE':
      return 'partner';
    case 'APPLICANT':
    default:
      return 'applicant';
  }
};

export const formatAdminRoleLabel = (role: AdminUserRole | AssignableUserResponse['role']) => roleDisplayLabels[role];

export const hasBackendPermission = (
  user: Pick<AdminAuthenticatedUser, 'permissions'> | null | undefined,
  permission: AdminPermission
) => Boolean(user?.permissions.includes(permission));

export const mapApplicationToApplicantRecord = (application: AdminApplicationResponse): ApplicantRecord => ({
  id: application.id,
  name: application.name,
  email: application.email,
  interest: application.interest,
  resume_filename: application.resume_filename,
  resume_url: application.resume_url ?? null,
  status: application.recruiting_status,
  final_decision: application.final_decision,
  cycle_name: application.cycle_name,
  created_at: application.created_at,
  reviewed_at: application.reviewed_at,
  notes: application.notes,
  has_assessment_link: application.has_assessment_link,
  assessment_completed: application.assessment_completed,
  assessment_token: application.assessment_token,
  focus_loss_events: application.focus_loss_events,
  is_flagged: application.is_flagged,
  integrity_notes: application.integrity_notes,
  archived_at: application.archived_at,
  assigned_exec: null,
});

export const mapEvaluationToFeedbackEntry = (evaluation: AdminEvaluationResponse): FeedbackEntry => ({
  id: String(evaluation.id),
  applicantId: evaluation.application_id,
  applicantName: evaluation.applicant_name,
  interviewerName: evaluation.interviewer_name,
  intervieweeName: evaluation.interviewee_name,
  intervieweeGender: evaluation.interviewee_gender,
  interviewerRole: evaluation.interviewer_role,
  round: (evaluation.round ?? 'Round 1') as InterviewRound,
  leadershipScore: evaluation.leadership_score as FeedbackEntry['leadershipScore'],
  interestInOtcrScore: evaluation.interest_in_otcr_score as FeedbackEntry['interestInOtcrScore'],
  behavioralPerformanceScore: evaluation.behavioral_performance_score as FeedbackEntry['behavioralPerformanceScore'],
  businessAcumenScore: evaluation.business_acumen_score as FeedbackEntry['businessAcumenScore'],
  qualitativeCreativityScore: evaluation.qualitative_creativity_score as FeedbackEntry['qualitativeCreativityScore'],
  quantitativeStructureScore: evaluation.quantitative_structure_score as FeedbackEntry['quantitativeStructureScore'],
  casePerformanceScore: evaluation.case_performance_score as FeedbackEntry['casePerformanceScore'],
  creativityConversationScore: evaluation.creativity_conversation_score as FeedbackEntry['creativityConversationScore'],
  recommendation: evaluation.recommendation,
  finalRoundSummary: evaluation.final_round_summary ?? '',
  overallPerformanceOverview: evaluation.overall_performance_overview ?? evaluation.comments ?? '',
  submittedAt: evaluation.created_at,
});

export const mapInterviewerRole = (
  role: InterviewAssignmentResponse['role']
): InterviewerRole => (role === 'secondary' ? 'Secondary' : 'Primary');

export const mapAssignableUser = (user: AssignableUserResponse): AssignmentCandidate => ({
  ...user,
  routeRole: roleToViewerRole(user.role),
});

export const getAssignmentCandidateRoleLabel = (candidate: AssignmentCandidate) =>
  formatAdminRoleLabel(candidate.role);

export const getCurrentRoundLabel = (application: AdminApplicationResponse | InterviewAssignmentResponse) =>
  application.current_round ?? 'No active round';
