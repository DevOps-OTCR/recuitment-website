import { apiFetch } from './api-client';

export interface PublicApplicationSubmitPayload {
  name: string;
  email: string;
  interest: string;
  cycle: '1' | '2';
  resume: File;
}

export interface PublicApplicationResponse {
  id: number;
  name: string;
  email: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  message: string;
}

export interface PublicApplicationStatusResponse {
  found: boolean;
  message?: string;
  status?: 'pending' | 'approved' | 'rejected';
  recruiting_status?: 'applied' | 'round_1' | 'round_2' | 'accepted' | 'rejected';
  current_round?: 'Round 1' | 'Round 2' | null;
  final_decision?: 'YES' | 'NO' | 'MAYBE';
  name?: string;
  created_at?: string;
  reviewed_at?: string | null;
  assessment_token?: string;
  assessment_url?: string;
  interview_scheduled?: boolean;
  interview_round?: 'Round 1' | 'Round 2' | null;
  interview_room?: string | null;
  interview_time?: string | null;
}

class PublicApplicationsApiClient {
  private timeoutMs = 5000;

  submitApplication(payload: PublicApplicationSubmitPayload) {
    const formData = new FormData();
    formData.append('name', payload.name);
    formData.append('email', payload.email);
    formData.append('interest', payload.interest);
    formData.append('cycle', payload.cycle);
    formData.append('resume', payload.resume);

    return apiFetch<PublicApplicationResponse>('/api/applications', {
      method: 'POST',
      body: formData,
      auth: false,
      timeoutMs: this.timeoutMs,
    });
  }

  checkApplicationStatus(email: string) {
    return apiFetch<PublicApplicationStatusResponse>(
      `/api/applications/check/${encodeURIComponent(email.trim().toLowerCase())}`,
      {
        method: 'GET',
        auth: false,
        timeoutMs: this.timeoutMs,
      }
    );
  }
}

export const publicApplicationsApi = new PublicApplicationsApiClient();
