export type DecisionValue = 'YES' | 'NO' | 'MAYBE';

export interface ApplicantRecord {
  id: number;
  name: string;
  email: string;
  interest: string | null;
  resume_filename: string | null;
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
  assigned_exec?: string | null;
  resume_url?: string | null;
}

export interface FeedbackEntry {
  id: string;
  applicantId: number;
  interviewerName: string;
  assignedExec: string;
  round: string;
  cultureFitScore: number;
  technicalScore: number;
  communicationScore: number;
  leadershipPotentialScore: number;
  recommendation: DecisionValue;
  strengths: string;
  concerns: string;
  comments: string;
  submittedAt: string;
}
