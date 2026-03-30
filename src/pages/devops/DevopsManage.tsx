import { useEffect, useMemo, useState } from 'react';
import { Loader2, Lock, LogOut, RefreshCcw } from 'lucide-react';

import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import ApplicantDetail from '@/pages/devops/components/admin/ApplicantDetail';
import ConsultantList from '@/pages/devops/components/admin/ConsultantList';
import { mockApplicants, mockFeedback } from '@/pages/devops/components/admin/mockData';
import type { ApplicantRecord, FeedbackEntry } from '@/pages/devops/components/admin/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import otcrTechLogo from '@/assets/otcr-technologies-white-nomargins.webp';
import { getOaApiUrl } from '@/lib/oa-api-url';

const API_BASE_URL = getOaApiUrl();
const ADMIN_KEY_STORAGE = 'otcr_devops_admin_secret';
const FEEDBACK_STORAGE = 'otcr_recruitment_feedback_v1';

const defaultExecRoster = ['Ava Patel', 'Mihika Rao', 'Isaiah Brooks', 'Laksh Shah'];

const deriveAssignedExec = (applicant: ApplicantRecord) =>
  applicant.assigned_exec ??
  applicant.notes?.match(/assigned[:\s]+([a-zA-Z\s]+)/i)?.[1]?.trim() ??
  defaultExecRoster[applicant.id % defaultExecRoster.length];

const normalizeFeedback = (raw: unknown): Record<number, FeedbackEntry[]> => {
  if (!raw || typeof raw !== 'object') return {};
  const result: Record<number, FeedbackEntry[]> = {};

  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    const applicantId = Number(key);
    if (!Number.isFinite(applicantId) || !Array.isArray(value)) continue;
    result[applicantId] = value.filter(Boolean) as FeedbackEntry[];
  }

  return result;
};

const getVoteCounts = (entries: FeedbackEntry[]) =>
  entries.reduce(
    (acc, entry) => {
      if (entry.recommendation === 'YES') acc.yes += 1;
      if (entry.recommendation === 'NO') acc.no += 1;
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
      entry.cultureFitScore +
      entry.technicalScore +
      entry.communicationScore +
      entry.leadershipPotentialScore,
    0
  );
  return total / (entries.length * 4);
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

const DevopsManage = () => {
  const { toast } = useToast();
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
        // Ignore invalid local storage payloads and keep seeded mock feedback.
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
      const res = await fetch(`${API_BASE_URL}/api/admin/applications`, { headers: headers() });
      if (res.status === 403) {
        sessionStorage.removeItem(ADMIN_KEY_STORAGE);
        setStoredSecret(null);
        setError('Invalid admin key. Please enter it again.');
        return;
      }
      if (!res.ok) throw new Error('Failed to load applicants from backend');

      const data = (await res.json()) as ApplicantRecord[];
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
    } catch (fetchError: any) {
      const fallback = buildFallbackApplicants();
      setApplications(fallback);
      setUsingMockData(true);
      setSelectedApplicantId((current) => current ?? fallback[0]?.id ?? null);
      setError(fetchError?.message || 'Backend unavailable. Showing mock applicant data.');
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

  const filteredApplicants = useMemo(() => {
    return applications.filter((applicant) => {
      const searchMatches = applicant.name.toLowerCase().includes(searchValue.toLowerCase());
      const cycleMatches = cycleFilter === 'all' || applicant.cycle_name === cycleFilter;
      return searchMatches && cycleMatches;
    });
  }, [applications, cycleFilter, searchValue]);

  useEffect(() => {
    if (!filteredApplicants.length) {
      setSelectedApplicantId(null);
      return;
    }

    const selectedStillVisible = filteredApplicants.some((applicant) => applicant.id === selectedApplicantId);
    if (!selectedStillVisible) setSelectedApplicantId(filteredApplicants[0].id);
  }, [filteredApplicants, selectedApplicantId]);

  const selectedApplicant = filteredApplicants.find((applicant) => applicant.id === selectedApplicantId) ?? null;

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
      const res = await fetch(`${API_BASE_URL}/api/admin/applications/${applicant.id}/resume`, { headers: headers() });
      if (!res.ok) throw new Error('Could not open resume');
      const blob = await res.blob();
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

    setApplications((current) =>
      current.map((applicant) =>
        applicant.id === entry.applicantId
          ? {
              ...applicant,
              assigned_exec: entry.assignedExec || applicant.assigned_exec,
            }
          : applicant
      )
    );

    toast({
      title: 'Feedback saved',
      description: 'The evaluation was saved locally in this browser for the MVP dashboard.',
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
                  Enter the admin key to open the recruitment review dashboard.
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
          <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-cyan-200/70">Recruitment admin</p>
              <div className="mt-3 flex items-center gap-4">
                <img src={otcrTechLogo} alt="OTCR Technologies" className="h-10 w-auto" />
                <h1 className="text-3xl font-semibold text-white">Consultant review dashboard</h1>
              </div>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-white/60">
                Review applicants, open resumes, capture interviewer feedback, and track YES / NO / MAYBE decisions from one admin workspace.
              </p>
              <p className="mt-2 text-xs uppercase tracking-[0.24em] text-white/40">
                Visible under <span className="text-white/70">/tech/manage</span> and legacy redirect <span className="text-white/70">/devops/manage</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
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

          {error && (
            <div className="mb-5 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              {error}
            </div>
          )}

          {usingMockData && (
            <div className="mb-5 rounded-2xl border border-sky-400/20 bg-sky-500/10 px-4 py-3 text-sm text-sky-100">
              Backend data was unavailable, so the dashboard is showing mock applicant records and local feedback state.
            </div>
          )}

          {loading && applications.length === 0 ? (
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
                    onSubmitFeedback={handleSubmitFeedback}
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
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default DevopsManage;
