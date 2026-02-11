/**
 * API client for the DevOps OA backend
 */

import { getOaApiUrl } from './oa-api-url';

const API_BASE_URL = getOaApiUrl();

export interface QuestionOption {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  type: 'mcq' | 'short_answer';
  questionText: string;
  options?: QuestionOption[];
}

export interface ProblemSolvingConfig {
  title: string;
  timeEstimate: string;
  instructions: string;
  questions: Question[];
}

export interface CodingConfig {
  title: string;
  timeEstimate: string;
  instructions: string;
  problem: {
    title: string;
    description: string;
    starterCode: string;
  };
  testCases: Array<{
    input: string;
    expectedOutput: string;
  }>;
}

export interface SystemDesignConfig {
  title: string;
  timeEstimate: string;
  instructions: string;
  prompt: string;
}

export interface AssessmentConfig {
  estimatedMinutes: number;
  timeLimitMinutes?: number;
  sections: string[];
  problemSolving: ProblemSolvingConfig;
  coding: CodingConfig;
  systemDesign: SystemDesignConfig;
  requiresEmail?: boolean;
}

export interface ProgressResponse {
  started_at: string;
  last_activity_at: string;
  completed_at: string | null;
  sections_completed: string[];
}

export interface SubmitResponse {
  success: boolean;
  section: string;
  coding_result?: {
    passed: number;
    total: number;
    details: Array<{
      test: number;
      passed: boolean;
      expected?: string;
      actual?: string;
      error?: string;
    }>;
  };
}

class AssessmentApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async fetch<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error ${response.status}: ${errorText}`);
    }

    return response.json();
  }

  /**
   * Get assessment configuration for a token
   */
  async getConfig(token: string): Promise<AssessmentConfig> {
    return this.fetch<AssessmentConfig>(`/api/assessment/${token}`);
  }

  /**
   * Start or resume an assessment attempt
   * @param token Assessment token
   * @param email Optional email for verification (required if link has email)
   */
  async startAttempt(token: string, email?: string): Promise<ProgressResponse> {
    return this.fetch<ProgressResponse>(`/api/assessment/${token}/start`, {
      method: 'POST',
      body: email ? JSON.stringify({ email }) : undefined,
    });
  }

  /**
   * Get current progress for an assessment
   */
  async getProgress(token: string): Promise<ProgressResponse> {
    return this.fetch<ProgressResponse>(`/api/assessment/${token}/progress`);
  }

  /**
   * Submit a section of the assessment
   */
  async submitSection(
    token: string,
    section: string,
    payload: any
  ): Promise<SubmitResponse> {
    return this.fetch<SubmitResponse>(`/api/assessment/${token}/submit`, {
      method: 'POST',
      body: JSON.stringify({ section, payload }),
    });
  }

  /**
   * Test code without submitting (coding section only)
   */
  async testCode(
    token: string,
    code: string,
    language: string = 'python3'
  ): Promise<SubmitResponse['coding_result']> {
    return this.fetch<SubmitResponse['coding_result']>(`/api/assessment/${token}/test-code`, {
      method: 'POST',
      body: JSON.stringify({ code, language }),
    });
  }

  /**
   * Get result summary (after completion)
   */
  async getResult(token: string): Promise<{
    submitted_at: string | null;
    sections_completed: string[];
    completed: boolean;
  }> {
    return this.fetch(`/api/assessment/${token}/result`);
  }
}

// Export singleton instance
export const assessmentApi = new AssessmentApiClient(API_BASE_URL);
