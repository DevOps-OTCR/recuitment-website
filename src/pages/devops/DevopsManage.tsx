import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, Loader2, CheckCircle, XCircle, Clock, Copy, FileText, LogOut, ExternalLink, AlertCircle, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import otcrTechLogo from '@/assets/otcr-technologies-white-nomargins.webp';

const API_BASE_URL = import.meta.env.VITE_OA_API_URL || 'http://localhost:8000';
const ADMIN_KEY_STORAGE = 'otcr_devops_admin_secret';

interface ApplicationItem {
  id: number;
  name: string;
  email: string;
  interest: string | null;
  resume_filename: string | null;
  status: string;
  created_at: string;
  reviewed_at: string | null;
  notes: string | null;
  has_assessment_link: boolean;
  assessment_completed: boolean;
  assessment_token: string | null;
  focus_loss_events: number;
  is_flagged: boolean;
  integrity_notes: string | null;
}

interface SubmissionData {
  token: string;
  applicant_name: string | null;
  email: string | null;
  started_at: string;
  completed_at: string | null;
  sections_completed: string[];
  focus_loss_events: number;
  is_flagged: boolean;
  integrity_notes: string | null;
  submissions: {
    section: string;
    submitted_at: string;
    payload: any;
    coding_result: any | null;
    notes: string | null;
  }[];
}

const DevopsManage = () => {
  const { toast } = useToast();
  const [adminSecret, setAdminSecret] = useState('');
  const [storedSecret, setStoredSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [approvedLink, setApprovedLink] = useState<{ id: number; url: string } | null>(null);
  const [viewingSubmission, setViewingSubmission] = useState<SubmissionData | null>(null);
  const [loadingSubmission, setLoadingSubmission] = useState(false);

  useEffect(() => {
    const key = sessionStorage.getItem(ADMIN_KEY_STORAGE);
    if (key) setStoredSecret(key);
  }, []);

  const headers = () => ({
    'X-Admin-Secret': storedSecret || '',
  });

  const fetchApplications = async () => {
    if (!storedSecret) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/applications`, { headers: headers() });
      if (res.status === 403) {
        sessionStorage.removeItem(ADMIN_KEY_STORAGE);
        setStoredSecret(null);
        setError('Invalid admin key. Please enter it again.');
        setLoading(false);
        return;
      }
      if (!res.ok) throw new Error('Failed to load applications');
      const data = await res.json();
      setApplications(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load applications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (storedSecret) fetchApplications();
  }, [storedSecret]);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminSecret.trim()) return;
    sessionStorage.setItem(ADMIN_KEY_STORAGE, adminSecret.trim());
    setStoredSecret(adminSecret.trim());
    setAdminSecret('');
  };

  const handleLogout = () => {
    sessionStorage.removeItem(ADMIN_KEY_STORAGE);
    setStoredSecret(null);
    setApplications([]);
    setApprovedLink(null);
  };

  const approve = async (id: number) => {
    setActionLoading(id);
    setApprovedLink(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/applications/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers() },
        body: JSON.stringify({}),
      });
      if (res.status === 403) {
        handleLogout();
        return;
      }
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.detail || 'Approve failed');
      }
      const data = await res.json();
      const token = data.assessment_link?.token || '';
      const base = `${window.location.origin}${window.location.pathname || '/'}`.replace(/\/?$/, '');
      const url = `${base}#/tech/assessment/${token}`;
      setApprovedLink({ id, url });
      await fetchApplications();
    } catch (e: any) {
      setError(e.message || 'Approve failed');
    } finally {
      setActionLoading(null);
    }
  };

  const reject = async (id: number) => {
    setActionLoading(id);
    setApprovedLink(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/applications/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers() },
        body: JSON.stringify({}),
      });
      if (res.status === 403) {
        handleLogout();
        return;
      }
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.detail || 'Reject failed');
      }
      await fetchApplications();
    } catch (e: any) {
      setError(e.message || 'Reject failed');
    } finally {
      setActionLoading(null);
    }
  };

  const copyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: 'Link copied!',
      description: 'Assessment link copied to clipboard.',
    });
  };

  const openResume = async (id: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/applications/${id}/resume`, { headers: headers() });
      if (res.status === 403) {
        handleLogout();
        return;
      }
      if (!res.ok) return;
      const blob = await res.blob();
      const u = URL.createObjectURL(blob);
      window.open(u, '_blank', 'noopener,noreferrer');
    } catch {
      setError('Could not open resume');
    }
  };

  const viewSubmission = async (token: string) => {
    setLoadingSubmission(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/submissions/${token}`, { headers: headers() });
      if (res.status === 403) {
        handleLogout();
        return;
      }
      if (!res.ok) {
        throw new Error('Failed to load submission');
      }
      const data = await res.json();
      setViewingSubmission(data);
    } catch (e: any) {
      setError(e.message || 'Could not load submission');
    } finally {
      setLoadingSubmission(false);
    }
  };

  if (!storedSecret) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <section className="pt-32 pb-24 px-4">
          <div className="max-w-md mx-auto">
            <div className="flex justify-center mb-8">
              <img 
                src={otcrTechLogo} 
                alt="OTCR Technologies" 
                className="h-16 w-auto"
              />
            </div>
            <Card className="bg-card/80 border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Lock className="w-5 h-5" />
                  Admin access
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Enter the admin key to manage applications.
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUnlock} className="space-y-4">
                  <div>
                    <Label htmlFor="admin-key" className="text-muted-foreground">Admin key</Label>
                    <Input
                      id="admin-key"
                      type="password"
                      value={adminSecret}
                      onChange={(e) => setAdminSecret(e.target.value)}
                      placeholder="Admin secret"
                      className="mt-2 bg-background/50"
                      autoComplete="current-password"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={!adminSecret.trim()}>
                    Unlock
                  </Button>
                </form>
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
      <section className="pt-28 pb-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <img 
                src={otcrTechLogo} 
                alt="OTCR Technologies" 
                className="h-10 w-auto"
              />
              <h1 className="text-2xl font-bold text-white">
                Applications
              </h1>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground">
              <LogOut className="w-4 h-4 mr-1" />
              Lock
            </Button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          {approvedLink && (
            <Card className="mb-6 border-primary/50 bg-primary/5">
              <CardContent className="pt-4">
                <p className="text-sm font-medium text-white mb-2">Assessment link created — send this to the candidate:</p>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={approvedLink.url}
                    className="font-mono text-sm bg-background/50"
                  />
                  <Button
                    size="icon"
                    variant="secondary"
                    onClick={() => copyLink(approvedLink.url)}
                    title="Copy link"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : applications.length === 0 ? (
            <Card className="bg-card/50">
              <CardContent className="py-12 text-center text-muted-foreground">
                No applications yet.
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-lg border border-border overflow-x-auto overflow-y-visible">
              <table className="w-full text-left min-w-[900px]">
                <thead>
                  <tr className="border-b border-border bg-card/80">
                    <th className="px-4 py-3 text-sm font-semibold text-white">Name</th>
                    <th className="px-4 py-3 text-sm font-semibold text-white">Email</th>
                    <th className="px-4 py-3 text-sm font-semibold text-white">Why OTCR Tech</th>
                    <th className="px-4 py-3 text-sm font-semibold text-white">Resume</th>
                    <th className="px-4 py-3 text-sm font-semibold text-white">Status</th>
                    <th className="px-4 py-3 text-sm font-semibold text-white">Integrity</th>
                    <th className="px-4 py-3 text-sm font-semibold text-white">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => (
                    <tr key={app.id} className="border-b border-border/50 bg-card/50 hover:bg-card/70 transition-colors">
                      <td className="px-4 py-3 text-white font-medium">{app.name}</td>
                      <td className="px-4 py-3 text-muted-foreground text-sm">{app.email}</td>
                      <td className="px-4 py-3 text-muted-foreground text-sm max-w-xs">
                        <div className="overflow-x-auto whitespace-nowrap scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent max-w-[200px] pb-1" title={app.interest ?? ''}>
                          {app.interest ?? '—'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {app.resume_filename ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-teal-primary hover:text-teal-primary/90 hover:bg-teal-primary/10"
                            onClick={() => openResume(app.id)}
                          >
                            <ExternalLink className="w-4 h-4 mr-1" />
                            Open
                          </Button>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {app.status === 'approved' && (
                          <span className="inline-flex items-center gap-1 text-sm text-green-500">
                            <CheckCircle className="w-4 h-4" /> Approved
                          </span>
                        )}
                        {app.status === 'rejected' && (
                          <span className="inline-flex items-center gap-1 text-sm text-destructive">
                            <XCircle className="w-4 h-4" /> Rejected
                          </span>
                        )}
                        {app.status === 'pending' && (
                          <span className="inline-flex items-center gap-1 text-sm text-amber-500">
                            <Clock className="w-4 h-4" /> Pending
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {app.is_flagged ? (
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-destructive" />
                            <div className="text-xs">
                              <p className="text-destructive font-medium">Flagged</p>
                              <p className="text-muted-foreground">Focus loss: {app.focus_loss_events}</p>
                              {app.integrity_notes && (
                                <p className="text-muted-foreground">{app.integrity_notes}</p>
                              )}
                            </div>
                          </div>
                        ) : app.focus_loss_events > 0 ? (
                          <p className="text-xs text-muted-foreground">Focus loss: {app.focus_loss_events}</p>
                        ) : (
                          <p className="text-xs text-green-500">✓ Clean</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {app.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => approve(app.id)}
                              disabled={actionLoading !== null}
                              className="bg-primary hover:bg-primary/90"
                            >
                              {actionLoading === app.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-1" />}
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => reject(app.id)}
                              disabled={actionLoading !== null}
                            >
                              {actionLoading === app.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4 mr-1" />}
                              Reject
                            </Button>
                          </div>
                        )}
                        {app.status === 'approved' && app.has_assessment_link && (
                          app.assessment_completed ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => app.assessment_token && viewSubmission(app.assessment_token)}
                              disabled={loadingSubmission}
                              className="text-green-500 hover:text-green-400 hover:bg-green-500/10 border-green-500/30"
                            >
                              {loadingSubmission ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Eye className="w-4 h-4 mr-1" />}
                              View Submission
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                if (app.assessment_token) {
                                  const base = `${window.location.origin}${window.location.pathname || '/'}`.replace(/\/?$/, '');
                                  const url = `${base}#/tech/assessment/${app.assessment_token}`;
                                  copyLink(url);
                                }
                              }}
                              className="text-teal-primary hover:text-teal-primary/90 hover:bg-teal-primary/10 border-teal-primary/30"
                            >
                              <Copy className="w-4 h-4 mr-1" />
                              Copy Link
                            </Button>
                          )
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* Submission Viewer Modal */}
      {viewingSubmission && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-auto">
          <div className="bg-[#1a1a2e] rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto border border-border">
            <div className="sticky top-0 bg-[#1a1a2e] border-b border-border p-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Submission Review</h2>
                <p className="text-sm text-muted-foreground">
                  {viewingSubmission.applicant_name} ({viewingSubmission.email})
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewingSubmission(null)}
                className="text-muted-foreground hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="p-4 space-y-6">
              {/* Integrity Status */}
              <div className={`p-4 rounded-lg ${viewingSubmission.is_flagged ? 'bg-destructive/10 border border-destructive/30' : 'bg-green-500/10 border border-green-500/30'}`}>
                <div className="flex items-center gap-2">
                  {viewingSubmission.is_flagged ? (
                    <AlertCircle className="w-5 h-5 text-destructive" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                  <span className={`font-medium ${viewingSubmission.is_flagged ? 'text-destructive' : 'text-green-500'}`}>
                    {viewingSubmission.is_flagged ? 'Flagged for Review' : 'No Integrity Issues'}
                  </span>
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  <p>Focus loss events: {viewingSubmission.focus_loss_events}</p>
                  <p>Sections completed: {viewingSubmission.sections_completed.join(', ')}</p>
                  {viewingSubmission.integrity_notes && (
                    <p className="mt-1 text-yellow-500">{viewingSubmission.integrity_notes}</p>
                  )}
                </div>
              </div>

              {/* Submissions by Section */}
              {viewingSubmission.submissions.map((sub, idx) => (
                <div key={idx} className="border border-border rounded-lg overflow-hidden">
                  <div className="bg-[#0f0f1a] px-4 py-2 border-b border-border">
                    <h3 className="font-medium text-white capitalize">{sub.section.replace('_', ' ')}</h3>
                    <p className="text-xs text-muted-foreground">
                      Submitted: {new Date(sub.submitted_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4">
                    {sub.section === 'problem_solving' && sub.payload && (
                      <div className="space-y-3">
                        {Object.entries(sub.payload).map(([qId, answer]) => (
                          <div key={qId} className="text-sm">
                            <p className="text-muted-foreground">Question {qId}:</p>
                            <p className="text-white ml-2">Answer: {String(answer)}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {sub.section === 'coding' && (
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Code:</p>
                          <pre className="bg-[#0f0f1a] p-3 rounded text-sm text-white overflow-x-auto font-mono">
                            {sub.payload?.code || 'No code submitted'}
                          </pre>
                        </div>
                        {sub.coding_result && (
                          <div className={`p-3 rounded text-sm ${sub.coding_result.passed ? 'bg-green-500/10 border border-green-500/30' : 'bg-destructive/10 border border-destructive/30'}`}>
                            <p className={`font-medium ${sub.coding_result.passed ? 'text-green-500' : 'text-destructive'}`}>
                              {sub.coding_result.passed ? '✓ All Test Cases Passed' : '✗ Test Cases Failed'}
                            </p>
                            {sub.coding_result.results && (
                              <div className="mt-2 space-y-1">
                                {sub.coding_result.results.map((r: any, i: number) => (
                                  <div key={i} className="text-xs">
                                    <span className={r.passed ? 'text-green-500' : 'text-destructive'}>
                                      Test {i + 1}: {r.passed ? 'Passed' : 'Failed'}
                                    </span>
                                    {!r.passed && r.expected !== undefined && (
                                      <span className="text-muted-foreground ml-2">
                                        Expected: {JSON.stringify(r.expected)}, Got: {JSON.stringify(r.actual)}
                                      </span>
                                    )}
                                    {r.error && <span className="text-destructive ml-2">{r.error}</span>}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {sub.section === 'system_design' && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Response:</p>
                        <div className="bg-[#0f0f1a] p-3 rounded text-sm text-white whitespace-pre-wrap">
                          {sub.payload?.response || 'No response submitted'}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default DevopsManage;
