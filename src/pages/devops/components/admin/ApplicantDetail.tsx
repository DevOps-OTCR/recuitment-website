import { CheckCircle2, ExternalLink, FileText, HelpCircle, XCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import StatusSummary from './StatusSummary';
import { feedbackMetricFields, formatRatingBand, type ApplicantRecord, type FeedbackEntry, type InterviewRound } from './types';

const recommendationToneClasses: Record<string, string> = {
  YES: 'border-emerald-300/30 bg-emerald-400/10 text-emerald-100',
  'LEAN YES': 'border-emerald-300/30 bg-emerald-400/10 text-emerald-100',
  MAYBE: 'border-amber-300/25 bg-amber-400/10 text-amber-100',
  'LEAN NO': 'border-rose-300/25 bg-rose-400/10 text-rose-100',
  NO: 'border-rose-300/25 bg-rose-400/10 text-rose-100',
};

const recommendationAccentClasses: Record<string, string> = {
  YES: 'text-emerald-300',
  'LEAN YES': 'text-emerald-300',
  MAYBE: 'text-violet-200',
  'LEAN NO': 'text-rose-300',
  NO: 'text-rose-300',
};

const recommendationIcons: Record<string, typeof CheckCircle2> = {
  YES: CheckCircle2,
  'LEAN YES': CheckCircle2,
  MAYBE: HelpCircle,
  'LEAN NO': XCircle,
  NO: XCircle,
};

interface ApplicantDetailProps {
  applicant: ApplicantRecord;
  feedbackEntries: FeedbackEntry[];
  yesCount: number;
  noCount: number;
  maybeCount: number;
  overallStatus: string;
  averageScore: number | null;
  selectedRound: InterviewRound;
  availableRounds: InterviewRound[];
  onSelectRound: (round: InterviewRound) => void;
  onOpenResume: (applicant: ApplicantRecord) => void;
}

const ApplicantDetail = ({
  applicant,
  feedbackEntries,
  yesCount,
  noCount,
  maybeCount,
  overallStatus,
  averageScore,
  selectedRound,
  availableRounds,
  onSelectRound,
  onOpenResume,
}: ApplicantDetailProps) => {
  const sortedEntries = feedbackEntries
    .slice()
    .sort((a, b) => {
      const roleWeight = (entry: FeedbackEntry) => (entry.interviewerRole === 'Primary' ? 0 : 1);
      const roleDifference = roleWeight(a) - roleWeight(b);
      if (roleDifference !== 0) return roleDifference;
      return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
    });

  return (
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
            <div><span className="text-white/35">Email</span> {applicant.email}</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 p-6 lg:grid-cols-[auto_minmax(0,1fr)]">
        <div className="flex items-center">
          <Button
            type="button"
            variant="outline"
            className="h-14 border-white/10 bg-white/5 px-6 text-white hover:bg-white/10"
            onClick={() => onOpenResume(applicant)}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            View resume
          </Button>
        </div>

        <div>
          <StatusSummary
            yesCount={yesCount}
            noCount={noCount}
            maybeCount={maybeCount}
            statusLabel={overallStatus}
            averageScore={averageScore}
          />
        </div>
      </CardContent>
    </Card>

    <div>
      <div className="inline-flex rounded-2xl border border-white/10 bg-white/[0.03] p-1">
        {availableRounds.map((round) => (
          <button
            key={round}
            type="button"
            onClick={() => onSelectRound(round)}
            className={
              round === selectedRound
                ? 'rounded-xl bg-cyan-300 px-8 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-950'
                : 'rounded-xl px-8 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white/60 transition-colors hover:text-white'
            }
          >
            {round}
          </button>
        ))}
      </div>
      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200/70">
        Detailed evaluation feedback
      </p>
    </div>

    <div>
      <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(17,25,40,0.96),rgba(8,13,22,0.98))]">
        <CardHeader>
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/65">Evaluation summary</p>
          <CardTitle className="text-xl text-white">{selectedRound} feedback</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {feedbackEntries.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-5 text-sm text-white/55">
              No {selectedRound.toLowerCase()} feedback saved yet.
            </div>
          ) : (
            <div className={sortedEntries.length === 2 ? 'grid gap-4 xl:grid-cols-2' : 'space-y-3'}>
              {sortedEntries.map((entry) => {
                const VoteIcon = recommendationIcons[entry.recommendation] ?? HelpCircle;
                const voteAccent = recommendationAccentClasses[entry.recommendation] ?? 'text-white/70';

                return (
                  <div
                    key={entry.id}
                    className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-5 shadow-[0_20px_40px_rgba(0,0,0,0.18)]"
                  >
                    <div className="flex items-start justify-between gap-4 border-b border-white/8 pb-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm font-semibold text-white/70">
                          {entry.interviewerName.slice(0, 2).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-lg font-semibold text-white">{entry.interviewerName}</p>
                          <p className="mt-0.5 whitespace-nowrap text-[11px] uppercase tracking-[0.2em] text-white/45">
                            {entry.interviewerRole} interviewer
                          </p>
                        </div>
                      </div>
                      <div className={`flex shrink-0 items-center gap-1.5 text-sm font-semibold ${voteAccent}`}>
                        <VoteIcon className="h-4 w-4" />
                        <span>Voted: {entry.recommendation}</span>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] uppercase tracking-[0.16em] text-white/42">
                      <span>{new Date(entry.submittedAt).toLocaleDateString()}</span>
                    </div>

                    <div className="mt-5 grid gap-x-5 gap-y-4 md:grid-cols-2">
                      {feedbackMetricFields.map((field) => {
                        const score = entry[field.key];

                        return (
                          <div key={field.key}>
                            <div className="flex items-start justify-between gap-3">
                              <p
                                className="min-w-0 min-h-[2.5rem] overflow-hidden whitespace-pre-line text-[11px] uppercase tracking-[0.16em] text-white/40"
                                style={{
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                }}
                              >
                                {field.label}
                              </p>
                              <p className="shrink-0 whitespace-nowrap text-sm font-semibold text-cyan-200">
                                {formatRatingBand(score)}
                                <span className="ml-1 text-[10px] font-medium text-white/30">/ 3</span>
                              </p>
                            </div>
                            <div className="mt-2 h-[3px] rounded-full bg-white/10">
                              <div className="h-full rounded-full bg-cyan-300" style={{ width: `${(score / 3) * 100}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-5 grid gap-3 md:grid-cols-2">
                      <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-cyan-100/65">Push areas</p>
                        <p className="mt-2 text-sm leading-6 text-white/60">
                          {entry.finalRoundSummary || 'No additional push areas recorded.'}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-cyan-100/65">Overall overview</p>
                        <p className="mt-2 text-sm leading-6 text-white/60">
                          {entry.overallPerformanceOverview || 'No overall overview recorded.'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  </div>
);
};

export default ApplicantDetail;
