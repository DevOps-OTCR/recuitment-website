import { CheckCircle2, Clock3, XCircle } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatusSummaryProps {
  yesCount: number;
  noCount: number;
  maybeCount: number;
  statusLabel: string;
  relativeScore: number | null;
  relativeScoreTag: string;
}

const toneByStatus: Record<string, string> = {
  approved: 'text-emerald-300 border-emerald-400/30 bg-emerald-500/10',
  yes: 'text-emerald-300 border-emerald-400/30 bg-emerald-500/10',
  rejected: 'text-red-300 border-red-400/30 bg-red-500/10',
  no: 'text-red-300 border-red-400/30 bg-red-500/10',
  pending: 'text-amber-200 border-amber-400/30 bg-amber-500/10',
  maybe: 'text-sky-200 border-sky-400/30 bg-sky-500/10',
  accepted: 'text-emerald-300 border-emerald-400/30 bg-emerald-500/10',
  'passed round 2': 'text-emerald-200 border-emerald-300/25 bg-emerald-400/10',
  'passed round 1': 'text-cyan-200 border-cyan-300/30 bg-cyan-400/10',
  'pending round 1': 'text-sky-200 border-sky-400/30 bg-sky-500/10',
  'failed round 1': 'text-rose-200 border-rose-400/30 bg-rose-500/10',
  'failed round 2': 'text-rose-300 border-rose-400/30 bg-rose-500/10',
  'not moved to round 1': 'text-white/75 border-white/10 bg-white/5',
};

const StatusSummary = ({
  yesCount,
  noCount,
  maybeCount,
  statusLabel,
  relativeScore,
  relativeScoreTag,
}: StatusSummaryProps) => {
  const normalized = statusLabel.toLowerCase();
  const statusTone = toneByStatus[normalized] ?? 'text-slate-200 border-white/10 bg-white/5';

  const stats = [
    { label: 'Yes', value: yesCount, icon: CheckCircle2, tone: 'text-emerald-300' },
    { label: 'No', value: noCount, icon: XCircle, tone: 'text-red-300' },
    { label: 'Maybe', value: maybeCount, icon: Clock3, tone: 'text-sky-200' },
  ];
  const deltaTone =
    relativeScore === null ? 'text-white/40' : relativeScore > 0 ? 'text-emerald-300' : relativeScore < 0 ? 'text-rose-300' : 'text-white/45';

  return (
    <Card className="overflow-hidden border-white/10 bg-[linear-gradient(180deg,rgba(18,29,47,0.96),rgba(10,16,28,0.98))] shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
      <CardContent className="p-3 sm:p-4">
        <div className="flex w-full flex-wrap items-center gap-3 overflow-hidden">
          {stats.map(({ label, value, icon: Icon, tone }) => (
            <div key={label} className="min-w-[88px] shrink rounded-2xl border border-white/8 bg-white/5 px-3 py-2">
              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-white/45">{label}</p>
                <div className="mt-1 flex items-center gap-2">
                  <Icon className={cn('h-4 w-4 shrink-0', tone)} />
                  <p className="text-xl font-semibold leading-none text-white">{value}</p>
                </div>
              </div>
            </div>
          ))}

          <div className="min-w-[120px] text-right sm:ml-auto">
            <p className="text-[10px] uppercase tracking-[0.16em] text-white/40">Relative score</p>
            <p className={cn('mt-1 text-lg font-semibold', deltaTone)}>
              {relativeScore === null ? '--' : `${relativeScore >= 0 ? '+' : ''}${relativeScore.toFixed(1)}`}
            </p>
            <span className="mt-2 inline-flex rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/65">
              {relativeScoreTag}
            </span>
          </div>

          <div className={cn('shrink-0 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] sm:ml-0', statusTone)}>
            {statusLabel}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatusSummary;
