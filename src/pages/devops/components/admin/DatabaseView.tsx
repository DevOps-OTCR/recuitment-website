import { Database, HardDriveDownload, Table2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

import {
  databaseTableLabels,
  type DatabaseOverview,
  type DatabaseTableName,
  type DatabaseTablePreview,
} from './types';

interface DatabaseViewProps {
  overview: DatabaseOverview | null;
  preview: DatabaseTablePreview | null;
  selectedTable: DatabaseTableName;
  loading: boolean;
  error: string | null;
  onSelectTable: (table: DatabaseTableName) => void;
  onRefresh: () => void;
}

const renderCellValue = (value: unknown) => {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const DatabaseView = ({
  overview,
  preview,
  selectedTable,
  loading,
  error,
  onSelectTable,
  onRefresh,
}: DatabaseViewProps) => (
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
            <div className="overflow-hidden rounded-[24px] border border-white/10">
              <div className="max-h-[720px] overflow-auto">
                <table className="min-w-full border-collapse text-left text-sm">
                  <thead className="sticky top-0 z-10 bg-slate-950/95 backdrop-blur">
                    <tr>
                      {preview.columns.map((column) => (
                        <th key={column} className="border-b border-white/10 px-4 py-3 font-medium text-white/65">
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.length === 0 ? (
                      <tr>
                        <td colSpan={preview.columns.length || 1} className="px-4 py-8 text-center text-white/50">
                          No rows found in this table.
                        </td>
                      </tr>
                    ) : (
                      preview.rows.map((row, index) => (
                        <tr key={`${preview.table}-${index}`} className="border-b border-white/6 align-top">
                          {preview.columns.map((column) => (
                            <td key={`${preview.table}-${index}-${column}`} className="max-w-[260px] px-4 py-3 text-white/70">
                              <div className="whitespace-pre-wrap break-words">{renderCellValue(row[column])}</div>
                            </td>
                          ))}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
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
);

export default DatabaseView;
