import { getOaApiUrl } from './oa-api-url';

const API_BASE_URL = getOaApiUrl();

export interface AdminEvaluationPayload {
  interviewer_name: string;
  interviewee_name: string;
  interviewee_gender: 'Male' | 'Female' | 'Other';
  interviewer_role: 'Primary' | 'Secondary';
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
      | 'assessment_progress_snapshots';
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
    | 'assessment_progress_snapshots';
  count: number;
  columns: string[];
  rows: Array<Record<string, unknown>>;
}

class AdminApiClient {
  private baseUrl = API_BASE_URL;
  private timeoutMs = 2500;

  private async fetch<T>(endpoint: string, adminSecret: string, options: RequestInit = {}): Promise<T> {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), this.timeoutMs);
    let response: Response;

    try {
      response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Secret': adminSecret,
          ...options.headers,
        },
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new Error(`Admin API request timed out after ${this.timeoutMs}ms`);
      }
      throw error;
    } finally {
      window.clearTimeout(timeoutId);
    }

    if (!response.ok) {
      const message = await response.text();
      throw new Error(`API Error ${response.status}: ${message}`);
    }

    return response.json();
  }

  listApplications(adminSecret: string) {
    return this.fetch<AdminApplicationResponse[]>('/api/admin/applications', adminSecret);
  }

  listEvaluations(adminSecret: string) {
    return this.fetch<AdminEvaluationResponse[]>('/api/admin/evaluations', adminSecret);
  }

  createEvaluation(adminSecret: string, applicationId: number, payload: AdminEvaluationPayload) {
    return this.fetch<AdminEvaluationResponse>(`/api/admin/applications/${applicationId}/evaluations`, adminSecret, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  getDatabaseOverview(adminSecret: string) {
    return this.fetch<AdminDatabaseOverviewResponse>('/api/admin/database/overview', adminSecret);
  }

  getDatabaseTable(adminSecret: string, tableName: AdminDatabaseTablePreviewResponse['table'], limit: number = 25) {
    return this.fetch<AdminDatabaseTablePreviewResponse>(`/api/admin/database/tables/${tableName}?limit=${limit}`, adminSecret);
  }
}

export const adminApi = new AdminApiClient();
