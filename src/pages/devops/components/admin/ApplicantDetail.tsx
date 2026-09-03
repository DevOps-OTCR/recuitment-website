import { ExternalLink, FileText, ShieldAlert, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import FeedbackForm from './FeedbackForm';
import StatusSummary from './StatusSummary';
import type { ApplicantRecord, FeedbackEntry } from './types';

interface ApplicantDetailProps {
  applicant: ApplicantRecord;
  feedbackEntries: FeedbackEntry[];
  yesCount: number;
  noCount: number;
  maybeCount: number;
  overallStatus: string;
  averageScore: number | null;
  onOpenResume: (applicant: ApplicantRecord) => void;
  onSubmitFeedback: (entry: Omit<FeedbackEntry, 'id' | 'submittedAt'>) => void;
}

const ApplicantDetail = ({
  applicant,
  feedbackEntries,
  yesCount,
  noCount,
  maybeCount,
  overallStatus,
  averageScore,
  onOpenResume,
  onSubmitFeedback,
}: ApplicantDetailProps) => (
  <div className="space-y-5">
    <Card className="overflow-hidden border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.16),transparent_35%),linear-gradient(180deg,rgba(15,22,36,0.98),rgba(8,13,24,0.98))] shadow-[0_28px_80px_rgba(0,0,0,0.35)]">
      <CardHeader className="border-b border-white/10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/65">Applicant detail</p>
            <CardTitle className="mt-2 text-3xl text-white">{applicant.name}</CardTitle>
            <p className="mt-2 max-w-2xl text-sm text-white/60">{applicant.interest ?? 'No written interest statement on file.'}</p>
          </div>
          <div className="grid gap-2 text-sm text-white/65">
            <div><span className="text-white/35">Cycle</span> {applicant.cycle_name ?? 'Unassigned'}</div>
            <div><span className="text-white/35">Assigned exec</span> {applicant.assigned_exec ?? 'Unassigned'}</div>
            <div><span className="text-white/35">Backend status</span> {applicant.status}</div>
            <div><span className="text-white/35">Email</span> {applicant.email}</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 p-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-white/45">Resume</p>
              <h3 className="mt-2 text-lg font-semibold text-white">{applicant.resume_filename ?? 'Resume placeholder'}</h3>
            </div>
            <Button
              type="button"
              variant="outline"
              className="border-white/10 bg-white/5 text-white hover:bg-white/10"
              onClick={() => onOpenResume(applicant)}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Open resume
            </Button>
          </div>
          <div className="mt-5 rounded-[20px] border border-dashed border-white/10 bg-black/20 p-6">
            <div className="flex items-center gap-3 text-white/65">
              <FileText className="h-5 w-5 text-cyan-200" />
              <span>
                {applicant.resume_filename
                  ? 'Resume is available for review from the admin panel.'
                  : 'No uploaded resume found. This area acts as the placeholder section requested for the MVP.'}
              </span>
            </div>
            {applicant.notes && (
              <p className="mt-4 text-sm leading-6 text-white/55">{applicant.notes}</p>
            )}
          </div>
        </div>

        <StatusSummary
          yesCount={yesCount}
          noCount={noCount}
          maybeCount={maybeCount}
          statusLabel={overallStatus}
          averageScore={averageScore}
        />
      </CardContent>
    </Card>

    <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
      <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(17,25,40,0.96),rgba(8,13,22,0.98))]">
        <CardHeader>
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/65">Evaluation summary</p>
          <CardTitle className="text-xl text-white">Existing feedback</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {feedbackEntries.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-5 text-sm text-white/55">
              No interviewer feedback saved yet. Submit the form to add the first review.
            </div>
          ) : (
            feedbackEntries
              .slice()
              .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
              .map((entry) => (
                <div key={entry.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-white">{entry.interviewerName}</p>
                      <p className="text-xs uppercase tracking-[0.2em] text-white/45">
                        {entry.round} • {new Date(entry.submittedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-cyan-100">
                      {entry.recommendation}
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-white/60">
                    <div>Culture fit: <span className="text-white">{entry.cultureFitScore}/5</span></div>
                    <div>Technical: <span className="text-white">{entry.technicalScore}/5</span></div>
                    <div>Communication: <span className="text-white">{entry.communicationScore}/5</span></div>
                    <div>Leadership: <span className="text-white">{entry.leadershipPotentialScore}/5</span></div>
                  </div>
                  {entry.strengths && <p className="mt-4 text-sm text-white/70"><span className="text-white">Strengths:</span> {entry.strengths}</p>}
                  {entry.concerns && <p className="mt-2 text-sm text-white/60"><span className="text-white">Concerns:</span> {entry.concerns}</p>}
                  {entry.comments && <p className="mt-2 text-sm text-white/50">{entry.comments}</p>}
                </div>
              ))
          )}

          <div className="rounded-2xl border border-white/8 bg-black/20 p-4 text-sm text-white/55">
            <div className="flex items-center gap-2 text-white/70">
              <ShieldAlert className="h-4 w-4 text-cyan-200" />
              Integrity and interview notes
            </div>
            <p className="mt-2">Focus loss events: {applicant.focus_loss_events}</p>
            <p className="mt-1">{applicant.is_flagged ? 'Flagged for integrity review.' : 'No integrity flag.'}</p>
            {applicant.integrity_notes && <p className="mt-2 text-amber-200/90">{applicant.integrity_notes}</p>}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-5">
        <FeedbackForm
          applicantId={applicant.id}
          defaultAssignedExec={applicant.assigned_exec ?? 'Unassigned'}
          onSubmitFeedback={onSubmitFeedback}
        />
        <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(17,25,40,0.96),rgba(8,13,22,0.98))]">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <Sparkles className="mt-1 h-5 w-5 text-cyan-200" />
              <div>
                <p className="font-medium text-white">How status is derived</p>
                <p className="mt-2 text-sm leading-6 text-white/55">
                  Backend application status is shown when it is already definitive. Otherwise the admin MVP uses saved interviewer recommendations to compute a working review status, and two “No” votes immediately mark the applicant as Rejected.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
);

export default ApplicantDetail;
