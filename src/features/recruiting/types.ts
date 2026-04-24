export enum Role {
  Partner = 'partner',
  PM = 'pm',
  LC = 'lc',
  Consultant = 'consultant',
  Applicant = 'applicant',
}

export enum ApplicationStatus {
  Applied = 'applied',
  Round1 = 'round_1',
  Round2 = 'round_2',
  Accepted = 'accepted',
  Rejected = 'rejected',
}

export enum InterviewRound {
  Round1 = 'round_1',
  Round2 = 'round_2',
}

export type ApplicantCycle = 1 | 2;
export type SchoolYear = 'Freshman' | 'Sophomore' | 'Junior' | 'Senior' | 'Graduate';
export type TeamApplyingFor = 'Consulting' | 'Operations' | 'Technology' | 'Design' | 'Internal';
export type EvaluationRecommendation = 'strong_yes' | 'yes' | 'lean_yes' | 'lean_no' | 'no';
export type AssignmentRole = 'primary' | 'secondary';

export interface ApplicantFormFields {
  name: string;
  email: string;
  resume: string;
  schoolYear: SchoolYear;
  whyOtcr: string;
  caseAnswer: string;
  teamApplyingFor: TeamApplyingFor;
  cycle: ApplicantCycle;
}

export interface Applicant extends ApplicantFormFields {
  id: string;
  status: ApplicationStatus;
  currentRound: InterviewRound | null;
  finalDecision: 'accepted' | 'rejected' | 'pending';
  assignedPrimaryInterviewerId: string | null;
  assignedSecondaryInterviewerId: string | null;
  submittedAt: string;
  updatedAt: string;
  notes: string;
}

export interface Evaluation {
  id: string;
  applicantId: string;
  interviewerId: string;
  interviewerRole: Exclude<Role, Role.Applicant>;
  round: InterviewRound;
  recommendation: EvaluationRecommendation;
  rubric: {
    communication: number;
    structure: number;
    problemSolving: number;
    motivation: number;
    teamwork: number;
  };
  summary: string;
  strengths: string[];
  concerns: string[];
  submittedAt: string;
}

export interface Assignment {
  id: string;
  applicantId: string;
  round: InterviewRound;
  role: AssignmentRole;
  interviewerId: string;
  assignedByUserId: string;
  assignedAt: string;
  room: string | null;
  scheduledTime: string | null;
}

export interface RecruitingUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  title: string;
  active: boolean;
}

export interface ApplicantPortalSnapshot {
  applicantId: string;
  applicantName: string;
  applicantEmail: string;
  status: ApplicationStatus;
  currentRound: InterviewRound | null;
  finalDecision: Applicant['finalDecision'];
  statusLabel: string;
}

export interface RecruitingState {
  applicants: Applicant[];
  evaluations: Evaluation[];
  assignments: Assignment[];
  users: RecruitingUser[];
}
