import { apiFetch } from './api-client';

export interface PublicApplicationSubmitPayload {
  name: string;
  email: string;
  interest: string;
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
  name?: string;
  created_at?: string;
  assessment_token?: string;
  assessment_url?: string;
}

class PublicApplicationsApiClient {
  private timeoutMs = 5000;

  submitApplication(payload: PublicApplicationSubmitPayload) {
    const formData = new FormData();
    formData.append('name', payload.name);
    formData.append('email', payload.email);
    formData.append('interest', payload.interest);
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
