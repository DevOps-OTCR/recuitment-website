import { CheckCircle2, Clock3, XCircle } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { feedbackMetricFields } from './types';

interface StatusSummaryProps {
  yesCount: number;
  noCount: number;
  maybeCount: number;
  statusLabel: string;
  averageScore: number | null;
  comparisonAverage?: number | null;
}

const toneByStatus: Record<string, string> = {
  approved: 'text-emerald-300 border-emerald-400/30 bg-emerald-500/10',
  yes: 'text-emerald-300 border-emerald-400/30 bg-emerald-500/10',
  rejected: 'text-red-300 border-red-400/30 bg-red-500/10',
  no: 'text-red-300 border-red-400/30 bg-red-500/10',
  pending: 'text-amber-200 border-amber-400/30 bg-amber-500/10',
  maybe: 'text-sky-200 border-sky-400/30 bg-sky-500/10',
};

const StatusSummary = ({
  yesCount,
  noCount,
  maybeCount,
  statusLabel,
  averageScore,
  comparisonAverage = null,
}: StatusSummaryProps) => {
  const normalized = statusLabel.toLowerCase();
  const statusTone = toneByStatus[normalized] ?? 'text-slate-200 border-white/10 bg-white/5';

  const stats = [
    { label: 'Yes', value: yesCount, icon: CheckCircle2, tone: 'text-emerald-300' },
    { label: 'No', value: noCount, icon: XCircle, tone: 'text-red-300' },
    { label: 'Maybe', value: maybeCount, icon: Clock3, tone: 'text-sky-200' },
  ];

  const scorePercent = averageScore === null ? 0 : Math.max(0, Math.min(100, (averageScore / 3) * 100));
  const maxTotalScore = feedbackMetricFields.length * 3;
  const totalScore = averageScore === null ? null : averageScore * feedbackMetricFields.length;
  const averageTotalScore =
    comparisonAverage === null ? null : comparisonAverage * feedbackMetricFields.length;
  const scoreDelta =
    totalScore === null || averageTotalScore === null ? null : totalScore - averageTotalScore;
  const deltaTone =
    scoreDelta === null ? 'text-white/40' : scoreDelta > 0.25 ? 'text-emerald-300' : scoreDelta < -0.25 ? 'text-rose-300' : 'text-white/45';

  return (
    <Card className="overflow-hidden border-white/10 bg-[linear-gradient(180deg,rgba(18,29,47,0.96),rgba(10,16,28,0.98))] shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
      <CardContent className="p-4">
        <div className="flex w-full items-center gap-2 overflow-hidden">
          <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.03]">
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: `conic-gradient(rgba(103,232,249,0.95) ${scorePercent}%, rgba(255,255,255,0.08) ${scorePercent}% 100%)`,
                mask: 'radial-gradient(farthest-side, transparent calc(100% - 5px), white 0)',
                WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 5px), white 0)',
              }}
            />
            <span className="text-xs font-semibold text-white">
              {totalScore === null ? `--/${maxTotalScore}` : `${totalScore.toFixed(1)}/${maxTotalScore}`}
            </span>
          </div>

          <div className="min-w-[112px] shrink-0">
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Composite</p>
            <p className="mt-1 text-2xl font-semibold text-cyan-300">
              {averageScore === null ? '--' : averageScore.toFixed(1)}
              <span className="ml-1 text-lg font-medium text-white/35">/3.0</span>
            </p>
          </div>

          {stats.map(({ label, value, icon: Icon, tone }) => (
            <div key={label} className="min-w-0 shrink rounded-2xl border border-white/8 bg-white/5 px-3 py-2.5">
              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-white/45">{label}</p>
                <div className="mt-1 flex items-center gap-2">
                  <Icon className={cn('h-4 w-4 shrink-0', tone)} />
                  <p className="text-xl font-semibold leading-none text-white">{value}</p>
                </div>
              </div>
            </div>
          ))}

          <div className="min-w-[92px] text-right">
            <p className="text-[10px] uppercase tracking-[0.16em] text-white/40">vs avg</p>
            <p className={cn('mt-1 text-lg font-semibold', deltaTone)}>
              {scoreDelta === null ? '--' : `${scoreDelta >= 0 ? '+' : ''}${scoreDelta.toFixed(1)}`}
            </p>
          </div>

          <div className={cn('ml-auto shrink-0 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]', statusTone)}>
            {statusLabel}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatusSummary;
