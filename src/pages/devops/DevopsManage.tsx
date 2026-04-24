import { useEffect, useMemo, useState } from 'react';
import {
  CalendarPlus2,
  ClipboardList,
  Database,
  LayoutGrid,
  Loader2,
  LogOut,
  RefreshCcw,
} from 'lucide-react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';

import Footer from '@/components/Footer';
import Navigation from '@/components/Navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import ApplicantDetail from '@/pages/devops/components/admin/ApplicantDetail';
import ConsultantList from '@/pages/devops/components/admin/ConsultantList';
import DatabaseView from '@/pages/devops/components/admin/DatabaseView';
import {
  applyRecruitingDecision,
  Role,
  InterviewRound as RecruitingInterviewRound,
  useRecruitingStore,
  type Applicant as RecruitingApplicant,
  type Evaluation as RecruitingEvaluation,
  type RecruitingState,
  type RecruitingDecisionAction,
  type RecruitingRole,
} from '@/features/recruiting';
import {
  feedbackMetricFields,
  normalizeRatingBand,
  type ApplicantRecord,
  type DatabaseOverview,
  type DatabaseTableName,
  type DatabaseTablePreview,
  type FeedbackEntry,
  type InterviewRound,
} from '@/pages/devops/components/admin/types';
import otcrTechLogo from '@/assets/otcr-technologies-white-nomargins.webp';

const MANAGE_VIEWER_ROLE_STORAGE = 'otcr_manage_viewer_role';

const defaultExecRoster = ['Ava Patel', 'Mihika Rao', 'Isaiah Brooks', 'Laksh Shah'];

const deriveAssignedExec = (applicant: ApplicantRecord) =>
  applicant.assigned_exec ??
  applicant.notes?.match(/assigned[:\s]+([a-zA-Z\s]+)/i)?.[1]?.trim() ??
  defaultExecRoster[applicant.id % defaultExecRoster.length];

const groupFeedbackEntries = (entries: FeedbackEntry[]) =>
  entries.reduce<Record<number, FeedbackEntry[]>>((acc, entry) => {
    acc[entry.applicantId] = [entry, ...(acc[entry.applicantId] ?? [])];
    return acc;
  }, {});

const normalizeRoundEntries = (entries: FeedbackEntry[]) => {
  const orderedEntries = entries
    .slice()
    .sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime());

  const assignedRoles = new Set<'Primary' | 'Secondary'>();

  return orderedEntries.map((entry) => {
    let normalizedRole = entry.interviewerRole;

    if (assignedRoles.has(normalizedRole)) {
      normalizedRole = normalizedRole === 'Primary' ? 'Secondary' : 'Primary';
    }

    if (!assignedRoles.has(normalizedRole)) {
      assignedRoles.add(normalizedRole);
    }

    return normalizedRole === entry.interviewerRole
      ? entry
      : {
          ...entry,
          interviewerRole: normalizedRole,
        };
  });
};

const getVoteCounts = (entries: FeedbackEntry[]) =>
  normalizeRoundEntries(entries).reduce(
    (acc, entry) => {
      if (entry.recommendation === 'YES' || entry.recommendation === 'LEAN YES') acc.yes += 1;
      if (entry.recommendation === 'NO' || entry.recommendation === 'LEAN NO') acc.no += 1;
      if (entry.recommendation === 'MAYBE') acc.maybe += 1;
      return acc;
    },
    { yes: 0, no: 0, maybe: 0 }
  );

const getEntryAverageScore = (entry: FeedbackEntry) =>
  feedbackMetricFields.reduce((sum, field) => sum + entry[field.key], 0) / feedbackMetricFields.length;

const getAverageScore = (entries: FeedbackEntry[]) => {
  if (entries.length === 0) return null;

  const uniqueReviewerEntries = normalizeRoundEntries(entries);

  const reviewerAverages = uniqueReviewerEntries.map(getEntryAverageScore);
  const total = reviewerAverages.reduce((sum, value) => sum + value, 0);

  return total / reviewerAverages.length;
};

const interviewRounds: InterviewRound[] = ['Round 1', 'Round 2'];

const getOverallStatus = (applicant: ApplicantRecord, entries: FeedbackEntry[]) => {
  const votes = getVoteCounts(entries);

  if (votes.yes >= 2) return 'YES';
  if (votes.no >= 2) return 'NO';
  if (entries.length === 0) {
    return 'Pending';
  }
  if (votes.yes > votes.no && votes.yes > 0) return 'YES';
  if (votes.no > votes.yes && votes.no > 0) return 'NO';
  if (votes.maybe > 0) return 'Pending';
  return 'Pending';
};

const numericApplicantId = (applicantId: string) =>
  applicantId.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);

const roleToInterviewerRole = (role: Role) =>
  role === Role.Consultant || role === Role.LC ? 'Secondary' : 'Primary';

const recommendationToFeedback = (recommendation: RecruitingEvaluation['recommendation']): FeedbackEntry['recommendation'] => {
  switch (recommendation) {
    case 'strong_yes':
    case 'yes':
      return 'YES';
    case 'lean_yes':
      return 'LEAN YES';
    case 'no':
      return 'NO';
    case 'lean_no':
    default:
      return 'LEAN NO';
  }
};

const feedbackToRecommendation = (recommendation: FeedbackEntry['recommendation']): RecruitingEvaluation['recommendation'] => {
  switch (recommendation) {
    case 'YES':
      return 'yes';
    case 'LEAN YES':
      return 'lean_yes';
    case 'NO':
      return 'no';
    case 'MAYBE':
    case 'LEAN NO':
    default:
      return 'lean_no';
  }
};

const mapRecruitingApplicant = (applicant: RecruitingApplicant): ApplicantRecord => ({
  id: numericApplicantId(applicant.id),
  name: applicant.name,
  email: applicant.email,
  interest: applicant.whyOtcr,
  resume_filename: applicant.resume.split('/').pop() ?? applicant.resume,
  resume_url: null,
  status: applicant.status,
  final_decision: applicant.finalDecision.toUpperCase(),
  cycle_name: `Cycle ${applicant.cycle}`,
  created_at: applicant.submittedAt,
  reviewed_at: applicant.updatedAt,
  notes: applicant.notes,
  has_assessment_link: false,
  assessment_completed: false,
  assessment_token: null,
  focus_loss_events: 0,
  is_flagged: false,
  integrity_notes: null,
  archived_at: null,
  assigned_exec: deriveAssignedExec({
    id: numericApplicantId(applicant.id),
    name: applicant.name,
    email: applicant.email,
    interest: applicant.whyOtcr,
    resume_filename: applicant.resume.split('/').pop() ?? applicant.resume,
    status: applicant.status,
    final_decision: applicant.finalDecision.toUpperCase(),
    cycle_name: `Cycle ${applicant.cycle}`,
    created_at: applicant.submittedAt,
    reviewed_at: applicant.updatedAt,
    notes: applicant.notes,
    has_assessment_link: false,
    assessment_completed: false,
    assessment_token: null,
    focus_loss_events: 0,
    is_flagged: false,
    integrity_notes: null,
    archived_at: null,
    assigned_exec: null,
    resume_url: null,
  }),
});

const mapRecruitingEvaluation = (
  evaluation: RecruitingEvaluation,
  state: RecruitingState
): FeedbackEntry => {
  const applicant = state.applicants.find((entry) => entry.id === evaluation.applicantId);
  const interviewer = state.users.find((entry) => entry.id === evaluation.interviewerId);

  return {
    id: evaluation.id,
    applicantId: numericApplicantId(evaluation.applicantId),
    applicantName: applicant?.name ?? evaluation.applicantId,
    interviewerName: interviewer?.name ?? 'Unknown interviewer',
    intervieweeName: applicant?.name ?? evaluation.applicantId,
    intervieweeGender: 'Other',
    interviewerRole: roleToInterviewerRole(evaluation.interviewerRole),
    round: evaluation.round === RecruitingInterviewRound.Round2 ? 'Round 2' : 'Round 1',
    leadershipScore: Math.min(3, Math.max(1, Math.round((evaluation.rubric.teamwork + evaluation.rubric.motivation) / 3))) as FeedbackEntry['leadershipScore'],
    interestInOtcrScore: Math.min(3, Math.max(1, Math.round(evaluation.rubric.motivation / 2))) as FeedbackEntry['interestInOtcrScore'],
    behavioralPerformanceScore: Math.min(3, Math.max(1, Math.round(evaluation.rubric.communication / 2))) as FeedbackEntry['behavioralPerformanceScore'],
    businessAcumenScore: Math.min(3, Math.max(1, Math.round(evaluation.rubric.problemSolving / 2))) as FeedbackEntry['businessAcumenScore'],
    qualitativeCreativityScore: Math.min(3, Math.max(1, Math.round(evaluation.rubric.problemSolving / 2))) as FeedbackEntry['qualitativeCreativityScore'],
    quantitativeStructureScore: Math.min(3, Math.max(1, Math.round(evaluation.rubric.structure / 2))) as FeedbackEntry['quantitativeStructureScore'],
    casePerformanceScore: Math.min(3, Math.max(1, Math.round((evaluation.rubric.problemSolving + evaluation.rubric.structure) / 4))) as FeedbackEntry['casePerformanceScore'],
    creativityConversationScore: Math.min(3, Math.max(1, Math.round((evaluation.rubric.communication + evaluation.rubric.teamwork) / 4))) as FeedbackEntry['creativityConversationScore'],
    recommendation: recommendationToFeedback(evaluation.recommendation),
    finalRoundSummary: evaluation.concerns.join(', '),
    overallPerformanceOverview: evaluation.summary,
    submittedAt: evaluation.submittedAt,
  };
};

const buildSharedWorkspaceSnapshot = (state: RecruitingState) => ({
  applications: state.applicants.map(mapRecruitingApplicant),
  evaluations: state.evaluations.map((evaluation) => mapRecruitingEvaluation(evaluation, state)),
});

const viewerRoles: RecruitingRole[] = ['partner', 'pm', 'lc', 'consultant'];

const recruitingDecisionLabels: Record<RecruitingDecisionAction, string> = {
  reject_after_application_review: 'reject this applicant after application review',
  advance_to_round_1: 'advance this applicant to Round 1',
  reject_after_round_1: 'reject this applicant after Round 1',
  advance_to_round_2: 'advance this applicant to Round 2',
  reject_after_round_2: 'reject this applicant after Round 2',
  accept_final: 'mark this applicant as accepted',
};

const isDecisionMaker = (role: RecruitingRole) => role === 'partner' || role === 'pm';

const adminViewButtonClass = (active: boolean) =>
  cn(
    'h-11 rounded-xl border transition-all',
    active
      ? 'border-cyan-300/50 bg-cyan-400/10 text-white hover:bg-cyan-400/15'
      : 'border-white/10 bg-white/5 text-white/75 hover:bg-white/10 hover:text-white'
  );

const DevopsManage = () => {
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const recruitingState = useRecruitingStore((state) => state);
  const sharedWorkspace = useMemo(() => buildSharedWorkspaceSnapshot(recruitingState), [recruitingState]);

  const [loading, setLoading] = useState(false);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [applications, setApplications] = useState<ApplicantRecord[]>(sharedWorkspace.applications);
  const [selectedApplicantId, setSelectedApplicantId] = useState<number | null>(sharedWorkspace.applications[0]?.id ?? null);
  const [searchValue, setSearchValue] = useState('');
  const [cycleFilter, setCycleFilter] = useState<'all' | string>('all');
  const [feedbackByApplicant, setFeedbackByApplicant] = useState<Record<number, FeedbackEntry[]>>(groupFeedbackEntries(sharedWorkspace.evaluations));
  const [databaseOverview, setDatabaseOverview] = useState<DatabaseOverview | null>(null);
  const [databasePreview, setDatabasePreview] = useState<DatabaseTablePreview | null>(null);
  const [selectedDatabaseTable, setSelectedDatabaseTable] = useState<DatabaseTableName>('evaluations');
  const [selectedRoundsByApplicant, setSelectedRoundsByApplicant] = useState<Record<number, InterviewRound>>({});
  const [listRound, setListRound] = useState<InterviewRound>('Round 1');
  const [viewerRole, setViewerRole] = useState<RecruitingRole>('consultant');
  const [pendingDecision, setPendingDecision] = useState<{ applicant: ApplicantRecord; action: RecruitingDecisionAction } | null>(null);

  const isApplicantsView = location.pathname === '/tech/manage/applicants';
  const isDatabaseView = location.pathname === '/tech/manage/database';
  const requestedApplicantIdParam = searchParams.get('applicantId');
  const requestedApplicantId =
    requestedApplicantIdParam && Number.isFinite(Number(requestedApplicantIdParam))
      ? Number(requestedApplicantIdParam)
      : null;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedViewerRole = window.localStorage.getItem(MANAGE_VIEWER_ROLE_STORAGE);
    if (storedViewerRole && viewerRoles.includes(storedViewerRole as RecruitingRole)) {
      setViewerRole(storedViewerRole as RecruitingRole);
    }
  }, []);

  useEffect(() => {
    setApplications(sharedWorkspace.applications);
    setFeedbackByApplicant(groupFeedbackEntries(sharedWorkspace.evaluations));
  }, [sharedWorkspace]);

  useEffect(() => {
    if (!isDatabaseView) return;

    setDatabaseOverview({
      generatedAt: new Date().toISOString(),
      persistence: {
        database: 'frontend-only shared recruiting state',
        storage: 'localStorage',
      },
      tables: [
        { table: 'applications', count: recruitingState.applicants.length },
        { table: 'evaluations', count: recruitingState.evaluations.length },
        { table: 'assessment_links', count: 0 },
        { table: 'attempts', count: 0 },
        { table: 'submissions', count: 0 },
        { table: 'cycles', count: 2 },
        { table: 'assessment_progress_snapshots', count: 0 },
      ],
    });

    setDatabasePreview({
      table: selectedDatabaseTable,
      count:
        selectedDatabaseTable === 'applications'
          ? recruitingState.applicants.length
          : selectedDatabaseTable === 'evaluations'
            ? recruitingState.evaluations.length
            : 0,
      columns:
        selectedDatabaseTable === 'applications'
          ? ['id', 'name', 'email', 'status', 'currentRound', 'finalDecision', 'updatedAt']
          : selectedDatabaseTable === 'evaluations'
            ? ['id', 'applicantId', 'interviewerId', 'round', 'recommendation', 'submittedAt']
            : [],
      rows:
        selectedDatabaseTable === 'applications'
          ? recruitingState.applicants.slice(0, 10).map((applicant) => ({
              id: applicant.id,
              name: applicant.name,
              email: applicant.email,
              status: applicant.status,
              currentRound: applicant.currentRound,
              finalDecision: applicant.finalDecision,
              updatedAt: applicant.updatedAt,
            }))
          : selectedDatabaseTable === 'evaluations'
            ? recruitingState.evaluations.slice(0, 10).map((evaluation) => ({
                id: evaluation.id,
                applicantId: evaluation.applicantId,
                interviewerId: evaluation.interviewerId,
                round: evaluation.round,
                recommendation: evaluation.recommendation,
                submittedAt: evaluation.submittedAt,
              }))
            : [],
    });
  }, [isDatabaseView, recruitingState, selectedDatabaseTable]);

  const cycleOptions = useMemo(() => {
    const cycles = Array.from(new Set(applications.map((applicant) => applicant.cycle_name).filter(Boolean)));
    return ['all', ...cycles] as string[];
  }, [applications]);

  const filteredApplicants = useMemo(
    () =>
      applications.filter((applicant) => {
        const searchMatches = applicant.name.toLowerCase().includes(searchValue.toLowerCase());
        const cycleMatches = cycleFilter === 'all' || applicant.cycle_name === cycleFilter;
        return searchMatches && cycleMatches;
      }),
    [applications, cycleFilter, searchValue]
  );

  useEffect(() => {
    if (!filteredApplicants.length) {
      setSelectedApplicantId(null);
      return;
    }

    const selectedStillVisible = filteredApplicants.some((applicant) => applicant.id === selectedApplicantId);
    if (!selectedStillVisible) setSelectedApplicantId(filteredApplicants[0].id);
  }, [filteredApplicants, selectedApplicantId]);

  useEffect(() => {
    if (requestedApplicantId === null || !applications.some((applicant) => applicant.id === requestedApplicantId)) return;
    setSelectedApplicantId(requestedApplicantId);
  }, [applications, requestedApplicantId]);

  const selectedApplicant = filteredApplicants.find((applicant) => applicant.id === selectedApplicantId) ?? null;
  const getAvailableRounds = (_applicantId: number): InterviewRound[] => interviewRounds;

  const getSelectedRound = (applicantId: number): InterviewRound => selectedRoundsByApplicant[applicantId] ?? 'Round 1';

  const getEntriesForRound = (applicantId: number, round: InterviewRound) =>
    normalizeRoundEntries((feedbackByApplicant[applicantId] ?? []).filter((entry) => entry.round === round));

  const totalFeedbackCount = useMemo(
    () => Object.values(feedbackByApplicant).reduce((sum, entries) => sum + entries.length, 0),
    [feedbackByApplicant]
  );

  const recentFeedback = useMemo(
    () =>
      Object.values(feedbackByApplicant)
        .flat()
        .slice()
        .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
        .slice(0, 5),
    [feedbackByApplicant]
  );

  const handleLogout = () => {
    setApplications(sharedWorkspace.applications);
    setFeedbackByApplicant(groupFeedbackEntries(sharedWorkspace.evaluations));
    setDatabaseOverview(null);
    setDatabasePreview(null);
    setSelectedApplicantId(sharedWorkspace.applications[0]?.id ?? null);
    navigate('/tech/manage', { replace: true });
  };

  const handleViewerRoleChange = (nextRole: RecruitingRole) => {
    setViewerRole(nextRole);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(MANAGE_VIEWER_ROLE_STORAGE, nextRole);
    }
  };

  const handleOpenResume = async (applicant: ApplicantRecord) => {
    if (applicant.resume_url) {
      window.open(applicant.resume_url, '_blank', 'noopener,noreferrer');
      return;
    }

    toast({
      title: 'Resume unavailable',
      description: 'This shared local recruiting dataset does not include live resume files.',
    });
  };

  const handleRefresh = () => {
    setApplications(sharedWorkspace.applications);
    setFeedbackByApplicant(groupFeedbackEntries(sharedWorkspace.evaluations));
  };

  const handleConfirmDecision = () => {
    if (!pendingDecision) return;

    const decisionRecord = applyRecruitingDecision(pendingDecision.applicant, pendingDecision.action);

    setPendingDecision(null);
    toast({
      title: 'Decision saved',
      description: `${pendingDecision.applicant.name} was updated to ${decisionRecord.status.replace(/_/g, ' ')} in shared recruiting state.`,
    });
  };

  const voteCountsForApplicant = (applicantId: number) => getVoteCounts(getEntriesForRound(applicantId, listRound));
  const statusForApplicant = (applicant: ApplicantRecord) => applicant.status.replace(/_/g, ' ');
  const scoreForApplicant = (applicantId: number) => getAverageScore(getEntriesForRound(applicantId, listRound));
  const overallApplicantAverageScore = useMemo(() => {
    const scores = filteredApplicants
      .map((applicant) => scoreForApplicant(applicant.id))
      .filter((score): score is number => score !== null);

    if (scores.length === 0) return null;
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }, [filteredApplicants, feedbackByApplicant, listRound]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <section className="relative overflow-hidden px-4 pb-24 pt-28">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.14),transparent_26%),radial-gradient(circle_at_80%_20%,rgba(34,197,94,0.10),transparent_18%),linear-gradient(180deg,rgba(3,8,17,0.92),rgba(3,8,17,1))]" />
        <div className="relative mx-auto max-w-7xl">
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <Button asChild variant="outline" className={adminViewButtonClass(!isApplicantsView && !isDatabaseView)}>
              <Link to="/tech/manage">
                <LayoutGrid className="h-4 w-4" />
                Dashboard
              </Link>
            </Button>
            <Button asChild variant="outline" className={adminViewButtonClass(false)}>
              <Link to="/tech/assignments">
                <CalendarPlus2 className="h-4 w-4" />
                Assignments
              </Link>
            </Button>
            <Button asChild variant="outline" className={adminViewButtonClass(isApplicantsView)}>
              <Link to="/tech/manage/applicants">
                <ClipboardList className="h-4 w-4" />
                Applicants
              </Link>
            </Button>
            <Button asChild variant="outline" className={adminViewButtonClass(isDatabaseView)}>
              <Link to="/tech/manage/database">
                <Database className="h-4 w-4" />
                Database
              </Link>
            </Button>
          </div>

          <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-cyan-200/70">Recruitment admin</p>
              <div className="mt-3 flex items-center gap-4">
                <img src={otcrTechLogo} alt="OTCR Technologies" className="h-10 w-auto" />
                <h1 className="text-3xl font-semibold text-white">
                  {!isApplicantsView && !isDatabaseView
                    ? 'Consultant review dashboard'
                    : isApplicantsView
                      ? 'Applicants'
                      : 'Database'}
                </h1>
              </div>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-white/60">
                {!isApplicantsView && !isDatabaseView
                  ? 'Choose between applicant review, assignments, and a local shared-state database preview.'
                  : isApplicantsView
                    ? 'This is the applicant review workspace, backed by the same shared local recruiting data used across the tech workflow.'
                    : 'Inspect the current shared local recruiting tables, row counts, and recent records without leaving the admin dashboard.'}
              </p>
              <p className="mt-2 text-xs uppercase tracking-[0.24em] text-white/40">
                Visible under <span className="text-white/70">/tech/manage</span> and legacy redirects under <span className="text-white/70">/devops/manage</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {isApplicantsView ? (
                <>
                  <select
                    value={cycleFilter}
                    onChange={(event) => setCycleFilter(event.target.value)}
                    className="h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none"
                  >
                    {cycleOptions.map((cycle) => (
                      <option key={cycle} value={cycle} className="bg-slate-900 text-white">
                        {cycle === 'all' ? 'All cycles' : cycle}
                      </option>
                    ))}
                  </select>
                  <select
                    value={viewerRole}
                    onChange={(event) => handleViewerRoleChange(event.target.value as RecruitingRole)}
                    className="h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none"
                  >
                    {viewerRoles.map((role) => (
                      <option key={role} value={role} className="bg-slate-900 text-white">
                        {role.toUpperCase()} view
                      </option>
                    ))}
                  </select>
                </>
              ) : null}
              <Button
                type="button"
                variant="outline"
                className="h-11 border-white/10 bg-white/5 text-white hover:bg-white/10"
                onClick={handleRefresh}
                disabled={loading || submittingFeedback}
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
                Refresh
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-white/65 hover:text-white">
                <LogOut className="mr-2 h-4 w-4" />
                Reset local view
              </Button>
            </div>
          </div>

          {!isApplicantsView && !isDatabaseView ? (
            <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                <Link
                  to="/tech/manage/applicants"
                  className="group rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(17,25,40,0.98),rgba(8,13,22,0.99))] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.34)] transition-all hover:-translate-y-1 hover:border-cyan-300/35 hover:bg-[linear-gradient(180deg,rgba(19,34,55,0.98),rgba(8,13,22,0.99))]"
                >
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-400/10 text-cyan-100">
                    <ClipboardList className="h-6 w-6" />
                  </span>
                  <h2 className="mt-6 text-2xl font-semibold text-white">Applicants</h2>
                  <p className="mt-3 text-sm leading-6 text-white/55">
                    Open applicant review, search the pipeline, read resumes, and inspect persisted evaluations tied to each candidate.
                  </p>
                  <p className="mt-6 text-sm font-medium text-cyan-100">Open applicant workspace</p>
                </Link>

                <Link
                  to="/tech/assignments"
                  className="group rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(17,25,40,0.98),rgba(8,13,22,0.99))] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.34)] transition-all hover:-translate-y-1 hover:border-cyan-300/35 hover:bg-[linear-gradient(180deg,rgba(19,34,55,0.98),rgba(8,13,22,0.99))]"
                >
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-400/10 text-cyan-100">
                    <CalendarPlus2 className="h-6 w-6" />
                  </span>
                  <h2 className="mt-6 text-2xl font-semibold text-white">Assignments</h2>
                  <p className="mt-3 text-sm leading-6 text-white/55">
                    Manually assign primary and secondary interviewers for active rounds using the shared recruiting workflow state.
                  </p>
                  <p className="mt-6 text-sm font-medium text-cyan-100">Open assignment workspace</p>
                </Link>

                <Link
                  to="/tech/manage/database"
                  className="group rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(17,25,40,0.98),rgba(8,13,22,0.99))] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.34)] transition-all hover:-translate-y-1 hover:border-cyan-300/35 hover:bg-[linear-gradient(180deg,rgba(19,34,55,0.98),rgba(8,13,22,0.99))]"
                >
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-400/10 text-cyan-100">
                    <Database className="h-6 w-6" />
                  </span>
                  <h2 className="mt-6 text-2xl font-semibold text-white">Database</h2>
                  <p className="mt-3 text-sm leading-6 text-white/55">
                    Inspect row counts and preview live tables like applications, evaluations, attempts, and submissions.
                  </p>
                  <p className="mt-6 text-sm font-medium text-cyan-100">Open database view</p>
                </Link>
              </div>

              <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(17,25,40,0.98),rgba(8,13,22,0.99))] shadow-[0_24px_60px_rgba(0,0,0,0.34)]">
                <CardHeader>
                  <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/70">Snapshot</p>
                  <CardTitle className="text-xl text-white">Current review state</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                    <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-white/45">Applicants</p>
                      <p className="mt-3 text-3xl font-semibold text-white">{applications.length}</p>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-white/45">Feedback</p>
                      <p className="mt-3 text-3xl font-semibold text-white">{totalFeedbackCount}</p>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-white/45">Persistence</p>
                      <p className="mt-3 text-lg font-semibold text-white">Shared local state</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
                    <p className="text-sm font-medium text-white">Recent feedback</p>
                    {recentFeedback.length === 0 ? (
                      <p className="mt-3 text-sm text-white/50">No feedback has been saved yet.</p>
                    ) : (
                      <div className="mt-3 space-y-3">
                        {recentFeedback.map((entry) => (
                          <div key={entry.id} className="rounded-2xl border border-white/8 bg-white/[0.04] p-3">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-medium text-white">{entry.intervieweeName || entry.applicantName}</p>
                                <p className="text-xs text-white/45">{entry.interviewerName}</p>
                              </div>
                              <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-cyan-100">
                                {entry.recommendation}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : null}

          {isApplicantsView ? (
            loading && applications.length === 0 ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="h-8 w-8 animate-spin text-white/50" />
              </div>
            ) : (
              <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_380px]">
                <div className="order-2 xl:order-1">
                  {selectedApplicant ? (
                    (() => {
                      const selectedRound = getSelectedRound(selectedApplicant.id);
                      const roundEntries = getEntriesForRound(selectedApplicant.id, selectedRound);
                      const roundVoteCounts = getVoteCounts(roundEntries);

                      return (
                        <ApplicantDetail
                          applicant={selectedApplicant}
                          feedbackEntries={roundEntries}
                          yesCount={roundVoteCounts.yes}
                          noCount={roundVoteCounts.no}
                          maybeCount={roundVoteCounts.maybe}
                          overallStatus={getOverallStatus(selectedApplicant, roundEntries)}
                          averageScore={getAverageScore(roundEntries)}
                          comparisonAverage={overallApplicantAverageScore}
                          selectedRound={selectedRound}
                          availableRounds={getAvailableRounds(selectedApplicant.id)}
                          onSelectRound={(round) =>
                            setSelectedRoundsByApplicant((current) => ({
                              ...current,
                              [selectedApplicant.id]: round,
                            }))
                          }
                          onOpenResume={handleOpenResume}
                          viewerRole={viewerRole}
                          canManageDecisions={isDecisionMaker(viewerRole)}
                          onOpenDecisionConfirmation={(action, applicant) => setPendingDecision({ action, applicant })}
                        />
                      );
                    })()
                  ) : (
                    <Card className="border-white/10 bg-white/[0.03]">
                      <CardContent className="p-10 text-center text-white/55">
                        No applicant selected.
                      </CardContent>
                    </Card>
                  )}
                </div>

                <div className="order-1 min-h-[720px] xl:order-2">
                  <ConsultantList
                    applicants={filteredApplicants}
                    selectedApplicantId={selectedApplicantId}
                    searchValue={searchValue}
                    onSearchChange={setSearchValue}
                    rounds={interviewRounds}
                    activeRound={listRound}
                    onRoundChange={setListRound}
                    onSelectApplicant={setSelectedApplicantId}
                    getStatusLabel={statusForApplicant}
                    getAverageScore={scoreForApplicant}
                    overallAverageScore={overallApplicantAverageScore}
                  />
                </div>
              </div>
            )
          ) : null}

          {isDatabaseView ? (
            <DatabaseView
              overview={databaseOverview}
              preview={databasePreview}
              selectedTable={selectedDatabaseTable}
              loading={false}
              error={null}
              applicants={applications}
              feedbackByApplicant={feedbackByApplicant}
              onSelectTable={setSelectedDatabaseTable}
              onRefresh={handleRefresh}
            />
          ) : null}
        </div>
      </section>
      {pendingDecision ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 px-4">
          <Card className="w-full max-w-lg border-white/10 bg-[linear-gradient(180deg,rgba(17,25,40,0.99),rgba(8,13,22,1))] shadow-[0_28px_80px_rgba(0,0,0,0.42)]">
            <CardHeader>
              <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/70">Confirm decision</p>
              <CardTitle className="text-2xl text-white">Commit recruiting update?</CardTitle>
              <p className="text-sm leading-6 text-white/60">
                This writes the applicant status into the shared recruiting foundation for <span className="font-medium text-white">{pendingDecision.applicant.name}</span>.
                Existing evaluations and the shared local database preview stay aligned automatically.
              </p>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/70">
                You are about to {recruitingDecisionLabels[pendingDecision.action]}.
              </div>
              <div className="flex flex-wrap justify-end gap-3">
                <Button type="button" variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => setPendingDecision(null)}>
                  Cancel
                </Button>
                <Button type="button" onClick={handleConfirmDecision}>
                  Confirm decision
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
      <Footer />
    </div>
  );
};

export default DevopsManage;
