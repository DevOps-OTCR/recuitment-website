export type DecisionValue = 'YES' | 'LEAN YES' | 'MAYBE' | 'LEAN NO' | 'NO';
export type RatingBand = 1 | 2 | 3;
export type IntervieweeGender = 'Male' | 'Female' | 'Other';
export type InterviewerRole = 'Primary' | 'Secondary';
export type InterviewRound = 'Round 1' | 'Round 2';
export type DatabaseTableName =
  | 'applications'
  | 'evaluations'
  | 'interview_assignments'
  | 'assessment_links'
  | 'attempts'
  | 'submissions'
  | 'cycles'
  | 'assessment_progress_snapshots'
  | 'users';

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
  applicantName: string;
  interviewerName: string;
  intervieweeName: string;
  intervieweeGender: IntervieweeGender;
  interviewerRole: InterviewerRole;
  round: InterviewRound;
  leadershipScore: RatingBand;
  interestInOtcrScore: RatingBand;
  behavioralPerformanceScore: RatingBand;
  businessAcumenScore: RatingBand;
  qualitativeCreativityScore: RatingBand;
  quantitativeStructureScore: RatingBand;
  casePerformanceScore: RatingBand;
  creativityConversationScore: RatingBand;
  recommendation: DecisionValue;
  finalRoundSummary: string;
  overallPerformanceOverview: string;
  submittedAt: string;
}

export const normalizeRatingBand = (value: number | null | undefined): RatingBand => {
  if (value === 1 || value === 2 || value === 3) return value;
  if (value == null || Number.isNaN(value)) return 2;
  return value < 1 ? 1 : 3;
};

export const ratingBandOptions = [
  { value: 1, label: '1' },
  { value: 2, label: '2' },
  { value: 3, label: '3' },
] as const;

export const feedbackMetricFields = [
  {
    key: 'leadershipScore',
    label: 'Leadership skills',
    description: 'Ambition, work ethic, ability to make impact, and ownership.',
  },
  {
    key: 'interestInOtcrScore',
    label: "Interest\nin OTCR",
    description: 'Signals genuine motivation and fit for the organization.',
  },
  {
    key: 'behavioralPerformanceScore',
    label: 'Behavioral performance',
    description: 'Professionalism, maturity, clarity, and judgment.',
  },
  {
    key: 'businessAcumenScore',
    label: 'Business\nacumen',
    description: 'Commercial intuition and business reasoning.',
  },
  {
    key: 'qualitativeCreativityScore',
    label: 'Qualitative creativity',
    description: 'Idea quality, structure, and originality.',
  },
  {
    key: 'quantitativeStructureScore',
    label: 'Quantitative ability',
    description: 'How they structured the market sizing or quant work.',
  },
  {
    key: 'casePerformanceScore',
    label: 'Overall case performance',
    description: 'Communication, organization, composure, and recovery.',
  },
  {
    key: 'creativityConversationScore',
    label: 'Creative\ntest',
    description: 'Overall performance on the creativity and conversation test.',
  },
] as const;

export type FeedbackMetricKey = (typeof feedbackMetricFields)[number]['key'];

export const formatRatingBand = (value: RatingBand) =>
  ratingBandOptions.find((option) => option.value === value)?.label ?? 'Not rated';

export interface DatabaseTableSummary {
  table: DatabaseTableName;
  count: number;
}

export interface DatabaseOverview {
  generatedAt: string;
  persistence: {
    database: string;
    storage: string;
  };
  tables: DatabaseTableSummary[];
}

export interface DatabaseTablePreview {
  table: DatabaseTableName;
  count: number;
  columns: string[];
  rows: Array<Record<string, unknown>>;
}

export const databaseTableLabels: Record<DatabaseTableName, string> = {
  applications: 'Applications',
  evaluations: 'Evaluations',
  interview_assignments: 'Interview Assignments',
  assessment_links: 'Assessment Links',
  attempts: 'Attempts',
  submissions: 'Submissions',
  cycles: 'Cycles',
  assessment_progress_snapshots: 'Progress Snapshots',
  users: 'Users',
};
