import { Search, UserRound } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

import { feedbackMetricFields, type ApplicantRecord, type InterviewRound } from './types';

interface ConsultantListProps {
  applicants: ApplicantRecord[];
  selectedApplicantId: number | null;
  searchValue: string;
  onSearchChange: (value: string) => void;
  rounds: InterviewRound[];
  activeRound: InterviewRound;
  onRoundChange: (round: InterviewRound) => void;
  onSelectApplicant: (id: number) => void;
  getStatusLabel: (applicant: ApplicantRecord) => string;
  getRoundCompositeScore: (applicantId: number) => number | null;
  overallRoundCompositeScore: number | null;
}

const ConsultantList = ({
  applicants,
  selectedApplicantId,
  searchValue,
  onSearchChange,
  rounds,
  activeRound,
  onRoundChange,
  onSelectApplicant,
  getStatusLabel,
  getRoundCompositeScore,
  overallRoundCompositeScore,
}: ConsultantListProps) => {
  const maxTotalScore = feedbackMetricFields.length * 3;
  const scoreValues = applicants
    .map((applicant) => ({ applicantId: applicant.id, score: getRoundCompositeScore(applicant.id) }))
    .filter((entry): entry is { applicantId: number; score: number } => entry.score !== null);

  const getScoreToneClassName = (applicantId: number, score: number) => {
    const comparisonPool = scoreValues.filter((entry) => entry.applicantId !== applicantId);
    const benchmark =
      comparisonPool.length > 0
        ? comparisonPool.reduce((sum, entry) => sum + entry.score, 0) / comparisonPool.length
        : overallRoundCompositeScore;

    if (benchmark === null) return 'border-cyan-300/20 bg-cyan-300/10 text-cyan-100';

    if (score > benchmark + 0.75) return 'border-emerald-300/25 bg-emerald-400/10 text-emerald-100';
    if (score < benchmark - 0.75) return 'border-red-300/25 bg-red-400/10 text-red-100';
    return 'border-amber-300/25 bg-amber-400/10 text-amber-100';
  };

  return (
    <div className="flex h-full flex-col rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(14,23,37,0.96),rgba(10,15,27,0.98))] shadow-[0_18px_50px_rgba(0,0,0,0.32)]">
      <div className="border-b border-white/10 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/65">Applicants</p>
            <div className="mt-3 inline-flex rounded-xl border border-white/10 bg-slate-950/30 p-1">
              {rounds.map((round) => (
                <button
                  key={round}
                  type="button"
                  onClick={() => onRoundChange(round)}
                  className={cn(
                    'rounded-lg px-3 py-2 text-sm transition-colors',
                    activeRound === round ? 'bg-cyan-300 text-slate-950' : 'text-white/70 hover:text-white'
                  )}
                >
                  {round}
                </button>
              ))}
            </div>
          </div>
          {overallRoundCompositeScore !== null ? (
            <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold tracking-[0.18em] text-white/70">
              Avg {overallRoundCompositeScore.toFixed(1)}/{maxTotalScore}
            </div>
          ) : null}
        </div>
        <div className="relative mt-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <Input
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search by name"
            className="h-11 rounded-xl border-white/10 bg-white/5 pl-10 text-white placeholder:text-white/35"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {applicants.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-6 text-sm text-white/55">
            No applicants match this search.
          </div>
        ) : (
          <div className="space-y-2">
            {applicants.map((applicant) => {
              const isActive = applicant.id === selectedApplicantId;
              const statusLabel = getStatusLabel(applicant);
              const roundCompositeScore = getRoundCompositeScore(applicant.id);

              return (
                <button
                  key={applicant.id}
                  type="button"
                  onClick={() => onSelectApplicant(applicant.id)}
                  className={cn(
                    'w-full rounded-2xl border px-4 py-3 text-left transition-all',
                    isActive
                      ? 'border-cyan-300/40 bg-cyan-400/10 shadow-[0_10px_30px_rgba(56,189,248,0.18)]'
                      : 'border-white/8 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5">
                          <UserRound className="h-4 w-4 text-cyan-200" />
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="truncate font-medium text-white">{applicant.name}</p>
                            {roundCompositeScore !== null ? (
                              <span className={cn(
                                'shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-[0.18em]',
                                getScoreToneClassName(applicant.id, roundCompositeScore)
                              )}>
                                {roundCompositeScore.toFixed(1)}
                              </span>
                            ) : null}
                          </div>
                          <p className="truncate text-xs text-white/45">{applicant.cycle_name ?? 'No cycle'}</p>
                        </div>
                      </div>
                    </div>
                    <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-white/60">
                      {statusLabel}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsultantList;
