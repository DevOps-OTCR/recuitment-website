import { apiFetch } from './api-client';

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
  private timeoutMs = 2500;

  private async fetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return apiFetch<T>(endpoint, {
      ...options,
      timeoutMs: this.timeoutMs,
    });
  }

  listApplications() {
    return this.fetch<AdminApplicationResponse[]>('/api/admin/applications');
  }

  listEvaluations() {
    return this.fetch<AdminEvaluationResponse[]>('/api/admin/evaluations');
  }

  createEvaluation(applicationId: number, payload: AdminEvaluationPayload) {
    return this.fetch<AdminEvaluationResponse>(`/api/admin/applications/${applicationId}/evaluations`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  getDatabaseOverview() {
    return this.fetch<AdminDatabaseOverviewResponse>('/api/admin/database/overview');
  }

  getDatabaseTable(tableName: AdminDatabaseTablePreviewResponse['table'], limit: number = 25) {
    return this.fetch<AdminDatabaseTablePreviewResponse>(`/api/admin/database/tables/${tableName}?limit=${limit}`);
  }
}

export const adminApi = new AdminApiClient();
