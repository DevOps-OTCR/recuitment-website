import { useMemo, useState } from 'react';
import { Database, HardDriveDownload, Table2, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

import {
  feedbackMetricFields,
  formatRatingBand,
  databaseTableLabels,
  type ApplicantRecord,
  type DatabaseOverview,
  type DatabaseTableName,
  type DatabaseTablePreview,
  type FeedbackEntry,
} from './types';

interface DatabaseViewProps {
  overview: DatabaseOverview | null;
  preview: DatabaseTablePreview | null;
  selectedTable: DatabaseTableName;
  loading: boolean;
  error: string | null;
  applicants: ApplicantRecord[];
  feedbackByApplicant: Record<number, FeedbackEntry[]>;
  onSelectTable: (table: DatabaseTableName) => void;
  onRefresh: () => void;
}

const renderCellValue = (value: unknown) => {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const normalizeName = (value: string) => value.trim().replace(/\s+/g, ' ').toLowerCase();

const parseNumericId = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) return Number(value);
  return null;
};

const formatSubmittedAt = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
};

const DatabaseView = ({
  overview,
  preview,
  selectedTable,
  loading,
  error,
  applicants,
  feedbackByApplicant,
  onSelectTable,
  onRefresh,
}: DatabaseViewProps) => {
  const [feedbackModalApplicantId, setFeedbackModalApplicantId] = useState<number | null>(null);

  const applicantsById = useMemo(
    () => new Map(applicants.map((applicant) => [applicant.id, applicant])),
    [applicants]
  );
  const applicantsByName = useMemo(
    () => new Map(applicants.map((applicant) => [normalizeName(applicant.name), applicant])),
    [applicants]
  );

  const resolveApplicantForRow = (row: Record<string, unknown>) => {
    const directApplicationId =
      parseNumericId(row.application_id) ??
      parseNumericId(row.applicant_id) ??
      (selectedTable === 'applications' ? parseNumericId(row.id) : null);

    if (directApplicationId && applicantsById.has(directApplicationId)) {
      return applicantsById.get(directApplicationId) ?? null;
    }

    const applicantNameCandidates = [
      row.applicant_name,
      row.interviewee_name,
      row.name,
      row.full_name,
    ].filter((value): value is string => typeof value === 'string' && value.trim().length > 0);

    for (const candidate of applicantNameCandidates) {
      const match = applicantsByName.get(normalizeName(candidate));
      if (match) return match;
    }

    return null;
  };

  const feedbackModalApplicant =
    feedbackModalApplicantId !== null ? applicantsById.get(feedbackModalApplicantId) ?? null : null;
  const feedbackModalEntries =
    feedbackModalApplicantId !== null ? feedbackByApplicant[feedbackModalApplicantId] ?? [] : [];

  return (
    <>
      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <div className="space-y-5">
          <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(17,25,40,0.96),rgba(8,13,22,0.98))]">
            <CardHeader>
              <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/65">Persistence</p>
              <CardTitle className="text-xl text-white">Database overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {overview ? (
                <>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                    <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-white/40">Database</p>
                      <p className="mt-2 text-lg font-medium text-white">{overview.persistence.database}</p>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-white/40">Storage</p>
                      <p className="mt-2 text-lg font-medium text-white">{overview.persistence.storage}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {overview.tables.map((table) => (
                      <button
                        key={table.table}
                        type="button"
                        onClick={() => onSelectTable(table.table)}
                        className={cn(
                          'flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition-all',
                          selectedTable === table.table
                            ? 'border-cyan-300/45 bg-cyan-400/10 text-white'
                            : 'border-white/8 bg-white/[0.03] text-white/65 hover:border-white/20 hover:bg-white/[0.06]'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Table2 className="h-4 w-4 text-cyan-200" />
                          <span>{databaseTableLabels[table.table]}</span>
                        </div>
                        <span className="text-sm text-white/45">{table.count}</span>
                      </button>
                    ))}
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-white/10 bg-white/5 text-white hover:bg-white/10"
                    onClick={onRefresh}
                    disabled={loading}
                  >
                    <HardDriveDownload className="h-4 w-4" />
                    Refresh database preview
                  </Button>
                </>
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-5 text-sm text-white/55">
                  Database preview has not loaded yet.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(17,25,40,0.96),rgba(8,13,22,0.98))]">
          <CardHeader>
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-400/10 text-cyan-100">
                <Database className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/65">Table preview</p>
                <CardTitle className="text-xl text-white">{databaseTableLabels[selectedTable]}</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {error ? (
              <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                {error}
              </div>
            ) : null}

            {preview ? (
              <>
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white/60">
                  Showing the latest <span className="text-white">{preview.rows.length}</span> rows out of{' '}
                  <span className="text-white">{preview.count}</span> total rows in{' '}
                  <span className="text-white">{preview.table}</span>.
                </div>

                <div className="max-h-[720px] space-y-4 overflow-y-auto pr-1">
                  {preview.rows.length === 0 ? (
                    <div className="rounded-[24px] border border-white/10 bg-white/[0.03] px-4 py-8 text-center text-white/50">
                      No rows found in this table.
                    </div>
                  ) : (
                    preview.rows.map((row, index) => {
                      const applicant = resolveApplicantForRow(row);
                      const applicantFeedback = applicant ? feedbackByApplicant[applicant.id] ?? [] : [];

                      return (
                        <div
                          key={`${preview.table}-${index}`}
                          className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5"
                        >
                          <div className="mb-4 flex flex-col gap-4 border-b border-white/8 pb-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="space-y-3">
                              <div className="flex flex-wrap items-center gap-3">
                                <p className="text-xs uppercase tracking-[0.22em] text-cyan-200/65">
                                  Row {preview.rows.length - index}
                                </p>
                                <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-white/55">
                                  {preview.table}
                                </span>
                              </div>

                              {applicant ? (
                                <div>
                                  <p className="text-xs uppercase tracking-[0.18em] text-white/35">Candidate</p>
                                  <p className="mt-1 text-lg font-medium text-white">{applicant.name}</p>
                                  <p className="mt-1 text-sm text-white/50">
                                    {applicant.email} {applicant.cycle_name ? `· ${applicant.cycle_name}` : ''}
                                  </p>
                                </div>
                              ) : (
                                <div>
                                  <p className="text-xs uppercase tracking-[0.18em] text-white/35">Candidate</p>
                                  <p className="mt-1 text-base text-white/55">No linked applicant found for this row.</p>
                                </div>
                              )}
                            </div>

                            {applicant && applicantFeedback.length > 0 ? (
                              <Button
                                type="button"
                                variant="outline"
                                className="border-cyan-300/30 bg-cyan-400/10 text-white hover:bg-cyan-400/15"
                                onClick={() => setFeedbackModalApplicantId(applicant.id)}
                              >
                                View feedback ({applicantFeedback.length})
                              </Button>
                            ) : null}
                          </div>

                          <div className="overflow-x-auto pb-2">
                            <div className="flex min-w-max gap-3">
                              {preview.columns.map((column) => (
                                <div
                                  key={`${preview.table}-${index}-${column}`}
                                  className="min-h-[112px] w-[220px] flex-shrink-0 overflow-hidden rounded-2xl border border-white/8 bg-black/20 px-4 py-3"
                                >
                                  <p className="break-all text-[11px] uppercase tracking-[0.18em] text-white/35">{column}</p>
                                  <div className="mt-2 line-clamp-4 whitespace-pre-wrap break-words text-sm text-white/75">
                                    {renderCellValue(row[column])}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-8 text-center text-sm text-white/55">
                Select a table to view the latest rows.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {feedbackModalApplicant ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-8 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(17,25,40,0.98),rgba(8,13,22,0.99))] p-6 shadow-[0_28px_90px_rgba(0,0,0,0.45)]">
            <div className="mb-6 flex items-start justify-between gap-4 border-b border-white/10 pb-5">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/65">Applicant feedback</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">{feedbackModalApplicant.name}</h3>
                <p className="mt-2 text-sm text-white/55">
                  Showing {feedbackModalEntries.length} evaluation{feedbackModalEntries.length === 1 ? '' : 's'} saved so far.
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                className="text-white/65 hover:text-white"
                onClick={() => setFeedbackModalApplicantId(null)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="space-y-5">
              {feedbackModalEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5"
                >
                  <div className="mb-5 flex flex-col gap-2 border-b border-white/8 pb-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-lg font-medium text-white">{entry.interviewerName}</p>
                      <p className="mt-1 text-sm text-white/50">
                        {entry.interviewerRole} interviewer · {entry.recommendation}
                      </p>
                    </div>
                    <p className="text-sm text-white/45">{formatSubmittedAt(entry.submittedAt)}</p>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    {feedbackMetricFields.map((field) => (
                      <div
                        key={`${entry.id}-${field.key}`}
                        className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3"
                      >
                        <p className="text-[11px] uppercase tracking-[0.18em] text-white/35">{field.label}</p>
                        <p className="mt-2 text-base font-medium text-white">{formatRatingBand(entry[field.key])} / 3</p>
                      </div>
                    ))}
                  </div>

                  {entry.finalRoundSummary ? (
                    <p className="mt-4 text-sm leading-6 text-white/65">
                      <span className="text-white">Final-round push areas:</span> {entry.finalRoundSummary}
                    </p>
                  ) : null}

                  {entry.overallPerformanceOverview ? (
                    <p className="mt-2 text-sm leading-6 text-white/55">
                      <span className="text-white">Overall overview:</span> {entry.overallPerformanceOverview}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default DatabaseView;
