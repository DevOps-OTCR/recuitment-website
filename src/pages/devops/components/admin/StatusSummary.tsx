import { CheckCircle2, Clock3, MessageSquareWarning, XCircle } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatusSummaryProps {
  yesCount: number;
  noCount: number;
  maybeCount: number;
  statusLabel: string;
  averageScore: number | null;
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
}: StatusSummaryProps) => {
  const normalized = statusLabel.toLowerCase();
  const statusTone = toneByStatus[normalized] ?? 'text-slate-200 border-white/10 bg-white/5';

  const stats = [
    { label: 'Yes', value: yesCount, icon: CheckCircle2, tone: 'text-emerald-300' },
    { label: 'No', value: noCount, icon: XCircle, tone: 'text-red-300' },
    { label: 'Maybe', value: maybeCount, icon: Clock3, tone: 'text-sky-200' },
  ];

  return (
    <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(18,29,47,0.96),rgba(10,16,28,0.98))] shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/70">Vote summary</p>
          <CardTitle className="mt-2 text-xl text-white">Review snapshot</CardTitle>
        </div>
        <div className={cn('rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]', statusTone)}>
          {statusLabel}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          {stats.map(({ label, value, icon: Icon, tone }) => (
            <div key={label} className="rounded-2xl border border-white/8 bg-white/5 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-[0.2em] text-white/55">{label}</span>
                <Icon className={cn('h-4 w-4', tone)} />
              </div>
              <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
            </div>
          ))}
        </div>
        <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
          <div className="flex items-center gap-2 text-sm text-white/70">
            <MessageSquareWarning className="h-4 w-4 text-cyan-200" />
            Composite rubric score
          </div>
          <p className="mt-2 text-2xl font-semibold text-white">
            {averageScore === null ? 'No scores yet' : `${averageScore.toFixed(1)} / 3`}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatusSummary;
