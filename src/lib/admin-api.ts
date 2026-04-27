import { apiFetch, apiFetchResponse } from './api-client';

export interface AdminEvaluationPayload {
  interviewer_name: string;
  interviewee_name: string;
  interviewee_gender: 'Male' | 'Female' | 'Other';
  interviewer_role: 'Primary' | 'Secondary';
  round: 'Round 1' | 'Round 2';
  leadership_score: number;
  interest_in_otcr_score: number;
  behavioral_performance_score: number;
  business_acumen_score: number;
  qualitative_creativity_score: number;
  quantitative_structure_score: number;
  case_performance_score: number;
  creativity_conversation_score: number;
  recommendation: 'YES' | 'LEAN YES' | 'MAYBE' | 'LEAN NO' | 'NO';
  final_round_summary: string;
  overall_performance_overview: string;
}

export interface AdminApplicationResponse {
  id: number;
  name: string;
  email: string;
  interest: string | null;
  resume_filename: string | null;
  resume_url?: string | null;
  status: string;
  final_decision: string;
  cycle_name: string | null;
  created_at: string;
  reviewed_at: string | null;
  notes: string | null;
  has_assessment_link: boolean;
  assessment_completed: boolean;
  assessment_token: string | null;
  focus_loss_events: number;
  is_flagged: boolean;
  integrity_notes: string | null;
  archived_at: string | null;
  recruiting_status: 'applied' | 'round_1' | 'round_2' | 'accepted' | 'rejected';
  current_round: 'Round 1' | 'Round 2' | null;
}

export interface AdminEvaluationResponse {
  id: number;
  application_id: number;
  applicant_name: string;
  applicant_email: string;
  interviewer_name: string;
  interviewee_name: string;
  interviewee_gender: 'Male' | 'Female' | 'Other';
  interviewer_role: 'Primary' | 'Secondary';
  round: 'Round 1' | 'Round 2' | null;
  leadership_score: number;
  interest_in_otcr_score: number;
  behavioral_performance_score: number;
  business_acumen_score: number;
  qualitative_creativity_score: number;
  quantitative_structure_score: number;
  case_performance_score: number;
  creativity_conversation_score: number;
  recommendation: 'YES' | 'LEAN YES' | 'MAYBE' | 'LEAN NO' | 'NO';
  recommendation_bucket: 'YES' | 'NO' | 'MAYBE';
  final_round_summary: string | null;
  overall_performance_overview: string | null;
  comments: string | null;
  created_at: string;
}

export interface AssignableUserResponse {
  id: number;
  email: string;
  name: string | null;
  role: 'APPLICANT' | 'CONSULTANT' | 'LC' | 'PM' | 'PARTNER' | 'EXECUTIVE' | 'ADMIN';
  active: boolean;
}

export interface InterviewAssignmentResponse {
  id: number;
  application_id: number;
  applicant_name: string;
  applicant_email: string;
  interest: string | null;
  notes: string | null;
  cycle_name: string | null;
  status: string;
  recruiting_status: 'applied' | 'round_1' | 'round_2' | 'accepted' | 'rejected';
  current_round: 'Round 1' | 'Round 2' | null;
  final_decision: string;
  role: 'primary' | 'secondary';
  round: 'Round 1' | 'Round 2';
  interviewer_id: number;
  interviewer_name: string | null;
  interviewer_email: string;
  interviewer_role: 'APPLICANT' | 'CONSULTANT' | 'LC' | 'PM' | 'PARTNER' | 'EXECUTIVE' | 'ADMIN';
  assigned_by_user_id: number | null;
  assigned_by_user_name: string | null;
  assigned_at: string;
  room: string | null;
  scheduled_time: string | null;
}

export interface UpsertInterviewAssignmentsPayload {
  round: 'Round 1' | 'Round 2';
  primary_interviewer_id: number;
  secondary_interviewer_id: number;
  room?: string | null;
  scheduled_time?: string | null;
}

export interface ApplicationDecisionRequest {
  action:
    | 'reject_after_application_review'
    | 'advance_to_round_1'
    | 'reject_after_round_1'
    | 'advance_to_round_2'
    | 'reject_after_round_2'
    | 'accept_final';
  notes?: string | null;
}

export interface AdminDatabaseOverviewResponse {
  generated_at: string;
  persistence: {
    database: string;
    storage: string;
  };
  tables: Array<{
    table:
      | 'applications'
      | 'evaluations'
      | 'interview_assignments'
      | 'assessment_links'
      | 'attempts'
      | 'submissions'
      | 'cycles'
      | 'assessment_progress_snapshots'
      | 'users';
    count: number;
  }>;
}

export interface AdminDatabaseTablePreviewResponse {
  table:
    | 'applications'
    | 'evaluations'
    | 'interview_assignments'
    | 'assessment_links'
    | 'attempts'
    | 'submissions'
    | 'cycles'
    | 'assessment_progress_snapshots'
    | 'users';
  count: number;
  columns: string[];
  rows: Array<Record<string, unknown>>;
}

class AdminApiClient {
  private timeoutMs = 5000;

  private async fetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return apiFetch<T>(endpoint, {
      ...options,
      timeoutMs: this.timeoutMs,
    });
  }

  private async fetchResponse(endpoint: string, options: RequestInit = {}): Promise<Response> {
    return apiFetchResponse(endpoint, {
      ...options,
      timeoutMs: this.timeoutMs,
    });
  }

  listApplications() {
    return this.fetch<AdminApplicationResponse[]>('/api/admin/applications?archived=1');
  }

  getResume(applicationId: number) {
    return this.fetchResponse(`/api/admin/applications/${applicationId}/resume`);
  }

  listEvaluations(applicationId?: number) {
    const suffix = applicationId ? `?application_id=${applicationId}` : '';
    return this.fetch<AdminEvaluationResponse[]>(`/api/admin/evaluations${suffix}`);
  }

  listMyInterviews(applicationId?: number) {
    const suffix = applicationId ? `?application_id=${applicationId}` : '';
    return this.fetch<AdminEvaluationResponse[]>(`/api/auth/me/interviews${suffix}`);
  }

  createEvaluation(applicationId: number, payload: AdminEvaluationPayload) {
    return this.fetch<AdminEvaluationResponse>(`/api/admin/applications/${applicationId}/evaluations`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  applyDecision(applicationId: number, payload: ApplicationDecisionRequest) {
    return this.fetch<AdminApplicationResponse>(`/api/admin/applications/${applicationId}/decision`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  listInterviewers() {
    return this.fetch<AssignableUserResponse[]>('/api/admin/interviewers');
  }

  listAssignments(applicationId?: number) {
    const suffix = applicationId ? `?application_id=${applicationId}` : '';
    return this.fetch<InterviewAssignmentResponse[]>(`/api/admin/assignments${suffix}`);
  }

  saveAssignments(applicationId: number, payload: UpsertInterviewAssignmentsPayload) {
    return this.fetch<InterviewAssignmentResponse[]>(`/api/admin/applications/${applicationId}/assignments`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  listMyAssignedInterviews() {
    return this.fetch<InterviewAssignmentResponse[]>('/api/auth/me/assigned-interviews');
  }

  getDatabaseOverview() {
    return this.fetch<AdminDatabaseOverviewResponse>('/api/admin/database/overview');
  }

  getDatabaseTable(tableName: AdminDatabaseTablePreviewResponse['table'], limit: number = 25) {
    return this.fetch<AdminDatabaseTablePreviewResponse>(`/api/admin/database/tables/${tableName}?limit=${limit}`);
  }
}

export const adminApi = new AdminApiClient();
