import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { useAuth } from '@/context/AuthContext';
import type { RecruitingDecisionAction, RecruitingRole } from '@/features/recruiting';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  adminApi,
  type AdminApplicationResponse,
  type AdminEvaluationResponse,
} from '@/lib/admin-api';
import ApplicantDetail from '@/pages/devops/components/admin/ApplicantDetail';
import ConsultantList from '@/pages/devops/components/admin/ConsultantList';
import DatabaseView from '@/pages/devops/components/admin/DatabaseView';
import {
  feedbackMetricFields,
  type ApplicantRecord,
  type DatabaseOverview,
  type DatabaseTableName,
  type DatabaseTablePreview,
  type FeedbackEntry,
  type InterviewRound,
} from '@/pages/devops/components/admin/types';
import {
  hasBackendPermission,
  mapApplicationToApplicantRecord,
  mapEvaluationToFeedbackEntry,
  roleToViewerRole,
} from '@/pages/devops/recruiting-backend';
import otcrTechLogo from '@/assets/otcr-technologies-white-nomargins.webp';

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

const getOverallStatus = (_applicant: ApplicantRecord, entries: FeedbackEntry[]) => {
  const votes = getVoteCounts(entries);

  if (votes.yes >= 2) return 'YES';
  if (votes.no >= 2) return 'NO';
  if (entries.length === 0) return 'Pending';
  if (votes.yes > votes.no && votes.yes > 0) return 'YES';
  if (votes.no > votes.yes && votes.no > 0) return 'NO';
  if (votes.maybe > 0) return 'Pending';
  return 'Pending';
};

const adminViewButtonClass = (active: boolean) =>
  [
    'h-11 rounded-xl border transition-all',
    active
      ? 'border-cyan-300/50 bg-cyan-400/10 text-white hover:bg-cyan-400/15'
      : 'border-white/10 bg-white/5 text-white/75 hover:bg-white/10 hover:text-white',
  ].join(' ');

const recruitingDecisionLabels: Record<RecruitingDecisionAction, string> = {
  reject_after_application_review: 'reject this applicant after application review',
  advance_to_round_1: 'advance this applicant to Round 1',
  reject_after_round_1: 'reject this applicant after Round 1',
  advance_to_round_2: 'advance this applicant to Round 2',
  reject_after_round_2: 'reject this applicant after Round 2',
  accept_final: 'mark this applicant as accepted',
};

const mapDatabaseOverview = (
  overview: Awaited<ReturnType<typeof adminApi.getDatabaseOverview>>
): DatabaseOverview => ({
  generatedAt: overview.generated_at,
  persistence: overview.persistence,
  tables: overview.tables,
});

const mapDatabasePreview = (
  preview: Awaited<ReturnType<typeof adminApi.getDatabaseTable>>
): DatabaseTablePreview => ({
  table: preview.table,
  count: preview.count,
  columns: preview.columns,
  rows: preview.rows,
});

const DevopsManage = () => {
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isLoading: authLoading, signOut } = useAuth();

  const [loading, setLoading] = useState(false);
  const [databaseLoading, setDatabaseLoading] = useState(false);
  const [applications, setApplications] = useState<ApplicantRecord[]>([]);
  const [selectedApplicantId, setSelectedApplicantId] = useState<number | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [cycleFilter, setCycleFilter] = useState<'all' | string>('all');
  const [feedbackByApplicant, setFeedbackByApplicant] = useState<Record<number, FeedbackEntry[]>>({});
  const [databaseOverview, setDatabaseOverview] = useState<DatabaseOverview | null>(null);
  const [databasePreview, setDatabasePreview] = useState<DatabaseTablePreview | null>(null);
  const [databaseError, setDatabaseError] = useState<string | null>(null);
  const [selectedDatabaseTable, setSelectedDatabaseTable] = useState<DatabaseTableName>('evaluations');
  const [selectedRoundsByApplicant, setSelectedRoundsByApplicant] = useState<Record<number, InterviewRound>>({});
  const [listRound, setListRound] = useState<InterviewRound>('Round 1');
  const [pendingDecision, setPendingDecision] = useState<{ applicant: ApplicantRecord; action: RecruitingDecisionAction } | null>(null);

  const isApplicantsView = location.pathname === '/tech/manage/applicants';
  const isDatabaseView = location.pathname === '/tech/manage/database';
  const requestedApplicantIdParam = searchParams.get('applicantId');
  const requestedApplicantId =
    requestedApplicantIdParam && Number.isFinite(Number(requestedApplicantIdParam))
      ? Number(requestedApplicantIdParam)
      : null;

  const viewerRole = useMemo(
    () => roleToViewerRole(user?.role) as RecruitingRole,
    [user?.role]
  );
  const canManageDecisions =
    hasBackendPermission(user, 'decide_round_1') || hasBackendPermission(user, 'decide_round_2');
  const canSeeRelativeScore = hasBackendPermission(user, 'see_relative_score');
  const canSeeDatabase = hasBackendPermission(user, 'see_database');

  const loadApplicantWorkspace = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const applicationsResponse = await adminApi.listApplications();
      const evaluationResponses: AdminEvaluationResponse[] = canSeeRelativeScore ? await adminApi.listEvaluations() : [];

      const nextApplications = applicationsResponse.map(mapApplicationToApplicantRecord);
      const nextFeedbackEntries = evaluationResponses.map(mapEvaluationToFeedbackEntry);

      setApplications(nextApplications);
      setFeedbackByApplicant(groupFeedbackEntries(nextFeedbackEntries));
      setDatabaseError(null);
      if (nextApplications.length > 0) {
        setSelectedApplicantId((current) =>
          current && nextApplications.some((applicant) => applicant.id === current) ? current : nextApplications[0].id
        );
      } else {
        setSelectedApplicantId(null);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load the recruiting workspace.';
      if (!message.includes('Missing bearer token')) {
        toast({
          title: 'Could not load recruiting workspace',
          description: message,
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  }, [canSeeRelativeScore, toast, user]);

  const loadDatabasePreview = useCallback(async () => {
    if (!user || !canSeeDatabase) return;

    setDatabaseLoading(true);
    setDatabaseError(null);
    try {
      const [overviewResponse, previewResponse] = await Promise.all([
        adminApi.getDatabaseOverview(),
        adminApi.getDatabaseTable(selectedDatabaseTable),
      ]);
      setDatabaseOverview(mapDatabaseOverview(overviewResponse));
      setDatabasePreview(mapDatabasePreview(previewResponse));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load database preview.';
      setDatabaseError(message);
      toast({
        title: 'Could not load database preview',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setDatabaseLoading(false);
    }
  }, [canSeeDatabase, selectedDatabaseTable, toast, user]);

  useEffect(() => {
    if (authLoading || !user) return;
    void loadApplicantWorkspace();
  }, [authLoading, loadApplicantWorkspace, user]);

  useEffect(() => {
    if (!isDatabaseView || authLoading || !user || !canSeeDatabase) return;
    void loadDatabasePreview();
  }, [authLoading, canSeeDatabase, isDatabaseView, loadDatabasePreview, user]);

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

  const handleOpenResume = async (applicant: ApplicantRecord) => {
    if (applicant.resume_url) {
      window.open(applicant.resume_url, '_blank', 'noopener,noreferrer');
      return;
    }

    try {
      const response = await adminApi.getResume(applicant.id);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      window.setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
    } catch (error) {
      toast({
        title: 'Could not open resume',
        description: error instanceof Error ? error.message : 'Resume download failed.',
        variant: 'destructive',
      });
    }
  };

  const handleRefresh = () => {
    if (isDatabaseView) {
      void loadDatabasePreview();
      return;
    }
    void loadApplicantWorkspace();
  };

  const handleConfirmDecision = async () => {
    if (!pendingDecision) return;

    try {
      const updatedApplication = await adminApi.applyDecision(pendingDecision.applicant.id, {
        action: pendingDecision.action,
      });
      const mappedApplicant = mapApplicationToApplicantRecord(updatedApplication);

      setApplications((current) =>
        current.map((applicant) => (applicant.id === mappedApplicant.id ? mappedApplicant : applicant))
      );
      setPendingDecision(null);
      toast({
        title: 'Decision saved',
        description: `${pendingDecision.applicant.name} was updated and persisted to the backend.`,
      });
    } catch (error) {
      toast({
        title: 'Could not save decision',
        description: error instanceof Error ? error.message : 'The backend rejected this recruiting decision.',
        variant: 'destructive',
      });
    }
  };

  const voteCountsForApplicant = (applicantId: number) => getVoteCounts(getEntriesForRound(applicantId, listRound));
  const statusForApplicant = (applicant: ApplicantRecord) => applicant.status.replace(/_/g, ' ');
  const scoreForApplicant = (applicantId: number) =>
    canSeeRelativeScore ? getAverageScore(getEntriesForRound(applicantId, listRound)) : null;
  const overallApplicantAverageScore = useMemo(() => {
    if (!canSeeRelativeScore) return null;
    const scores = filteredApplicants
      .map((applicant) => scoreForApplicant(applicant.id))
      .filter((score): score is number => score !== null);

    if (scores.length === 0) return null;
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }, [canSeeRelativeScore, feedbackByApplicant, filteredApplicants, listRound]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-white">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

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
                  ? 'Choose between applicant review, assignments, and a live backend database preview.'
                  : isApplicantsView
                    ? 'This applicant review workspace is now backed by the FastAPI API and persisted backend state.'
                    : 'Inspect live backend tables, row counts, and recent records without leaving the admin dashboard.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {isApplicantsView ? (
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
              ) : null}
              <Button
                type="button"
                variant="outline"
                className="h-11 border-white/10 bg-white/5 text-white hover:bg-white/10"
                onClick={handleRefresh}
                disabled={loading || databaseLoading}
              >
                {loading || databaseLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCcw className="mr-2 h-4 w-4" />
                )}
                Refresh
              </Button>
              <Button variant="ghost" size="sm" onClick={() => void signOut()} className="text-white/65 hover:text-white">
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
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
                    Persist primary and secondary interviewer assignments directly to the FastAPI backend.
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
                    Inspect row counts and preview live tables like applications, evaluations, assignments, attempts, and submissions.
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
                      <p className="mt-3 text-lg font-semibold text-white">FastAPI backend</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
                    <p className="text-sm font-medium text-white">Recent feedback</p>
                    {recentFeedback.length === 0 ? (
                      <p className="mt-3 text-sm text-white/50">
                        {canSeeRelativeScore ? 'No feedback has been saved yet.' : 'Relative feedback visibility is restricted for your role.'}
                      </p>
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
                          averageScore={canSeeRelativeScore ? getAverageScore(roundEntries) : null}
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
                          canManageDecisions={canManageDecisions}
                          onOpenDecisionConfirmation={(action, applicant) => setPendingDecision({ action, applicant })}
                        />
                      );
                    })()
                  ) : (
                    <Card className="border-white/10 bg-white/[0.03]">
                      <CardContent className="p-10 text-center text-white/55">No applicant selected.</CardContent>
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
            canSeeDatabase ? (
              <DatabaseView
                overview={databaseOverview}
                preview={databasePreview}
                selectedTable={selectedDatabaseTable}
                loading={databaseLoading}
                error={databaseError}
                applicants={applications}
                feedbackByApplicant={feedbackByApplicant}
                onSelectTable={setSelectedDatabaseTable}
                onRefresh={handleRefresh}
              />
            ) : (
              <Card className="border-white/10 bg-white/[0.03]">
                <CardContent className="p-10 text-center text-white/55">
                  Your role does not include backend database visibility.
                </CardContent>
              </Card>
            )
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
                This writes the applicant status into the backend record for <span className="font-medium text-white">{pendingDecision.applicant.name}</span>.
              </p>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/70">
                You are about to {recruitingDecisionLabels[pendingDecision.action]}.
              </div>
              <div className="flex flex-wrap justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                  onClick={() => setPendingDecision(null)}
                >
                  Cancel
                </Button>
                <Button type="button" onClick={() => void handleConfirmDecision()}>
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
