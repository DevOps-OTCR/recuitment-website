import { useEffect, useMemo, useState } from 'react';
import {
  ClipboardList,
  Database,
  FilePenLine,
  LayoutGrid,
  Loader2,
  Lock,
  LogOut,
  RefreshCcw,
} from 'lucide-react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';

import Footer from '@/components/Footer';
import Navigation from '@/components/Navigation';
import { adminApi, type AdminApplicationResponse, type AdminEvaluationResponse, type AdminEvaluationPayload } from '@/lib/admin-api';
import { getOaApiUrl } from '@/lib/oa-api-url';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import ApplicantDetail from '@/pages/devops/components/admin/ApplicantDetail';
import ConsultantList from '@/pages/devops/components/admin/ConsultantList';
import DatabaseView from '@/pages/devops/components/admin/DatabaseView';
import FeedbackForm from '@/pages/devops/components/admin/FeedbackForm';
import { mockApplicants, mockFeedback } from '@/pages/devops/components/admin/mockData';
import {
  feedbackMetricFields,
  normalizeRatingBand,
  type ApplicantRecord,
  type DatabaseOverview,
  type DatabaseTableName,
  type DatabaseTablePreview,
  type FeedbackEntry,
} from '@/pages/devops/components/admin/types';
import otcrTechLogo from '@/assets/otcr-technologies-white-nomargins.webp';

const API_BASE_URL = getOaApiUrl();
const ADMIN_KEY_STORAGE = 'otcr_devops_admin_secret';

const defaultExecRoster = ['Ava Patel', 'Mihika Rao', 'Isaiah Brooks', 'Laksh Shah'];
const nameKey = (value: string) => value.trim().replace(/\s+/g, ' ').toLowerCase();

const deriveAssignedExec = (applicant: ApplicantRecord) =>
  applicant.assigned_exec ??
  applicant.notes?.match(/assigned[:\s]+([a-zA-Z\s]+)/i)?.[1]?.trim() ??
  defaultExecRoster[applicant.id % defaultExecRoster.length];

const normalizeErrorMessage = (error: unknown, fallback: string) => {
  if (!(error instanceof Error)) return fallback;
  const detail = error.message.replace(/^API Error \d+:\s*/i, '').trim();
  return detail || fallback;
};

const mapApplication = (application: AdminApplicationResponse): ApplicantRecord => {
  const mapped: ApplicantRecord = {
    id: application.id,
    name: application.name,
    email: application.email,
    interest: application.interest,
    resume_filename: application.resume_filename,
    resume_url: application.resume_url ?? null,
    status: application.status,
    final_decision: application.final_decision,
    cycle_name: application.cycle_name,
    created_at: application.created_at,
    reviewed_at: application.reviewed_at,
    notes: application.notes,
    has_assessment_link: application.has_assessment_link,
    assessment_completed: application.assessment_completed,
    assessment_token: application.assessment_token,
    focus_loss_events: application.focus_loss_events,
    is_flagged: application.is_flagged,
    integrity_notes: application.integrity_notes,
    archived_at: application.archived_at,
    assigned_exec: null,
  };

  return {
    ...mapped,
    assigned_exec: deriveAssignedExec(mapped),
  };
};

const mapEvaluation = (evaluation: AdminEvaluationResponse): FeedbackEntry => ({
  id: String(evaluation.id),
  applicantId: evaluation.application_id,
  applicantName: evaluation.applicant_name,
  interviewerName: evaluation.interviewer_name,
  intervieweeName: evaluation.interviewee_name,
  intervieweeGender: evaluation.interviewee_gender,
  interviewerRole: evaluation.interviewer_role,
  leadershipScore: normalizeRatingBand(evaluation.leadership_score),
  interestInOtcrScore: normalizeRatingBand(evaluation.interest_in_otcr_score),
  behavioralPerformanceScore: normalizeRatingBand(evaluation.behavioral_performance_score),
  businessAcumenScore: normalizeRatingBand(evaluation.business_acumen_score),
  qualitativeCreativityScore: normalizeRatingBand(evaluation.qualitative_creativity_score),
  quantitativeStructureScore: normalizeRatingBand(evaluation.quantitative_structure_score),
  casePerformanceScore: normalizeRatingBand(evaluation.case_performance_score),
  creativityConversationScore: normalizeRatingBand(evaluation.creativity_conversation_score),
  recommendation: evaluation.recommendation,
  finalRoundSummary: evaluation.final_round_summary ?? '',
  overallPerformanceOverview: evaluation.overall_performance_overview ?? evaluation.comments ?? '',
  submittedAt: evaluation.created_at,
});

const mapDatabaseOverview = (overview: Awaited<ReturnType<typeof adminApi.getDatabaseOverview>>): DatabaseOverview => ({
  generatedAt: overview.generated_at,
  persistence: overview.persistence,
  tables: overview.tables,
});

const mapDatabasePreview = (preview: Awaited<ReturnType<typeof adminApi.getDatabaseTable>>): DatabaseTablePreview => ({
  table: preview.table,
  count: preview.count,
  columns: preview.columns,
  rows: preview.rows,
});

const fetchWorkspaceSnapshot = async (secret: string) => {
  const [applicationResponse, evaluationResponse] = await Promise.all([
    adminApi.listApplications(secret),
    adminApi.listEvaluations(secret),
  ]);

  return {
    applications: applicationResponse.map(mapApplication),
    evaluations: evaluationResponse.map(mapEvaluation),
  };
};

const groupFeedbackEntries = (entries: FeedbackEntry[]) =>
  entries.reduce<Record<number, FeedbackEntry[]>>((acc, entry) => {
    acc[entry.applicantId] = [entry, ...(acc[entry.applicantId] ?? [])];
    return acc;
  }, {});

const getVoteCounts = (entries: FeedbackEntry[]) =>
  entries.reduce(
    (acc, entry) => {
      if (entry.recommendation === 'YES' || entry.recommendation === 'LEAN YES') acc.yes += 1;
      if (entry.recommendation === 'NO' || entry.recommendation === 'LEAN NO') acc.no += 1;
      if (entry.recommendation === 'MAYBE') acc.maybe += 1;
      return acc;
    },
    { yes: 0, no: 0, maybe: 0 }
  );

const getAverageScore = (entries: FeedbackEntry[]) => {
  if (entries.length === 0) return null;

  const total = entries.reduce(
    (sum, entry) =>
      sum + feedbackMetricFields.reduce((entrySum, field) => entrySum + entry[field.key], 0),
    0
  );

  return total / (entries.length * feedbackMetricFields.length);
};

const getOverallStatus = (applicant: ApplicantRecord, entries: FeedbackEntry[]) => {
  const votes = getVoteCounts(entries);

  if (votes.no >= 2) return 'Rejected';
  if (applicant.status === 'approved') return 'Approved';
  if (applicant.status === 'rejected') return 'Rejected';
  if (applicant.final_decision && applicant.final_decision !== 'MAYBE') return applicant.final_decision;
  if (votes.yes > votes.no && votes.yes > 0) return 'YES';
  if (votes.maybe > 0) return 'Pending';
  return 'Pending';
};

const buildFallbackApplicants = () =>
  mockApplicants.map((applicant) => ({
    ...applicant,
    assigned_exec: deriveAssignedExec(applicant),
  }));

const initialFallbackApplicants = buildFallbackApplicants();

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

  const [adminSecret, setAdminSecret] = useState('');
  const [storedSecret, setStoredSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applications, setApplications] = useState<ApplicantRecord[]>(initialFallbackApplicants);
  const [selectedApplicantId, setSelectedApplicantId] = useState<number | null>(initialFallbackApplicants[0]?.id ?? null);
  const [searchValue, setSearchValue] = useState('');
  const [cycleFilter, setCycleFilter] = useState<'all' | string>('all');
  const [feedbackByApplicant, setFeedbackByApplicant] = useState<Record<number, FeedbackEntry[]>>(mockFeedback);
  const [usingMockData, setUsingMockData] = useState(true);
  const [databaseOverview, setDatabaseOverview] = useState<DatabaseOverview | null>(null);
  const [databasePreview, setDatabasePreview] = useState<DatabaseTablePreview | null>(null);
  const [databaseLoading, setDatabaseLoading] = useState(false);
  const [databaseError, setDatabaseError] = useState<string | null>(null);
  const [selectedDatabaseTable, setSelectedDatabaseTable] = useState<DatabaseTableName>('evaluations');

  const isApplicantsView = location.pathname === '/tech/manage/applicants';
  const isFeedbackView = location.pathname === '/tech/manage/feedback';
  const isDatabaseView = location.pathname === '/tech/manage/database';
  const requestedApplicantIdParam = searchParams.get('applicantId');
  const requestedApplicantId =
    requestedApplicantIdParam && Number.isFinite(Number(requestedApplicantIdParam))
      ? Number(requestedApplicantIdParam)
      : null;

  const headers = () => ({
    'X-Admin-Secret': storedSecret || '',
  });

  const fetchAdminWorkspace = async (secret: string) => {
    setLoading(true);
    setError(null);

    try {
      const { applications: mappedApplications, evaluations: mappedEvaluations } = await fetchWorkspaceSnapshot(secret);

      if (mappedApplications.length === 0) {
        const fallback = buildFallbackApplicants();
        setApplications(fallback);
        setFeedbackByApplicant(mockFeedback);
        setUsingMockData(true);
        setSelectedApplicantId((current) => current ?? fallback[0]?.id ?? null);
        setError('Backend is reachable but returned no applicants. Showing mock applicant data for the dashboard.');
        return;
      }

      setApplications(mappedApplications);
      setFeedbackByApplicant(groupFeedbackEntries(mappedEvaluations));
      setUsingMockData(false);
      setSelectedApplicantId((current) => current ?? mappedApplications[0]?.id ?? null);
    } catch (fetchError: unknown) {
      const fallback = buildFallbackApplicants();
      setApplications(fallback);
      setFeedbackByApplicant(mockFeedback);
      setUsingMockData(true);
      setSelectedApplicantId((current) => current ?? fallback[0]?.id ?? null);

      const message = normalizeErrorMessage(fetchError, 'Backend unavailable. Showing mock applicant data.');
      if (/invalid admin secret/i.test(message) || /invalid admin key/i.test(message)) {
        sessionStorage.removeItem(ADMIN_KEY_STORAGE);
        setStoredSecret(null);
        setApplications(initialFallbackApplicants);
        setFeedbackByApplicant(mockFeedback);
        setUsingMockData(true);
        setError('Invalid admin key. Please enter it again.');
        navigate('/tech/manage', { replace: true });
        return;
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const fetchDatabasePreview = async (secret: string, table: DatabaseTableName) => {
    setDatabaseLoading(true);
    setDatabaseError(null);

    try {
      const [overviewResponse, previewResponse] = await Promise.all([
        adminApi.getDatabaseOverview(secret),
        adminApi.getDatabaseTable(secret, table),
      ]);

      setDatabaseOverview(mapDatabaseOverview(overviewResponse));
      setDatabasePreview(mapDatabasePreview(previewResponse));
    } catch (previewError: unknown) {
      setDatabaseError(normalizeErrorMessage(previewError, 'Failed to load database preview.'));
    } finally {
      setDatabaseLoading(false);
    }
  };

  useEffect(() => {
    const key = sessionStorage.getItem(ADMIN_KEY_STORAGE);
    if (key) setStoredSecret(key);
  }, []);

  useEffect(() => {
    if (!storedSecret) return;
    void fetchAdminWorkspace(storedSecret);
  }, [storedSecret]);

  useEffect(() => {
    if (!storedSecret || !isDatabaseView) return;
    void fetchDatabasePreview(storedSecret, selectedDatabaseTable);
  }, [storedSecret, isDatabaseView, selectedDatabaseTable]);

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
  const requestedFeedbackApplicant =
    requestedApplicantId !== null ? applications.find((applicant) => applicant.id === requestedApplicantId) ?? null : null;

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

  const handleUnlock = (event: React.FormEvent) => {
    event.preventDefault();
    if (!adminSecret.trim()) return;
    sessionStorage.setItem(ADMIN_KEY_STORAGE, adminSecret.trim());
    setStoredSecret(adminSecret.trim());
    setAdminSecret('');
  };

  const handleLogout = () => {
    sessionStorage.removeItem(ADMIN_KEY_STORAGE);
    setStoredSecret(null);
    setApplications(initialFallbackApplicants);
    setFeedbackByApplicant(mockFeedback);
    setUsingMockData(true);
    setDatabaseOverview(null);
    setDatabasePreview(null);
    setSelectedApplicantId(initialFallbackApplicants[0]?.id ?? null);
    navigate('/tech/manage', { replace: true });
  };

  const handleOpenResume = async (applicant: ApplicantRecord) => {
    if (applicant.resume_url) {
      window.open(applicant.resume_url, '_blank', 'noopener,noreferrer');
      return;
    }

    if (!storedSecret || usingMockData) {
      toast({
        title: 'Resume unavailable',
        description: 'This applicant is using fallback data, so there is no backend resume stream.',
      });
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/applications/${applicant.id}/resume`, { headers: headers() });
      if (!response.ok) throw new Error('Could not open resume');
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      window.open(objectUrl, '_blank', 'noopener,noreferrer');
    } catch {
      toast({
        title: 'Resume unavailable',
        description: 'The backend did not return a resume for this applicant.',
        variant: 'destructive',
      });
    }
  };

  const handleOpenFeedbackForm = (applicant: ApplicantRecord) => {
    navigate(`/tech/manage/feedback?applicantId=${applicant.id}`);
  };

  const handleSubmitFeedback = async (entry: Omit<FeedbackEntry, 'id' | 'submittedAt'>) => {
    if (!storedSecret) return;

    setSubmittingFeedback(true);

    try {
      let targetApplicantId = entry.applicantId;

      if (usingMockData) {
        const { applications: liveApplications, evaluations: liveEvaluations } = await fetchWorkspaceSnapshot(storedSecret);

        if (liveApplications.length === 0) {
          throw new Error('Backend is reachable but returned no applicants, so feedback could not be attached.');
        }

        const liveApplicant =
          liveApplications.find((applicant) => nameKey(applicant.name) === nameKey(entry.intervieweeName)) ??
          liveApplications.find((applicant) => applicant.id === entry.applicantId) ??
          null;

        if (!liveApplicant) {
          throw new Error('Could not match this interviewee to a live applicant record. Refresh the dashboard and try again.');
        }

        setApplications(liveApplications);
        setFeedbackByApplicant(groupFeedbackEntries(liveEvaluations));
        setUsingMockData(false);
        setError(null);
        setSelectedApplicantId(liveApplicant.id);
        targetApplicantId = liveApplicant.id;

        if (requestedApplicantId !== liveApplicant.id) {
          navigate(`/tech/manage/feedback?applicantId=${liveApplicant.id}`, { replace: true });
        }
      }

      const payload: AdminEvaluationPayload = {
        interviewer_name: entry.interviewerName,
        interviewee_name: entry.intervieweeName,
        interviewee_gender: entry.intervieweeGender,
        interviewer_role: entry.interviewerRole,
        leadership_score: entry.leadershipScore,
        interest_in_otcr_score: entry.interestInOtcrScore,
        behavioral_performance_score: entry.behavioralPerformanceScore,
        business_acumen_score: entry.businessAcumenScore,
        qualitative_creativity_score: entry.qualitativeCreativityScore,
        quantitative_structure_score: entry.quantitativeStructureScore,
        case_performance_score: entry.casePerformanceScore,
        creativity_conversation_score: entry.creativityConversationScore,
        recommendation: entry.recommendation,
        final_round_summary: entry.finalRoundSummary,
        overall_performance_overview: entry.overallPerformanceOverview,
      };

      const createdEvaluation = await adminApi.createEvaluation(storedSecret, targetApplicantId, payload);
      const mappedEntry = mapEvaluation(createdEvaluation);

      setFeedbackByApplicant((current) => ({
        ...current,
        [mappedEntry.applicantId]: [mappedEntry, ...(current[mappedEntry.applicantId] ?? [])],
      }));

      if (isDatabaseView) {
        void fetchDatabasePreview(storedSecret, selectedDatabaseTable);
      }

      toast({
        title: 'Feedback saved',
        description: `${entry.intervieweeName} now has a persisted review in the backend database.`,
      });
    } catch (submitError: unknown) {
      toast({
        title: 'Could not save feedback',
        description: normalizeErrorMessage(submitError, 'The backend rejected the evaluation payload.'),
        variant: 'destructive',
      });
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleRefresh = () => {
    if (!storedSecret) return;
    if (isDatabaseView) {
      void fetchDatabasePreview(storedSecret, selectedDatabaseTable);
      return;
    }
    void fetchAdminWorkspace(storedSecret);
  };

  const voteCountsForApplicant = (applicantId: number) => getVoteCounts(feedbackByApplicant[applicantId] ?? []);
  const statusForApplicant = (applicant: ApplicantRecord) => getOverallStatus(applicant, feedbackByApplicant[applicant.id] ?? []);

  if (!storedSecret) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <section className="px-4 pb-24 pt-32">
          <div className="mx-auto max-w-md">
            <div className="mb-8 flex justify-center">
              <img src={otcrTechLogo} alt="OTCR Technologies" className="h-16 w-auto" />
            </div>
            <Card className="border-white/10 bg-card/80">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Lock className="h-5 w-5" />
                  Admin access
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Enter the admin key to open the consultant review dashboard.
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUnlock} className="space-y-4">
                  <div>
                    <Label htmlFor="admin-key" className="text-muted-foreground">Admin key</Label>
                    <Input
                      id="admin-key"
                      type="password"
                      value={adminSecret}
                      onChange={(event) => setAdminSecret(event.target.value)}
                      placeholder="Admin secret"
                      className="mt-2 bg-background/50"
                      autoComplete="current-password"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={!adminSecret.trim()}>
                    Unlock dashboard
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </section>
        <Footer />
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
            <Button asChild variant="outline" className={adminViewButtonClass(!isApplicantsView && !isFeedbackView && !isDatabaseView)}>
              <Link to="/tech/manage">
                <LayoutGrid className="h-4 w-4" />
                Dashboard
              </Link>
            </Button>
            <Button asChild variant="outline" className={adminViewButtonClass(isApplicantsView)}>
              <Link to="/tech/manage/applicants">
                <ClipboardList className="h-4 w-4" />
                Applicants
              </Link>
            </Button>
            <Button asChild variant="outline" className={adminViewButtonClass(isFeedbackView)}>
              <Link to="/tech/manage/feedback">
                <FilePenLine className="h-4 w-4" />
                Feedback Form
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
                  {!isApplicantsView && !isFeedbackView && !isDatabaseView
                    ? 'Consultant review dashboard'
                    : isApplicantsView
                      ? 'Applicants'
                      : isFeedbackView
                        ? 'Feedback form'
                        : 'Database'}
                </h1>
              </div>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-white/60">
                {!isApplicantsView && !isFeedbackView && !isDatabaseView
                  ? 'Choose between applicant review, the standalone interviewer form, and a live database preview powered by the backend.'
                  : isApplicantsView
                    ? 'This is the applicant review workspace, now backed by persisted interviewer evaluations from the API.'
                    : isFeedbackView
                      ? 'Submit the consultant interview rubric and store it directly in the backend database.'
                      : 'Inspect the live backend tables, row counts, and recent records without leaving the admin dashboard.'}
              </p>
              <p className="mt-2 text-xs uppercase tracking-[0.24em] text-white/40">
                Visible under <span className="text-white/70">/tech/manage</span> and legacy redirects under <span className="text-white/70">/devops/manage</span>
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
                disabled={loading || databaseLoading || submittingFeedback}
              >
                {loading || databaseLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
                Refresh
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-white/65 hover:text-white">
                <LogOut className="mr-2 h-4 w-4" />
                Lock
              </Button>
            </div>
          </div>

          {error ? (
            <div className="mb-5 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              {error}
            </div>
          ) : null}

          {usingMockData ? (
            <div className="mb-5 rounded-2xl border border-sky-400/20 bg-sky-500/10 px-4 py-3 text-sm text-sky-100">
              Backend data was unavailable, so the dashboard is showing mock applicant records and seeded feedback state.
            </div>
          ) : null}

          {!isApplicantsView && !isFeedbackView && !isDatabaseView ? (
            <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
              <div className="grid gap-6 md:grid-cols-3">
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
                  to="/tech/manage/feedback"
                  className="group rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(17,25,40,0.98),rgba(8,13,22,0.99))] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.34)] transition-all hover:-translate-y-1 hover:border-cyan-300/35 hover:bg-[linear-gradient(180deg,rgba(19,34,55,0.98),rgba(8,13,22,0.99))]"
                >
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-400/10 text-cyan-100">
                    <FilePenLine className="h-6 w-6" />
                  </span>
                  <h2 className="mt-6 text-2xl font-semibold text-white">Feedback Form</h2>
                  <p className="mt-3 text-sm leading-6 text-white/55">
                    Submit interview feedback directly into the backend `evaluations` table using the exact applicant name.
                  </p>
                  <p className="mt-6 text-sm font-medium text-cyan-100">Open feedback form</p>
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
                      <p className="mt-3 text-lg font-semibold text-white">
                        {usingMockData ? 'Mock data' : 'Backend connected'}
                      </p>
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
                    <ApplicantDetail
                      applicant={selectedApplicant}
                      feedbackEntries={feedbackByApplicant[selectedApplicant.id] ?? []}
                      yesCount={voteCountsForApplicant(selectedApplicant.id).yes}
                      noCount={voteCountsForApplicant(selectedApplicant.id).no}
                      maybeCount={voteCountsForApplicant(selectedApplicant.id).maybe}
                      overallStatus={statusForApplicant(selectedApplicant)}
                      averageScore={getAverageScore(feedbackByApplicant[selectedApplicant.id] ?? [])}
                      onOpenResume={handleOpenResume}
                      onOpenFeedbackForm={handleOpenFeedbackForm}
                    />
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
                    onSelectApplicant={setSelectedApplicantId}
                    getStatusLabel={statusForApplicant}
                    getVoteCounts={voteCountsForApplicant}
                  />
                </div>
              </div>
            )
          ) : null}

          {isFeedbackView ? (
            loading && applications.length === 0 ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="h-8 w-8 animate-spin text-white/50" />
              </div>
            ) : (
              <div className="mx-auto w-full max-w-[1240px]">
                <div>
                  <FeedbackForm
                    applicants={applications}
                    initialApplicantId={requestedFeedbackApplicant?.id ?? null}
                    onSubmitFeedback={handleSubmitFeedback}
                    submitting={submittingFeedback}
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
              loading={databaseLoading}
              error={databaseError}
              onSelectTable={setSelectedDatabaseTable}
              onRefresh={() => {
                if (!storedSecret) return;
                void fetchDatabasePreview(storedSecret, selectedDatabaseTable);
              }}
            />
          ) : null}
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default DevopsManage;
