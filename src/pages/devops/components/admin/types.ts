export type DecisionValue = 'YES' | 'LEAN YES' | 'MAYBE' | 'LEAN NO' | 'NO';
export type RatingBand = 1 | 2 | 3 | 4 | 5;
export type IntervieweeGender = 'Male' | 'Female' | 'Other';
export type InterviewerRole = 'Primary' | 'Secondary';

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

export const ratingBandOptions = [
  { value: 1, label: 'Below Expectations' },
  { value: 2, label: '1' },
  { value: 3, label: '2' },
  { value: 4, label: '3' },
  { value: 5, label: 'Above Expectations' },
] as const;

export const feedbackMetricFields = [
  {
    key: 'leadershipScore',
    label: 'Leadership skills',
    description: 'Ambition, work ethic, ability to make impact, and ownership.',
  },
  {
    key: 'interestInOtcrScore',
    label: "Interest in OTCR",
    description: 'Signals genuine motivation and fit for the organization.',
  },
  {
    key: 'behavioralPerformanceScore',
    label: 'General behavioral performance',
    description: 'Professionalism, maturity, clarity, and judgment.',
  },
  {
    key: 'businessAcumenScore',
    label: 'Business acumen',
    description: 'Commercial intuition and business reasoning.',
  },
  {
    key: 'qualitativeCreativityScore',
    label: 'Qualitative creativity',
    description: 'Idea quality, structure, and originality.',
  },
  {
    key: 'quantitativeStructureScore',
    label: 'Quantitative structural ability',
    description: 'How they structured the market sizing or quant work.',
  },
  {
    key: 'casePerformanceScore',
    label: 'Overall case performance',
    description: 'Communication, organization, composure, and recovery.',
  },
  {
    key: 'creativityConversationScore',
    label: 'Creativity / conversation test',
    description: 'Overall performance on the creativity and conversation test.',
  },
] as const;

export type FeedbackMetricKey = (typeof feedbackMetricFields)[number]['key'];

export const formatRatingBand = (value: RatingBand) =>
  ratingBandOptions.find((option) => option.value === value)?.label ?? 'Not rated';
