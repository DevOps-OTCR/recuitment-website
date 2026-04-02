import { useEffect, useMemo, useState } from 'react';
import {
  ClipboardList,
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
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { getOaApiUrl } from '@/lib/oa-api-url';
import { cn } from '@/lib/utils';
import ApplicantDetail from '@/pages/devops/components/admin/ApplicantDetail';
import ConsultantList from '@/pages/devops/components/admin/ConsultantList';
import FeedbackForm from '@/pages/devops/components/admin/FeedbackForm';
import { mockApplicants, mockFeedback } from '@/pages/devops/components/admin/mockData';
import {
  feedbackMetricFields,
  type ApplicantRecord,
  type DecisionValue,
  type FeedbackEntry,
  type RatingBand,
} from '@/pages/devops/components/admin/types';
import otcrTechLogo from '@/assets/otcr-technologies-white-nomargins.webp';

const API_BASE_URL = getOaApiUrl();
const ADMIN_KEY_STORAGE = 'otcr_devops_admin_secret';
const FEEDBACK_STORAGE = 'otcr_recruitment_feedback_v2';

const defaultExecRoster = ['Ava Patel', 'Mihika Rao', 'Isaiah Brooks', 'Laksh Shah'];

const nameKey = (value: string) => value.trim().replace(/\s+/g, ' ').toLowerCase();

const deriveAssignedExec = (applicant: ApplicantRecord) =>
  applicant.assigned_exec ??
  applicant.notes?.match(/assigned[:\s]+([a-zA-Z\s]+)/i)?.[1]?.trim() ??
  defaultExecRoster[applicant.id % defaultExecRoster.length];

const isDecisionValue = (value: unknown): value is DecisionValue =>
  value === 'YES' || value === 'LEAN YES' || value === 'MAYBE' || value === 'LEAN NO' || value === 'NO';

const normalizeRatingBand = (value: unknown): RatingBand => {
  const numericValue = Number(value);
  if (numericValue >= 1 && numericValue <= 5) return numericValue as RatingBand;
  return 3;
};

const normalizeFeedbackEntry = (raw: unknown, applicantId: number): FeedbackEntry | null => {
  if (!raw || typeof raw !== 'object') return null;
  const entry = raw as Record<string, unknown>;

  if ('leadershipScore' in entry && 'overallPerformanceOverview' in entry) {
    const applicantName =
      typeof entry.applicantName === 'string'
        ? entry.applicantName
        : typeof entry.intervieweeName === 'string'
          ? entry.intervieweeName
          : '';

    return {
      id: typeof entry.id === 'string' ? entry.id : `${applicantId}-${Date.now()}`,
      applicantId,
      applicantName,
      interviewerName: typeof entry.interviewerName === 'string' ? entry.interviewerName : 'Anonymous reviewer',
      intervieweeName: typeof entry.intervieweeName === 'string' ? entry.intervieweeName : applicantName,
      intervieweeGender:
        entry.intervieweeGender === 'Male' || entry.intervieweeGender === 'Female' || entry.intervieweeGender === 'Other'
          ? entry.intervieweeGender
          : 'Other',
      interviewerRole: entry.interviewerRole === 'Primary' || entry.interviewerRole === 'Secondary' ? entry.interviewerRole : 'Primary',
      leadershipScore: normalizeRatingBand(entry.leadershipScore),
      interestInOtcrScore: normalizeRatingBand(entry.interestInOtcrScore),
      behavioralPerformanceScore: normalizeRatingBand(entry.behavioralPerformanceScore),
      businessAcumenScore: normalizeRatingBand(entry.businessAcumenScore),
      qualitativeCreativityScore: normalizeRatingBand(entry.qualitativeCreativityScore),
      quantitativeStructureScore: normalizeRatingBand(entry.quantitativeStructureScore),
      casePerformanceScore: normalizeRatingBand(entry.casePerformanceScore),
      creativityConversationScore: normalizeRatingBand(entry.creativityConversationScore),
      recommendation: isDecisionValue(entry.recommendation) ? entry.recommendation : 'MAYBE',
      finalRoundSummary: typeof entry.finalRoundSummary === 'string' ? entry.finalRoundSummary : '',
      overallPerformanceOverview:
        typeof entry.overallPerformanceOverview === 'string' ? entry.overallPerformanceOverview : '',
      submittedAt: typeof entry.submittedAt === 'string' ? entry.submittedAt : new Date().toISOString(),
    };
  }

  if ('cultureFitScore' in entry || 'technicalScore' in entry || 'communicationScore' in entry || 'leadershipPotentialScore' in entry) {
    return {
      id: typeof entry.id === 'string' ? entry.id : `${applicantId}-${Date.now()}`,
      applicantId,
      applicantName: '',
      interviewerName: typeof entry.interviewerName === 'string' ? entry.interviewerName : 'Anonymous reviewer',
      intervieweeName: '',
      intervieweeGender: 'Other',
      interviewerRole: 'Primary',
      leadershipScore: normalizeRatingBand(entry.leadershipPotentialScore),
      interestInOtcrScore: normalizeRatingBand(entry.cultureFitScore),
      behavioralPerformanceScore: normalizeRatingBand(entry.communicationScore),
      businessAcumenScore: normalizeRatingBand(entry.technicalScore),
      qualitativeCreativityScore: normalizeRatingBand(entry.technicalScore),
      quantitativeStructureScore: normalizeRatingBand(entry.technicalScore),
      casePerformanceScore: normalizeRatingBand(entry.communicationScore),
      creativityConversationScore: normalizeRatingBand(entry.cultureFitScore),
      recommendation: isDecisionValue(entry.recommendation) ? entry.recommendation : 'MAYBE',
      finalRoundSummary:
        [entry.strengths, entry.concerns].filter((value) => typeof value === 'string' && value.trim()).join(' '),
      overallPerformanceOverview: typeof entry.comments === 'string' ? entry.comments : '',
      submittedAt: typeof entry.submittedAt === 'string' ? entry.submittedAt : new Date().toISOString(),
    };
  }

  return null;
};

const normalizeFeedback = (raw: unknown): Record<number, FeedbackEntry[]> => {
  if (!raw || typeof raw !== 'object') return {};
  const result: Record<number, FeedbackEntry[]> = {};

  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    const applicantId = Number(key);
    if (!Number.isFinite(applicantId) || !Array.isArray(value)) continue;

    const normalizedEntries = value
      .map((entry) => normalizeFeedbackEntry(entry, applicantId))
      .filter((entry): entry is FeedbackEntry => Boolean(entry));

    if (normalizedEntries.length > 0) {
      result[applicantId] = normalizedEntries;
    }
  }

  return result;
};

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
      sum +
      feedbackMetricFields.reduce((entrySum, field) => entrySum + entry[field.key], 0),
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
  const [error, setError] = useState<string | null>(null);
  const [applications, setApplications] = useState<ApplicantRecord[]>([]);
  const [selectedApplicantId, setSelectedApplicantId] = useState<number | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [cycleFilter, setCycleFilter] = useState<'all' | string>('all');
  const [feedbackByApplicant, setFeedbackByApplicant] = useState<Record<number, FeedbackEntry[]>>(mockFeedback);
  const [usingMockData, setUsingMockData] = useState(false);

  const isApplicantsView = location.pathname === '/tech/manage/applicants';
  const isFeedbackView = location.pathname === '/tech/manage/feedback';
  const requestedApplicantIdParam = searchParams.get('applicantId');
  const requestedApplicantId =
    requestedApplicantIdParam && Number.isFinite(Number(requestedApplicantIdParam))
      ? Number(requestedApplicantIdParam)
      : null;

  const headers = () => ({
    'X-Admin-Secret': storedSecret || '',
  });

  useEffect(() => {
    const key = sessionStorage.getItem(ADMIN_KEY_STORAGE);
    if (key) setStoredSecret(key);

    const persisted = localStorage.getItem(FEEDBACK_STORAGE);
    if (persisted) {
      try {
        setFeedbackByApplicant((current) => ({
          ...current,
          ...normalizeFeedback(JSON.parse(persisted)),
        }));
      } catch {
        // Ignore invalid local storage payloads and keep seeded feedback.
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(FEEDBACK_STORAGE, JSON.stringify(feedbackByApplicant));
  }, [feedbackByApplicant]);

  const fetchApplications = async () => {
    if (!storedSecret) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/applications`, { headers: headers() });

      if (response.status === 403) {
        sessionStorage.removeItem(ADMIN_KEY_STORAGE);
        setStoredSecret(null);
        setError('Invalid admin key. Please enter it again.');
        navigate('/tech/manage', { replace: true });
        return;
      }

      if (!response.ok) throw new Error('Failed to load applicants from backend');

      const data = (await response.json()) as ApplicantRecord[];
      if (data.length === 0) {
        const fallback = buildFallbackApplicants();
        setApplications(fallback);
        setUsingMockData(true);
        setSelectedApplicantId((current) => current ?? fallback[0]?.id ?? null);
        setError('Backend is reachable but returned no applicants. Showing mock applicant data for the MVP dashboard.');
        return;
      }

      const enriched = data.map((applicant) => ({
        ...applicant,
        assigned_exec: deriveAssignedExec(applicant),
      }));

      setApplications(enriched);
      setUsingMockData(false);
      setSelectedApplicantId((current) => current ?? enriched[0]?.id ?? null);
    } catch (fetchError: unknown) {
      const fallback = buildFallbackApplicants();
      setApplications(fallback);
      setUsingMockData(true);
      setSelectedApplicantId((current) => current ?? fallback[0]?.id ?? null);
      setError(fetchError instanceof Error ? fetchError.message : 'Backend unavailable. Showing mock applicant data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (storedSecret) fetchApplications();
  }, [storedSecret]);

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
    setApplications([]);
    setSelectedApplicantId(null);
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
        description: 'This applicant is using local mock data, so there is no backend resume stream.',
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

  const handleSubmitFeedback = (entry: Omit<FeedbackEntry, 'id' | 'submittedAt'>) => {
    const completeEntry: FeedbackEntry = {
      ...entry,
      id: `${entry.applicantId}-${Date.now()}`,
      submittedAt: new Date().toISOString(),
    };

    setFeedbackByApplicant((current) => ({
      ...current,
      [entry.applicantId]: [completeEntry, ...(current[entry.applicantId] ?? [])],
    }));

    toast({
      title: 'Feedback saved',
      description: `${entry.intervieweeName} now has an updated review in the Applicants workspace.`,
    });
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
            <Button asChild variant="outline" className={adminViewButtonClass(!isApplicantsView && !isFeedbackView)}>
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
          </div>

          <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-cyan-200/70">Recruitment admin</p>
              <div className="mt-3 flex items-center gap-4">
                <img src={otcrTechLogo} alt="OTCR Technologies" className="h-10 w-auto" />
                <h1 className="text-3xl font-semibold text-white">
                  {!isApplicantsView && !isFeedbackView
                    ? 'Consultant review dashboard'
                    : isApplicantsView
                      ? 'Applicants'
                      : 'Feedback form'}
                </h1>
              </div>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-white/60">
                {!isApplicantsView && !isFeedbackView
                  ? 'Choose between the existing applicant review workspace and the standalone interviewer feedback form.'
                  : isApplicantsView
                    ? 'This is the existing consultant review workspace, now grouped under the Applicants section.'
                    : 'Capture the interview rubric, final-round push areas, and a clear yes / lean yes / lean no / no point of view.'}
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
                onClick={fetchApplications}
                disabled={loading}
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
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
              Backend data was unavailable, so the dashboard is showing mock applicant records and local feedback state.
            </div>
          ) : null}

          {!isApplicantsView && !isFeedbackView ? (
            <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
              <div className="grid gap-6 md:grid-cols-2">
                <Link
                  to="/tech/manage/applicants"
                  className="group rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(17,25,40,0.98),rgba(8,13,22,0.99))] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.34)] transition-all hover:-translate-y-1 hover:border-cyan-300/35 hover:bg-[linear-gradient(180deg,rgba(19,34,55,0.98),rgba(8,13,22,0.99))]"
                >
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-400/10 text-cyan-100">
                    <ClipboardList className="h-6 w-6" />
                  </span>
                  <h2 className="mt-6 text-2xl font-semibold text-white">Applicants</h2>
                  <p className="mt-3 text-sm leading-6 text-white/55">
                    Open the existing review workspace with applicant search, resume access, status snapshots, and saved interviewer feedback.
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
                    Submit the standalone consultant interview rubric and attach it to an applicant by using the interviewee&apos;s exact name.
                  </p>
                  <p className="mt-6 text-sm font-medium text-cyan-100">Open feedback form</p>
                </Link>
              </div>

              <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(17,25,40,0.98),rgba(8,13,22,0.99))] shadow-[0_24px_60px_rgba(0,0,0,0.34)]">
                <CardHeader>
                  <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/70">Snapshot</p>
                  <CardTitle className="text-xl text-white">Current review state</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-white/45">Applicants</p>
                      <p className="mt-3 text-3xl font-semibold text-white">{applications.length}</p>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-white/45">Feedback</p>
                      <p className="mt-3 text-3xl font-semibold text-white">{totalFeedbackCount}</p>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-white/45">Cycles</p>
                      <p className="mt-3 text-3xl font-semibold text-white">{Math.max(cycleOptions.length - 1, 0)}</p>
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
                                <p className="text-sm font-medium text-white">{entry.intervieweeName || entry.applicantName || 'Unnamed applicant'}</p>
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
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div>
                <FeedbackForm
                  applicants={applications}
                  initialApplicantId={requestedFeedbackApplicant?.id ?? null}
                  onSubmitFeedback={handleSubmitFeedback}
                />
              </div>

              <div className="space-y-5">
                <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(17,25,40,0.96),rgba(8,13,22,0.98))]">
                  <CardHeader>
                    <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/65">Linked applicant</p>
                    <CardTitle className="text-xl text-white">
                      {requestedFeedbackApplicant ? requestedFeedbackApplicant.name : 'No applicant preselected'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-white/60">
                    {requestedFeedbackApplicant ? (
                      <>
                        <p>Cycle: <span className="text-white">{requestedFeedbackApplicant.cycle_name ?? 'Unassigned'}</span></p>
                        <p>Email: <span className="text-white">{requestedFeedbackApplicant.email}</span></p>
                        <p>Assigned exec: <span className="text-white">{requestedFeedbackApplicant.assigned_exec ?? 'Unassigned'}</span></p>
                        <Button
                          type="button"
                          variant="outline"
                          className="mt-2 w-full border-white/10 bg-white/5 text-white hover:bg-white/10"
                          onClick={() => navigate(`/tech/manage/applicants?applicantId=${requestedFeedbackApplicant.id}`)}
                        >
                          <ClipboardList className="h-4 w-4" />
                          Open applicant profile
                        </Button>
                      </>
                    ) : (
                      <p>
                        You can open this form directly from an applicant profile, or type the exact interviewee name to attach the feedback to a record.
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(17,25,40,0.96),rgba(8,13,22,0.98))]">
                  <CardHeader>
                    <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/65">Recent submissions</p>
                    <CardTitle className="text-xl text-white">Latest feedback</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {recentFeedback.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-5 text-sm text-white/55">
                        No feedback submitted yet.
                      </div>
                    ) : (
                      recentFeedback.map((entry) => (
                        <div key={entry.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="font-medium text-white">{entry.intervieweeName || entry.applicantName || 'Unnamed applicant'}</p>
                              <p className="text-xs uppercase tracking-[0.18em] text-white/40">{entry.recommendation}</p>
                            </div>
                            <p className="text-xs text-white/40">{new Date(entry.submittedAt).toLocaleDateString()}</p>
                          </div>
                          <p className="mt-3 text-sm text-white/55">{entry.overallPerformanceOverview}</p>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : null}
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default DevopsManage;
