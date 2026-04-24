import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock3, UserCheck, Users } from 'lucide-react';

import Footer from '@/components/Footer';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  Role,
  evaluationsService,
  canReviewApplicants,
  getApplicationStatusLabel,
  getInterviewRoundLabel,
  sessionService,
  useRecruitingStore,
  type Applicant,
  type Assignment,
  type Evaluation,
  type RecruitingUser,
} from '@/features/recruiting';
import FeedbackForm from '@/pages/devops/components/admin/FeedbackForm';
import type { ApplicantRecord, FeedbackEntry, InterviewRound, InterviewerRole } from '@/pages/devops/components/admin/types';

const recommendationMap: Record<FeedbackEntry['recommendation'], Evaluation['recommendation']> = {
  YES: 'yes',
  'LEAN YES': 'lean_yes',
  MAYBE: 'lean_no',
  'LEAN NO': 'lean_no',
  NO: 'no',
};

const toNumericApplicantId = (applicantId: string) =>
  applicantId.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);

const toApplicantRecord = (applicant: Applicant): ApplicantRecord => ({
  id: toNumericApplicantId(applicant.id),
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
});

const toInterviewerRole = (assignment: Assignment | null): InterviewerRole =>
  assignment?.role === 'secondary' ? 'Secondary' : 'Primary';

const toAdminRound = (assignment: Assignment | null): InterviewRound =>
  assignment?.round === 'round_2' ? 'Round 2' : 'Round 1';

const getRoleLabel = (role: RecruitingUser['role']) => {
  switch (role) {
    case Role.Partner:
      return 'Partner';
    case Role.PM:
      return 'PM';
    case Role.LC:
      return 'LC';
    case Role.Consultant:
      return 'Consultant';
    default:
      return 'Applicant';
  }
};

const getAssignmentForApplicant = (assignments: Assignment[], applicant: Applicant, interviewerId: string) =>
  assignments.find(
    (assignment) =>
      assignment.applicantId === applicant.id &&
      assignment.interviewerId === interviewerId &&
      applicant.currentRound !== null &&
      assignment.round === applicant.currentRound
  ) ?? null;

const getMyLatestEvaluation = (evaluations: Evaluation[], applicantId: string, interviewerId: string, assignment: Assignment | null) =>
  evaluations
    .filter(
      (evaluation) =>
        evaluation.applicantId === applicantId &&
        evaluation.interviewerId === interviewerId &&
        (!assignment || evaluation.round === assignment.round)
    )
    .sort((left, right) => new Date(right.submittedAt).getTime() - new Date(left.submittedAt).getTime())[0] ?? null;

const DevopsMyInterviews = () => {
  const { toast } = useToast();
  const { applicants, assignments, evaluations, users } = useRecruitingStore((state) => state);

  const interviewerUsers = useMemo(
    () => users.filter((user) => user.active && canReviewApplicants(user)),
    [users]
  );

  const [currentUserId, setCurrentUserIdState] = useState('');
  const [selectedApplicantId, setSelectedApplicantId] = useState<string | null>(null);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const currentUser = useMemo(
    () => interviewerUsers.find((user) => user.id === currentUserId) ?? interviewerUsers[0] ?? null,
    [currentUserId, interviewerUsers]
  );

  useEffect(() => {
    let cancelled = false;

    void sessionService.getCurrentInterviewerId().then((userId) => {
      if (cancelled) return;
      setCurrentUserIdState(userId);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (currentUser && currentUser.id !== currentUserId) {
      void sessionService.setCurrentInterviewer(currentUser.id);
      setCurrentUserIdState(currentUser.id);
    }
  }, [currentUser, currentUserId]);

  const assignedApplicants = useMemo(() => {
    if (!currentUser) return [];

    return applicants
      .filter((applicant) => applicant.currentRound !== null && getAssignmentForApplicant(assignments, applicant, currentUser.id))
      .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime());
  }, [applicants, assignments, currentUser]);

  useEffect(() => {
    if (assignedApplicants.length === 0) {
      setSelectedApplicantId(null);
      return;
    }

    setSelectedApplicantId((current) =>
      current && assignedApplicants.some((applicant) => applicant.id === current) ? current : assignedApplicants[0].id
    );
  }, [assignedApplicants]);

  const selectedApplicant = useMemo(
    () => assignedApplicants.find((applicant) => applicant.id === selectedApplicantId) ?? assignedApplicants[0] ?? null,
    [assignedApplicants, selectedApplicantId]
  );

  const selectedAssignment = useMemo(
    () => (selectedApplicant && currentUser ? getAssignmentForApplicant(assignments, selectedApplicant, currentUser.id) : null),
    [assignments, currentUser, selectedApplicant]
  );

  const myLatestEvaluation = useMemo(
    () =>
      selectedApplicant && currentUser
        ? getMyLatestEvaluation(evaluations, selectedApplicant.id, currentUser.id, selectedAssignment)
        : null,
    [currentUser, evaluations, selectedApplicant, selectedAssignment]
  );

  const assignedApplicantRecords = useMemo(
    () => assignedApplicants.map(toApplicantRecord),
    [assignedApplicants]
  );

  const selectedApplicantRecord = useMemo(
    () => (selectedApplicant ? toApplicantRecord(selectedApplicant) : null),
    [selectedApplicant]
  );

  const handleUserChange = (nextUserId: string) => {
    void sessionService.setCurrentInterviewer(nextUserId);
    setCurrentUserIdState(nextUserId);
    setSelectedApplicantId(null);
  };

  const handleSubmitFeedback = async (entry: Omit<FeedbackEntry, 'id' | 'submittedAt'>) => {
    if (!currentUser || !selectedApplicant || !selectedAssignment) return;

    setSubmittingFeedback(true);
    try {
      await evaluationsService.upsertEvaluation({
        id: `eval-${selectedApplicant.id}-${currentUser.id}-${selectedAssignment.round}`,
        applicantId: selectedApplicant.id,
        interviewerId: currentUser.id,
        interviewerRole: currentUser.role,
        round: selectedAssignment.round,
        recommendation: recommendationMap[entry.recommendation],
        rubric: {
          communication: Math.min(5, entry.behavioralPerformanceScore + 2),
          structure: Math.min(5, entry.quantitativeStructureScore + 2),
          problemSolving: Math.min(5, entry.casePerformanceScore + 2),
          motivation: Math.min(5, entry.interestInOtcrScore + 2),
          teamwork: Math.min(5, entry.leadershipScore + 2),
        },
        summary: entry.overallPerformanceOverview,
        strengths: [entry.overallPerformanceOverview],
        concerns: [entry.finalRoundSummary],
        submittedAt: new Date().toISOString(),
      });

      toast({
        title: 'Feedback saved',
        description: `${selectedApplicant.name} was updated in the shared local recruiting state for ${getInterviewRoundLabel(selectedAssignment.round)}.`,
      });
    } catch (error) {
      toast({
        title: 'Could not save feedback',
        description: error instanceof Error ? error.message : 'The shared recruiting state rejected this feedback update.',
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
        <div className="relative mx-auto max-w-[1360px] space-y-6">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.32em] text-cyan-200/70">Interviewer workspace</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">My interviews</h1>
            <p className="mt-3 text-sm leading-6 text-white/60">
              This is the same feedback form workflow used in `#/tech/manage`, narrowed to the current signed-in mock interviewer and only the applicants assigned to them in shared local recruiting state.
            </p>
          </div>

          <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
            <div className="space-y-4">
              <Card className="border-white/10 bg-white/[0.04]">
                <CardHeader className="pb-3">
                  <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/70">Signed-in interviewer</p>
                  <CardTitle className="text-lg text-white">Mock user context</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <select
                    value={currentUser?.id ?? ''}
                    onChange={(event) => handleUserChange(event.target.value)}
                    className="h-11 w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 text-sm text-white outline-none"
                  >
                    {interviewerUsers.map((user) => (
                      <option key={user.id} value={user.id} className="bg-slate-950 text-white">
                        {user.name} • {getRoleLabel(user.role)}
                      </option>
                    ))}
                  </select>
                  {currentUser ? (
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/70">
                      <div className="font-medium text-white">{currentUser.name}</div>
                      <div>{currentUser.email}</div>
                      <div className="mt-1 uppercase tracking-[0.18em] text-cyan-200/70">{getRoleLabel(currentUser.role)}</div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(17,25,40,0.96),rgba(8,13,22,0.98))]">
                <CardHeader className="border-b border-white/10 pb-3">
                  <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/65">Assigned interviewees</p>
                  <CardTitle className="text-lg text-white">{assignedApplicants.length} scoped applicants</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 p-4">
                  {assignedApplicants.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-white/55">
                      This user has no applicants assigned in the current round.
                    </div>
                  ) : (
                    assignedApplicants.map((applicant) => {
                      const assignment = currentUser ? getAssignmentForApplicant(assignments, applicant, currentUser.id) : null;
                      const isActive = applicant.id === selectedApplicant?.id;

                      return (
                        <button
                          key={applicant.id}
                          type="button"
                          onClick={() => setSelectedApplicantId(applicant.id)}
                          className={[
                            'w-full rounded-2xl border px-4 py-4 text-left transition-all',
                            isActive
                              ? 'border-cyan-300/40 bg-cyan-400/10 shadow-[0_12px_30px_rgba(56,189,248,0.16)]'
                              : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]',
                          ].join(' ')}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="font-medium text-white">{applicant.name}</div>
                              <div className="mt-1 text-xs text-white/50">
                                {getApplicationStatusLabel(applicant.status)} • {getInterviewRoundLabel(applicant.currentRound)}
                              </div>
                            </div>
                            <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-cyan-100">
                              {toInterviewerRole(assignment)}
                            </span>
                          </div>
                        </button>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              {selectedApplicant && currentUser && selectedAssignment && selectedApplicantRecord ? (
                <>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]">
                    <Card className="border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.14),transparent_32%),linear-gradient(180deg,rgba(15,22,36,0.98),rgba(8,13,24,0.98))]">
                      <CardHeader className="pb-3">
                        <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/70">Current review</p>
                        <CardTitle className="text-2xl text-white">{selectedApplicant.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                            <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Interview round</p>
                            <p className="mt-2 text-base font-medium text-white">{toAdminRound(selectedAssignment)}</p>
                          </div>
                          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                            <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Your assignment</p>
                            <p className="mt-2 text-base font-medium text-white">{toInterviewerRole(selectedAssignment)} interviewer</p>
                          </div>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-white/65">
                          {selectedApplicant.whyOtcr}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-white/10 bg-white/[0.03]">
                      <CardHeader className="pb-3">
                        <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/70">Saved locally</p>
                        <CardTitle className="text-lg text-white">Your latest submission</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 text-sm text-white/65">
                        {myLatestEvaluation ? (
                          <>
                            <div className="flex items-center gap-2 text-white">
                              <CheckCircle2 className="h-4 w-4 text-cyan-200" />
                              Review saved for {getInterviewRoundLabel(myLatestEvaluation.round)}
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                              <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Submitted</p>
                              <p className="mt-2 text-white">
                                {new Date(myLatestEvaluation.submittedAt).toLocaleString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: 'numeric',
                                  minute: '2-digit',
                                })}
                              </p>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                              <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Summary</p>
                              <p className="mt-2 line-clamp-4 text-white/80">{myLatestEvaluation.summary}</p>
                            </div>
                          </>
                        ) : (
                          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-4">
                            No saved submission yet for this applicant and round. Your review will persist after refresh once you save it.
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  <FeedbackForm
                    applicants={assignedApplicantRecords}
                    initialApplicantId={selectedApplicantRecord.id}
                    initialRound={toAdminRound(selectedAssignment)}
                    initialEntry={
                      myLatestEvaluation
                        ? {
                            id: myLatestEvaluation.id,
                            applicantId: selectedApplicantRecord.id,
                            applicantName: selectedApplicant.name,
                            interviewerName: currentUser.name,
                            intervieweeName: selectedApplicant.name,
                            intervieweeGender: 'Other',
                            interviewerRole: toInterviewerRole(selectedAssignment),
                            round: toAdminRound(selectedAssignment),
                            leadershipScore: Math.min(3, Math.max(1, Math.round((myLatestEvaluation.rubric.teamwork + myLatestEvaluation.rubric.motivation) / 3))) as FeedbackEntry['leadershipScore'],
                            interestInOtcrScore: Math.min(3, Math.max(1, Math.round(myLatestEvaluation.rubric.motivation / 2))) as FeedbackEntry['interestInOtcrScore'],
                            behavioralPerformanceScore: Math.min(3, Math.max(1, Math.round(myLatestEvaluation.rubric.communication / 2))) as FeedbackEntry['behavioralPerformanceScore'],
                            businessAcumenScore: Math.min(3, Math.max(1, Math.round(myLatestEvaluation.rubric.problemSolving / 2))) as FeedbackEntry['businessAcumenScore'],
                            qualitativeCreativityScore: Math.min(3, Math.max(1, Math.round(myLatestEvaluation.rubric.problemSolving / 2))) as FeedbackEntry['qualitativeCreativityScore'],
                            quantitativeStructureScore: Math.min(3, Math.max(1, Math.round(myLatestEvaluation.rubric.structure / 2))) as FeedbackEntry['quantitativeStructureScore'],
                            casePerformanceScore: Math.min(3, Math.max(1, Math.round((myLatestEvaluation.rubric.problemSolving + myLatestEvaluation.rubric.structure) / 4))) as FeedbackEntry['casePerformanceScore'],
                            creativityConversationScore: Math.min(3, Math.max(1, Math.round((myLatestEvaluation.rubric.communication + myLatestEvaluation.rubric.teamwork) / 4))) as FeedbackEntry['creativityConversationScore'],
                            recommendation:
                              myLatestEvaluation.recommendation === 'yes'
                                ? 'YES'
                                : myLatestEvaluation.recommendation === 'lean_yes'
                                  ? 'LEAN YES'
                                  : myLatestEvaluation.recommendation === 'no'
                                    ? 'NO'
                                    : 'LEAN NO',
                            finalRoundSummary: myLatestEvaluation.concerns.join(', '),
                            overallPerformanceOverview: myLatestEvaluation.summary,
                            submittedAt: myLatestEvaluation.submittedAt,
                          }
                        : null
                    }
                    lockedInterviewerName={currentUser.name}
                    lockedIntervieweeName={selectedApplicant.name}
                    lockedInterviewerRole={toInterviewerRole(selectedAssignment)}
                    lockedRound={toAdminRound(selectedAssignment)}
                    onSubmitFeedback={handleSubmitFeedback}
                    submitting={submittingFeedback}
                  />
                </>
              ) : (
                <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(17,25,40,0.96),rgba(8,13,22,0.98))]">
                  <CardContent className="flex min-h-[320px] items-center justify-center p-8 text-center">
                    <div className="max-w-md space-y-3">
                      <Clock3 className="mx-auto h-10 w-10 text-cyan-200/80" />
                      <h2 className="text-2xl font-semibold text-white">No assigned interviews</h2>
                      <p className="text-sm leading-6 text-white/60">
                        Switch the mock signed-in interviewer or create assignments in `#/tech/assignments` to populate this workspace.
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
                  <Users className="h-4 w-4 text-cyan-200" />
                  Shared recruiting foundation
                </div>
                <p className="mt-2 text-sm leading-6 text-white/60">
                  Applicants, assignments, statuses, and submitted feedback all come from the shared frontend recruiting state under `src/features/recruiting/*`.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-white">
                  <UserCheck className="h-4 w-4 text-cyan-200" />
                  Interviewer-scoped form
                </div>
                <p className="mt-2 text-sm leading-6 text-white/60">
                  The interviewer name, interviewee, role, and round are auto-filled from the current mock user and the selected shared assignment.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-white">
                  <CheckCircle2 className="h-4 w-4 text-cyan-200" />
                  Refresh-safe local flow
                </div>
                <p className="mt-2 text-sm leading-6 text-white/60">
                  The store persists to localStorage, so assignments and submitted reviews remain available across refreshes without any backend.
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
