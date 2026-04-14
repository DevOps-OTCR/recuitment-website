import { useMemo, useState } from 'react';
import { ArrowUpRight, CheckCircle2, Clock3, FileText, UserRound } from 'lucide-react';

import Footer from '@/components/Footer';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useRecruitingStore } from '@/features/recruiting';
import { Role } from '@/features/recruiting/types';
import FeedbackForm from '@/pages/devops/components/admin/FeedbackForm';
import StatusSummary from '@/pages/devops/components/admin/StatusSummary';
import { feedbackMetricFields, formatRatingBand, type FeedbackEntry } from '@/pages/devops/components/admin/types';
import {
  getApplicantStatusLabel,
  getAssignmentLabel,
  getCurrentInterviewerId,
  getInterviewerWorkspaceSnapshot,
  getInterviewerUsers,
  setCurrentInterviewerId,
  submitInterviewerFeedback,
} from '@/pages/devops/interviewerStore';

const interviewRoundOrder = ['Round 1', 'Round 2'] as const;

const recommendationToneClasses: Record<FeedbackEntry['recommendation'], string> = {
  YES: 'border-emerald-300/30 bg-emerald-400/10 text-emerald-100',
  'LEAN YES': 'border-emerald-300/30 bg-emerald-400/10 text-emerald-100',
  MAYBE: 'border-amber-300/25 bg-amber-400/10 text-amber-100',
  'LEAN NO': 'border-rose-300/25 bg-rose-400/10 text-rose-100',
  NO: 'border-rose-300/25 bg-rose-400/10 text-rose-100',
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
      feedbackMetricFields.reduce((fieldSum, field) => fieldSum + entry[field.key], 0) / feedbackMetricFields.length,
    0
  );
  return total / entries.length;
};

const getOverallStatus = (entries: FeedbackEntry[]) => {
  const votes = getVoteCounts(entries);
  if (votes.yes >= 2) return 'YES';
  if (votes.no >= 2) return 'NO';
  if (votes.yes > votes.no && votes.yes > 0) return 'YES';
  if (votes.no > votes.yes && votes.no > 0) return 'NO';
  if (votes.maybe > 0) return 'Pending';
  return 'Pending';
};

const formatRoleLabel = (role: Role) => {
  if (role === Role.LC || role === Role.Consultant) return 'Consultant';
  if (role === Role.PM) return 'PM';
  if (role === Role.Partner) return 'Partner';
  return role;
};

const DevopsMyInterviews = () => {
  const { toast } = useToast();
  useRecruitingStore((state) => state);

  const [currentUserId, setCurrentUserIdState] = useState(() => getCurrentInterviewerId() ?? '');
  const [selectedApplicantId, setSelectedApplicantId] = useState<number | null>(null);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const interviewerUsers = useMemo(
    () => getInterviewerUsers().filter((user) => user.role !== Role.Applicant),
    []
  );

  const workspace = useMemo(() => getInterviewerWorkspaceSnapshot(currentUserId), [currentUserId]);

  const eligibleUsers = useMemo(
    () =>
      interviewerUsers.filter((user) =>
        user.role === Role.Consultant || user.role === Role.LC || user.role === Role.PM || user.role === Role.Partner
      ),
    [interviewerUsers]
  );

  const applicants = workspace.applicants;

  const selectedApplicant = useMemo(() => {
    if (applicants.length === 0) return null;
    return applicants.find((applicant) => applicant.id === selectedApplicantId) ?? applicants[0];
  }, [applicants, selectedApplicantId]);

  const selectedEntries = useMemo(() => {
    if (!selectedApplicant) return [];
    return (workspace.feedbackByApplicant[selectedApplicant.id] ?? []).slice().sort((left, right) => {
      return new Date(right.submittedAt).getTime() - new Date(left.submittedAt).getTime();
    });
  }, [selectedApplicant, workspace.feedbackByApplicant]);

  const selectedRound = useMemo(() => {
    if (!selectedApplicant || !workspace.currentUser) return 'Round 1' as const;
    const round2Assignment = getAssignmentLabel(workspace.currentUser.id, selectedApplicant.id, 'Round 2', workspace.assignments);
    return round2Assignment ? 'Round 2' : 'Round 1';
  }, [selectedApplicant, workspace.assignments, workspace.currentUser]);

  const selectedRoundEntries = selectedEntries.filter((entry) => entry.round === selectedRound);
  const voteCounts = getVoteCounts(selectedRoundEntries);
  const averageScore = getAverageScore(selectedRoundEntries);
  const overallStatus = getOverallStatus(selectedRoundEntries);

  const openResume = (resumeUrl: string | null | undefined) => {
    if (!resumeUrl || typeof window === 'undefined') return;
    window.open(resumeUrl, '_blank', 'noopener,noreferrer');
  };

  const handleUserChange = (userId: string) => {
    setCurrentInterviewerId(userId);
    setCurrentUserIdState(userId);
    setSelectedApplicantId(null);
  };

  const handleSubmitFeedback = async (entry: Omit<FeedbackEntry, 'id' | 'submittedAt'>) => {
    if (!workspace.currentUser) return;

    setSubmittingFeedback(true);
    try {
      submitInterviewerFeedback(workspace.currentUser, entry);
      toast({
        title: 'Feedback saved',
        description: `${entry.intervieweeName} now has updated shared recruiting feedback for ${entry.round}.`,
      });
    } catch (error) {
      toast({
        title: 'Could not save feedback',
        description: error instanceof Error ? error.message : 'The shared recruiting store rejected this feedback update.',
        variant: 'destructive',
      });
    } finally {
      setSubmittingFeedback(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <section className="relative overflow-hidden px-4 pb-24 pt-28">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.16),transparent_28%),radial-gradient(circle_at_85%_18%,rgba(250,204,21,0.10),transparent_20%),linear-gradient(180deg,rgba(4,10,20,0.94),rgba(3,8,17,1))]" />
        <div className="relative mx-auto max-w-7xl space-y-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.32em] text-cyan-200/70">Interviewer workspace</p>
              <h1 className="mt-3 text-3xl font-semibold text-white">My interviews</h1>
              <p className="mt-3 text-sm leading-6 text-white/60">
                Interviewers only see applicants assigned to their current mock user. Feedback writes back into the shared recruiting state used by the broader `#/tech/manage` flow.
              </p>
            </div>

            <Card className="w-full max-w-md border-white/10 bg-white/[0.04] lg:w-[360px]">
              <CardHeader className="pb-3">
                <p className="text-xs uppercase tracking-[0.22em] text-cyan-200/65">Current interviewer</p>
                <CardTitle className="text-lg text-white">Local user context</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <select
                  value={workspace.currentUser?.id ?? eligibleUsers[0]?.id ?? ''}
                  onChange={(event) => handleUserChange(event.target.value)}
                  className="h-11 w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 text-sm text-white outline-none"
                >
                  {eligibleUsers.map((user) => (
                    <option key={user.id} value={user.id} className="bg-slate-950 text-white">
                      {user.name} • {formatRoleLabel(user.role)}
                    </option>
                  ))}
                </select>
                {workspace.currentUser ? (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/65">
                    <div className="font-medium text-white">{workspace.currentUser.name}</div>
                    <div>{workspace.currentUser.email}</div>
                    <div className="mt-1 uppercase tracking-[0.18em] text-cyan-200/70">
                      {formatRoleLabel(workspace.currentUser.role)}
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
            <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(17,25,40,0.96),rgba(8,13,22,0.98))]">
              <CardHeader className="border-b border-white/10">
                <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/65">Assigned interviews</p>
                <CardTitle className="text-xl text-white">{applicants.length} assigned applicants</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-4">
                {applicants.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-5 text-sm leading-6 text-white/55">
                    No interviews are assigned to this user right now.
                  </div>
                ) : (
                  applicants.map((applicant) => {
                    const assignmentLabel = workspace.currentUser
                      ? getAssignmentLabel(workspace.currentUser.id, applicant.id, applicant.status === 'round_2' ? 'Round 2' : 'Round 1', workspace.assignments)
                      : null;
                    const isActive = applicant.id === selectedApplicant?.id;
                    const applicantEntries = workspace.feedbackByApplicant[applicant.id] ?? [];
                    const applicantAverage = getAverageScore(applicantEntries);

                    return (
                      <button
                        key={applicant.id}
                        type="button"
                        onClick={() => setSelectedApplicantId(applicant.id)}
                        className={`w-full rounded-2xl border px-4 py-4 text-left transition-all ${
                          isActive
                            ? 'border-cyan-300/40 bg-cyan-400/10 shadow-[0_10px_30px_rgba(56,189,248,0.18)]'
                            : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5">
                                <UserRound className="h-4 w-4 text-cyan-200" />
                              </span>
                              <div className="min-w-0">
                                <div className="truncate font-medium text-white">{applicant.name}</div>
                                <div className="truncate text-xs text-white/45">{applicant.cycle_name ?? 'No cycle'}</div>
                              </div>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-white/65">
                                {getApplicantStatusLabel(applicant.status)}
                              </span>
                              {assignmentLabel ? (
                                <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-cyan-100">
                                  {assignmentLabel}
                                </span>
                              ) : null}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs uppercase tracking-[0.18em] text-white/40">Avg</div>
                            <div className="text-lg font-semibold text-white">{applicantAverage?.toFixed(1) ?? '--'}</div>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </CardContent>
            </Card>

            <div className="space-y-6">
              {selectedApplicant ? (
                <>
                  <Card className="overflow-hidden border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.16),transparent_35%),linear-gradient(180deg,rgba(15,22,36,0.98),rgba(8,13,24,0.98))]">
                    <CardHeader className="border-b border-white/10">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/65">Applicant</p>
                          <CardTitle className="mt-2 text-3xl text-white">{selectedApplicant.name}</CardTitle>
                          <p className="mt-2 max-w-2xl text-sm text-white/60">
                            {selectedApplicant.interest ?? 'No written OTCR interest statement is available.'}
                          </p>
                        </div>
                        <div className="grid gap-2 text-sm text-white/65">
                          <div><span className="text-white/35">Email</span> {selectedApplicant.email}</div>
                          <div><span className="text-white/35">Status</span> {getApplicantStatusLabel(selectedApplicant.status)}</div>
                          <div><span className="text-white/35">Your round</span> {selectedRound}</div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4 p-6">
                      <StatusSummary
                        yesCount={voteCounts.yes}
                        noCount={voteCounts.no}
                        maybeCount={voteCounts.maybe}
                        statusLabel={overallStatus}
                        averageScore={averageScore}
                      />
                      <div className="flex flex-wrap gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                          onClick={() => openResume(selectedApplicant.resume_url)}
                          disabled={!selectedApplicant.resume_url}
                        >
                          <ArrowUpRight className="mr-2 h-4 w-4" />
                          Open resume
                        </Button>
                        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/60">
                          Feedback form is pre-scoped to your assigned round and updates your existing submission for that round.
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_420px]">
                    <FeedbackForm
                      applicants={[selectedApplicant]}
                      initialApplicantId={selectedApplicant.id}
                      initialRound={selectedRound}
                      onSubmitFeedback={handleSubmitFeedback}
                      submitting={submittingFeedback}
                    />

                    <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(17,25,40,0.96),rgba(8,13,22,0.98))]">
                      <CardHeader className="border-b border-white/10">
                        <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/65">Existing feedback</p>
                        <CardTitle className="text-xl text-white">Shared evaluations</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4 p-4">
                        {selectedEntries.length === 0 ? (
                          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-5 text-sm leading-6 text-white/55">
                            No evaluations have been submitted for this applicant yet.
                          </div>
                        ) : (
                          selectedEntries.map((entry) => (
                            <div key={entry.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-cyan-200" />
                                    <span className="font-medium text-white">{entry.interviewerName}</span>
                                  </div>
                                  <div className="mt-1 text-xs uppercase tracking-[0.18em] text-white/45">
                                    {entry.round} • {entry.interviewerRole}
                                  </div>
                                </div>
                                <span className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${recommendationToneClasses[entry.recommendation]}`}>
                                  {entry.recommendation}
                                </span>
                              </div>
                              <div className="mt-4 grid grid-cols-2 gap-2">
                                {feedbackMetricFields.slice(0, 4).map((field) => (
                                  <div key={field.key} className="rounded-xl border border-white/8 bg-black/15 px-3 py-2">
                                    <div className="text-[10px] uppercase tracking-[0.16em] text-white/40">{field.label.replace('\n', ' ')}</div>
                                    <div className="mt-1 text-sm text-white">{formatRatingBand(entry[field.key])}</div>
                                  </div>
                                ))}
                              </div>
                              <div className="mt-4 space-y-3 text-sm leading-6 text-white/65">
                                <div>
                                  <div className="text-[11px] uppercase tracking-[0.18em] text-cyan-200/65">Overview</div>
                                  <div>{entry.overallPerformanceOverview}</div>
                                </div>
                                <div>
                                  <div className="text-[11px] uppercase tracking-[0.18em] text-cyan-200/65">Summary</div>
                                  <div>{entry.finalRoundSummary}</div>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </>
              ) : (
                <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(17,25,40,0.96),rgba(8,13,22,0.98))]">
                  <CardContent className="flex min-h-[320px] items-center justify-center p-8 text-center">
                    <div className="max-w-md space-y-3">
                      <Clock3 className="mx-auto h-10 w-10 text-cyan-200/80" />
                      <h2 className="text-2xl font-semibold text-white">No assigned interviews</h2>
                      <p className="text-sm leading-6 text-white/60">
                        Switch the local interviewer context or add shared assignments under the recruiting flow to populate this workspace.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          <Card className="border-white/10 bg-white/[0.03]">
            <CardContent className="grid gap-4 p-5 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-white">
                  <CheckCircle2 className="h-4 w-4 text-cyan-200" />
                  Shared recruiting data
                </div>
                <p className="mt-2 text-sm leading-6 text-white/60">
                  Applicants, assignments, evaluations, and users come from the shared recruiting foundation instead of a separate interviewer store.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-white">
                  <FileText className="h-4 w-4 text-cyan-200" />
                  Reused admin patterns
                </div>
                <p className="mt-2 text-sm leading-6 text-white/60">
                  This page reuses the existing admin `FeedbackForm` and `StatusSummary` components, but trims the broader dashboard and decision controls.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-white">
                  <UserRound className="h-4 w-4 text-cyan-200" />
                  Assignment filtering
                </div>
                <p className="mt-2 text-sm leading-6 text-white/60">
                  The applicant list is filtered by assignments whose `interviewerId` matches the current mock user, with LC displayed and treated exactly as consultant.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default DevopsMyInterviews;
