import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock3, Loader2, UserCheck, Users } from 'lucide-react';

import Footer from '@/components/Footer';
import Navigation from '@/components/Navigation';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  adminApi,
  type AdminEvaluationResponse,
  type InterviewAssignmentResponse,
} from '@/lib/admin-api';
import FeedbackForm from '@/pages/devops/components/admin/FeedbackForm';
import type { ApplicantRecord, FeedbackEntry, InterviewRound, InterviewerRole } from '@/pages/devops/components/admin/types';
import {
  formatAdminRoleLabel,
  hasBackendPermission,
  mapEvaluationToFeedbackEntry,
  mapInterviewerRole,
} from '@/pages/devops/recruiting-backend';

const toApplicantRecord = (assignment: InterviewAssignmentResponse): ApplicantRecord => ({
  id: assignment.application_id,
  name: assignment.applicant_name,
  email: assignment.applicant_email,
  interest: assignment.interest,
  resume_filename: null,
  resume_url: null,
  status: assignment.recruiting_status,
  final_decision: assignment.final_decision,
  cycle_name: assignment.cycle_name,
  created_at: assignment.assigned_at,
  reviewed_at: assignment.assigned_at,
  notes: assignment.notes,
  has_assessment_link: false,
  assessment_completed: false,
  assessment_token: null,
  focus_loss_events: 0,
  is_flagged: false,
  integrity_notes: null,
  archived_at: null,
  assigned_exec: null,
});

const latestEvaluationForAssignment = (
  evaluations: AdminEvaluationResponse[],
  assignment: InterviewAssignmentResponse
) =>
  evaluations
    .filter(
      (evaluation) =>
        evaluation.application_id === assignment.application_id &&
        (evaluation.round ?? 'Round 1') === assignment.round
    )
    .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime())[0] ?? null;

const DevopsMyInterviews = () => {
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const [assignments, setAssignments] = useState<InterviewAssignmentResponse[]>([]);
  const [evaluations, setEvaluations] = useState<AdminEvaluationResponse[]>([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const canReviewAssignedInterviews = hasBackendPermission(user, 'view_assigned_interviews');

  const loadInterviews = useCallback(async () => {
    if (!user || !canReviewAssignedInterviews) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [assignmentsResponse, evaluationsResponse] = await Promise.all([
        adminApi.listMyAssignedInterviews(),
        adminApi.listMyInterviews(),
      ]);
      setAssignments(assignmentsResponse);
      setEvaluations(evaluationsResponse);
    } catch (error) {
      toast({
        title: 'Could not load assigned interviews',
        description: error instanceof Error ? error.message : 'The backend did not return assigned interviews.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [canReviewAssignedInterviews, toast, user]);

  useEffect(() => {
    if (authLoading) return;
    void loadInterviews();
  }, [authLoading, loadInterviews]);

  useEffect(() => {
    if (assignments.length === 0) {
      setSelectedAssignmentId(null);
      return;
    }

    setSelectedAssignmentId((current) =>
      current && assignments.some((assignment) => assignment.id === current) ? current : assignments[0].id
    );
  }, [assignments]);

  const selectedAssignment = useMemo(
    () => assignments.find((assignment) => assignment.id === selectedAssignmentId) ?? assignments[0] ?? null,
    [assignments, selectedAssignmentId]
  );

  const selectedApplicantRecord = useMemo(
    () => (selectedAssignment ? toApplicantRecord(selectedAssignment) : null),
    [selectedAssignment]
  );

  const myLatestEvaluation = useMemo(
    () => (selectedAssignment ? latestEvaluationForAssignment(evaluations, selectedAssignment) : null),
    [evaluations, selectedAssignment]
  );

  const assignedApplicantRecords = useMemo(
    () => assignments.map(toApplicantRecord),
    [assignments]
  );

  const handleSubmitFeedback = async (entry: Omit<FeedbackEntry, 'id' | 'submittedAt'>) => {
    if (!selectedAssignment || !user) return;

    setSubmittingFeedback(true);
    try {
      const createdEvaluation = await adminApi.createEvaluation(selectedAssignment.application_id, {
        interviewer_name: user.name ?? user.email,
        interviewee_name: entry.intervieweeName,
        interviewee_gender: entry.intervieweeGender,
        interviewer_role: entry.interviewerRole,
        round: entry.round,
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
      });

      setEvaluations((current) => [createdEvaluation, ...current]);
      toast({
        title: 'Feedback saved',
        description: `${selectedAssignment.applicant_name} was updated in the backend for ${selectedAssignment.round}.`,
      });
    } catch (error) {
      toast({
        title: 'Could not save feedback',
        description: error instanceof Error ? error.message : 'The backend rejected this feedback update.',
        variant: 'destructive',
      });
    } finally {
      setSubmittingFeedback(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-white">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!canReviewAssignedInterviews) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <section className="px-4 pb-24 pt-28">
          <div className="mx-auto max-w-3xl">
            <Card className="border-white/10 bg-white/[0.03]">
              <CardContent className="p-10 text-center text-white/60">
                Your role does not have permission to view assigned interviews.
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
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.16),transparent_28%),radial-gradient(circle_at_85%_18%,rgba(250,204,21,0.10),transparent_20%),linear-gradient(180deg,rgba(4,10,20,0.94),rgba(3,8,17,1))]" />
        <div className="relative mx-auto max-w-[1360px] space-y-6">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.32em] text-cyan-200/70">Interviewer workspace</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">My interviews</h1>
            <p className="mt-3 text-sm leading-6 text-white/60">
              This workspace is now backed by the FastAPI API and scoped to the authenticated interviewer account.
            </p>
          </div>

          <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
            <div className="space-y-4">
              <Card className="border-white/10 bg-white/[0.04]">
                <CardHeader className="pb-3">
                  <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/70">Signed-in interviewer</p>
                  <CardTitle className="text-lg text-white">Live user context</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {user ? (
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/70">
                      <div className="font-medium text-white">{user.name ?? user.email}</div>
                      <div>{user.email}</div>
                      <div className="mt-1 uppercase tracking-[0.18em] text-cyan-200/70">{formatAdminRoleLabel(user.role)}</div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(17,25,40,0.96),rgba(8,13,22,0.98))]">
                <CardHeader className="border-b border-white/10 pb-3">
                  <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/65">Assigned interviewees</p>
                  <CardTitle className="text-lg text-white">{assignments.length} scoped applicants</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 p-4">
                  {assignments.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-white/55">
                      This account has no applicants assigned in the current round.
                    </div>
                  ) : (
                    assignments.map((assignment) => {
                      const isActive = assignment.id === selectedAssignment?.id;

                      return (
                        <button
                          key={assignment.id}
                          type="button"
                          onClick={() => setSelectedAssignmentId(assignment.id)}
                          className={[
                            'w-full rounded-2xl border px-4 py-4 text-left transition-all',
                            isActive
                              ? 'border-cyan-300/40 bg-cyan-400/10 shadow-[0_12px_30px_rgba(56,189,248,0.16)]'
                              : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]',
                          ].join(' ')}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="font-medium text-white">{assignment.applicant_name}</div>
                              <div className="mt-1 text-xs text-white/50">
                                {assignment.recruiting_status.replace(/_/g, ' ')} • {assignment.round}
                              </div>
                            </div>
                            <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-cyan-100">
                              {mapInterviewerRole(assignment.role)}
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
              {selectedAssignment && selectedApplicantRecord && user ? (
                <>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]">
                    <Card className="border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.14),transparent_32%),linear-gradient(180deg,rgba(15,22,36,0.98),rgba(8,13,24,0.98))]">
                      <CardHeader className="pb-3">
                        <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/70">Current review</p>
                        <CardTitle className="text-2xl text-white">{selectedAssignment.applicant_name}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                            <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Interview round</p>
                            <p className="mt-2 text-base font-medium text-white">{selectedAssignment.round}</p>
                          </div>
                          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                            <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Your assignment</p>
                            <p className="mt-2 text-base font-medium text-white">{mapInterviewerRole(selectedAssignment.role)} interviewer</p>
                          </div>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-white/65">
                          {selectedAssignment.interest ?? selectedAssignment.notes ?? 'No applicant summary is available for this record yet.'}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-white/10 bg-white/[0.03]">
                      <CardHeader className="pb-3">
                        <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/70">Persisted feedback</p>
                        <CardTitle className="text-lg text-white">Your latest submission</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 text-sm text-white/65">
                        {myLatestEvaluation ? (
                          <>
                            <div className="flex items-center gap-2 text-white">
                              <CheckCircle2 className="h-4 w-4 text-cyan-200" />
                              Review saved for {myLatestEvaluation.round ?? selectedAssignment.round}
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                              <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Submitted</p>
                              <p className="mt-2 text-white">
                                {new Date(myLatestEvaluation.created_at).toLocaleString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: 'numeric',
                                  minute: '2-digit',
                                })}
                              </p>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                              <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Summary</p>
                              <p className="mt-2 line-clamp-4 text-white/80">
                                {myLatestEvaluation.overall_performance_overview ?? myLatestEvaluation.comments ?? 'No summary provided.'}
                              </p>
                            </div>
                          </>
                        ) : (
                          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-4">
                            No saved submission yet for this applicant and round.
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  <FeedbackForm
                    applicants={assignedApplicantRecords}
                    initialApplicantId={selectedApplicantRecord.id}
                    initialRound={selectedAssignment.round as InterviewRound}
                    initialEntry={myLatestEvaluation ? mapEvaluationToFeedbackEntry(myLatestEvaluation) : null}
                    lockedInterviewerName={user.name ?? user.email}
                    lockedIntervieweeName={selectedAssignment.applicant_name}
                    lockedInterviewerRole={mapInterviewerRole(selectedAssignment.role) as InterviewerRole}
                    lockedRound={selectedAssignment.round as InterviewRound}
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
                        Once this account is assigned to an applicant in `#/tech/assignments`, the review form will appear here.
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
                  Backend-backed assignments
                </div>
                <p className="mt-2 text-sm leading-6 text-white/60">
                  Applicant assignments are loaded from the FastAPI backend rather than the local recruiting store.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-white">
                  <UserCheck className="h-4 w-4 text-cyan-200" />
                  Authenticated interviewer scope
                </div>
                <p className="mt-2 text-sm leading-6 text-white/60">
                  The interviewer name, interviewee, role, and round are derived from the signed-in Microsoft account and persisted backend assignment.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-white">
                  <CheckCircle2 className="h-4 w-4 text-cyan-200" />
                  Persisted feedback flow
                </div>
                <p className="mt-2 text-sm leading-6 text-white/60">
                  Submitted reviews now post to the backend evaluation endpoint and remain available across refreshes.
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
