import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeftRight, CalendarClock, ClipboardCheck, DoorOpen, Loader2, ShieldCheck, UserCheck, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

import Footer from '@/components/Footer';
import Navigation from '@/components/Navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  adminApi,
  type AdminApplicationResponse,
  type InterviewAssignmentResponse,
} from '@/lib/admin-api';
import {
  formatAdminRoleLabel,
  getAssignmentCandidateRoleLabel,
  hasBackendPermission,
  mapAssignableUser,
  type AssignmentCandidate,
} from '@/pages/devops/recruiting-backend';

const assignmentNavButtonClass = (active: boolean) =>
  [
    'inline-flex h-11 items-center gap-2 rounded-xl border px-4 text-sm transition-all',
    active
      ? 'border-cyan-300/50 bg-cyan-400/10 text-white hover:bg-cyan-400/15'
      : 'border-white/10 bg-white/5 text-white/75 hover:bg-white/10 hover:text-white',
  ].join(' ');

const formatDateTime = (value: string | null) => {
  if (!value) return 'TBD';

  const parsed =
    /(?:Z|[+-]\d{2}:\d{2})$/.test(value)
      ? new Date(value)
      : new Date(value.replace(' ', 'T'));

  return parsed.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const formatAssignedAt = (value: string) =>
  new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

const toDateTimeLocalValue = (value: string | null) => {
  if (!value) return '';

  if (!/(?:Z|[+-]\d{2}:\d{2})$/.test(value)) {
    return value.replace(' ', 'T').slice(0, 16);
  }

  const parsed = new Date(value);
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  const hours = String(parsed.getHours()).padStart(2, '0');
  const minutes = String(parsed.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

type AssignmentDraft = {
  applicantId: string;
  primaryInterviewerId: string;
  secondaryInterviewerId: string;
  room: string;
  scheduledTime: string;
};

const emptyDraft: AssignmentDraft = {
  applicantId: '',
  primaryInterviewerId: '',
  secondaryInterviewerId: '',
  room: '',
  scheduledTime: '',
};

const getCurrentRoundAssignments = (
  assignments: InterviewAssignmentResponse[],
  applicationId: number,
  round: 'Round 1' | 'Round 2'
) => assignments.filter((assignment) => assignment.application_id === applicationId && assignment.round === round);

const canBePrimary = (user: AssignmentCandidate) => ['pm', 'partner'].includes(user.routeRole);
const canBeSecondary = (user: AssignmentCandidate) => ['consultant', 'lc'].includes(user.routeRole);

const DevopsAssignments = () => {
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const [draft, setDraft] = useState<AssignmentDraft>(emptyDraft);
  const [applications, setApplications] = useState<AdminApplicationResponse[]>([]);
  const [assignments, setAssignments] = useState<InterviewAssignmentResponse[]>([]);
  const [interviewers, setInterviewers] = useState<AssignmentCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const canAssignInterviewers = hasBackendPermission(user, 'assign_interviewers');

  const loadData = useCallback(async () => {
    if (!user || !canAssignInterviewers) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [applicationsResponse, assignmentsResponse, interviewersResponse] = await Promise.all([
        adminApi.listApplications(),
        adminApi.listAssignments(),
        adminApi.listInterviewers(),
      ]);

      setApplications(applicationsResponse);
      setAssignments(assignmentsResponse);
      setInterviewers(interviewersResponse.map(mapAssignableUser));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'The backend did not return assignment data.';
      if (!message.includes('Missing bearer token')) {
        toast({
          title: 'Could not load assignments workspace',
          description: message,
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  }, [canAssignInterviewers, toast, user]);

  useEffect(() => {
    if (authLoading) return;
    void loadData();
  }, [authLoading, loadData]);

  const eligibleApplicants = useMemo(
    () =>
      applications
        .filter((applicant) => applicant.current_round !== null && ['round_1', 'round_2'].includes(applicant.recruiting_status))
        .sort((left, right) => new Date(right.reviewed_at ?? right.created_at).getTime() - new Date(left.reviewed_at ?? left.created_at).getTime()),
    [applications]
  );

  const primaryCandidates = useMemo(
    () => interviewers.filter((candidate) => candidate.active && canBePrimary(candidate)),
    [interviewers]
  );
  const secondaryCandidates = useMemo(
    () => interviewers.filter((candidate) => candidate.active && canBeSecondary(candidate)),
    [interviewers]
  );

  const selectedApplicant = useMemo(
    () => eligibleApplicants.find((applicant) => String(applicant.id) === draft.applicantId) ?? null,
    [draft.applicantId, eligibleApplicants]
  );

  useEffect(() => {
    if (eligibleApplicants.length === 0) return;

    setDraft((currentDraft) => {
      if (currentDraft.applicantId && eligibleApplicants.some((applicant) => String(applicant.id) === currentDraft.applicantId)) {
        return currentDraft;
      }

      const defaultApplicant = eligibleApplicants[0];
      const defaultRound = defaultApplicant.current_round ?? 'Round 1';
      const defaultAssignments = getCurrentRoundAssignments(assignments, defaultApplicant.id, defaultRound);

      return {
        applicantId: String(defaultApplicant.id),
        primaryInterviewerId: String(defaultAssignments.find((assignment) => assignment.role === 'primary')?.interviewer_id ?? ''),
        secondaryInterviewerId: String(defaultAssignments.find((assignment) => assignment.role === 'secondary')?.interviewer_id ?? ''),
        room: defaultAssignments[0]?.room ?? '',
        scheduledTime: toDateTimeLocalValue(defaultAssignments[0]?.scheduled_time ?? null),
      };
    });
  }, [assignments, eligibleApplicants]);

  const handleApplicantChange = (applicantId: string) => {
    const applicant = eligibleApplicants.find((entry) => String(entry.id) === applicantId) ?? null;
    if (!applicant || !applicant.current_round) return;

    const currentAssignments = getCurrentRoundAssignments(assignments, applicant.id, applicant.current_round);
    setDraft({
      applicantId,
      primaryInterviewerId: String(currentAssignments.find((assignment) => assignment.role === 'primary')?.interviewer_id ?? ''),
      secondaryInterviewerId: String(currentAssignments.find((assignment) => assignment.role === 'secondary')?.interviewer_id ?? ''),
      room: currentAssignments[0]?.room ?? '',
      scheduledTime: toDateTimeLocalValue(currentAssignments[0]?.scheduled_time ?? null),
    });
  };

  const handleSave = async () => {
    if (!selectedApplicant || !selectedApplicant.current_round || !user) return;

    const primaryUser = primaryCandidates.find((candidate) => String(candidate.id) === draft.primaryInterviewerId) ?? null;
    const secondaryUser = secondaryCandidates.find((candidate) => String(candidate.id) === draft.secondaryInterviewerId) ?? null;

    if (!primaryUser) {
      toast({
        title: 'Primary interviewer required',
        description: 'Select a PM, Partner, Executive, or Admin as the primary interviewer.',
        variant: 'destructive',
      });
      return;
    }
    if (!secondaryUser) {
      toast({
        title: 'Secondary interviewer required',
        description: 'Select a Consultant or LC as the secondary interviewer.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const savedAssignments = await adminApi.saveAssignments(selectedApplicant.id, {
        round: selectedApplicant.current_round,
        primary_interviewer_id: primaryUser.id,
        secondary_interviewer_id: secondaryUser.id,
        room: draft.room.trim() || null,
        scheduled_time: draft.scheduledTime ? `${draft.scheduledTime}:00` : null,
      });

      setAssignments((current) => {
        const next = current.filter(
          (assignment) =>
            !(
              assignment.application_id === selectedApplicant.id &&
              assignment.round === selectedApplicant.current_round
            )
        );
        return [...next, ...savedAssignments];
      });

      toast({
        title: 'Interview assignment saved',
        description: `${selectedApplicant.name} now has ${primaryUser.name ?? primaryUser.email} and ${secondaryUser.name ?? secondaryUser.email} assigned for ${selectedApplicant.current_round}.`,
      });
    } catch (error) {
      toast({
        title: 'Could not save assignment',
        description: error instanceof Error ? error.message : 'The backend rejected this assignment update.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const applicantCards = eligibleApplicants.map((applicant) => {
    const currentRound = applicant.current_round ?? 'Round 1';
    const currentAssignments = getCurrentRoundAssignments(assignments, applicant.id, currentRound);
    const primaryAssignment = currentAssignments.find((assignment) => assignment.role === 'primary') ?? null;
    const secondaryAssignment = currentAssignments.find((assignment) => assignment.role === 'secondary') ?? null;
    const fullyAssigned = Boolean(primaryAssignment && secondaryAssignment);

    return (
      <button
        key={applicant.id}
        type="button"
        onClick={() => handleApplicantChange(String(applicant.id))}
        className={[
          'rounded-3xl border p-5 text-left transition-all',
          draft.applicantId === String(applicant.id)
            ? 'border-cyan-300/40 bg-cyan-400/10 shadow-[0_20px_60px_rgba(34,211,238,0.12)]'
            : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]',
        ].join(' ')}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-white/40">
              {applicant.recruiting_status.replace(/_/g, ' ')} • {currentRound}
            </p>
            <h3 className="mt-2 text-lg font-semibold text-white">{applicant.name}</h3>
            <p className="mt-1 text-sm text-white/55">
              {applicant.cycle_name ?? 'No cycle'} • {applicant.email}
            </p>
          </div>
          <span
            className={[
              'rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.2em]',
              fullyAssigned
                ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-100'
                : 'border-amber-400/30 bg-amber-400/10 text-amber-100',
            ].join(' ')}
          >
            {fullyAssigned ? 'Assigned' : 'Needs staffing'}
          </span>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
            <p className="text-[11px] uppercase tracking-[0.2em] text-white/40">Primary</p>
            <p className="mt-2 text-sm font-medium text-white">{primaryAssignment?.interviewer_name ?? 'Unassigned'}</p>
            <p className="mt-1 text-xs text-white/50">{primaryAssignment ? formatAdminRoleLabel(primaryAssignment.interviewer_role) : 'PM or Partner only'}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
            <p className="text-[11px] uppercase tracking-[0.2em] text-white/40">Secondary</p>
            <p className="mt-2 text-sm font-medium text-white">{secondaryAssignment?.interviewer_name ?? 'Unassigned'}</p>
            <p className="mt-1 text-xs text-white/50">{secondaryAssignment ? formatAdminRoleLabel(secondaryAssignment.interviewer_role) : 'Consultant or LC only'}</p>
          </div>
        </div>
      </button>
    );
  });

  const assignmentRows = useMemo(() => {
    const grouped = new Map<
      number,
      { applicant: AdminApplicationResponse; primary: InterviewAssignmentResponse | null; secondary: InterviewAssignmentResponse | null }
    >();

    eligibleApplicants.forEach((applicant) => {
      const currentRound = applicant.current_round ?? 'Round 1';
      const currentAssignments = getCurrentRoundAssignments(assignments, applicant.id, currentRound);
      grouped.set(applicant.id, {
        applicant,
        primary: currentAssignments.find((assignment) => assignment.role === 'primary') ?? null,
        secondary: currentAssignments.find((assignment) => assignment.role === 'secondary') ?? null,
      });
    });

    return Array.from(grouped.values()).sort((left, right) => {
      const leftTimestamp = left.primary?.assigned_at ?? left.secondary?.assigned_at ?? left.applicant.reviewed_at ?? left.applicant.created_at;
      const rightTimestamp = right.primary?.assigned_at ?? right.secondary?.assigned_at ?? right.applicant.reviewed_at ?? right.applicant.created_at;
      return new Date(rightTimestamp).getTime() - new Date(leftTimestamp).getTime();
    });
  }, [assignments, eligibleApplicants]);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-white">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!canAssignInterviewers) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <section className="px-4 pb-24 pt-28">
          <div className="mx-auto max-w-3xl">
            <Card className="border-white/10 bg-white/[0.03]">
              <CardContent className="p-10 text-center text-white/60">
                Your role does not have permission to assign interviewers.
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
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_24%),radial-gradient(circle_at_82%_18%,rgba(244,114,182,0.08),transparent_18%),linear-gradient(180deg,rgba(3,8,17,0.94),rgba(3,8,17,1))]" />
        <div className="relative mx-auto max-w-7xl">
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <Link to="/tech/manage" className={assignmentNavButtonClass(false)}>
              <ArrowLeftRight className="h-4 w-4" />
              Manage Dashboard
            </Link>
            <span className={assignmentNavButtonClass(true)}>
              <ClipboardCheck className="h-4 w-4" />
              Interview Assignments
            </span>
          </div>

          <div className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-cyan-200/70">Recruiting workflow</p>
              <h1 className="mt-3 text-3xl font-semibold text-white">Manual interviewer assignment</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-white/60">
                This page now reads and writes live interview assignments through the FastAPI backend.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.22em] text-white/40">Eligible</p>
                <p className="mt-2 text-2xl font-semibold text-white">{eligibleApplicants.length}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.22em] text-white/40">Primary Pool</p>
                <p className="mt-2 text-2xl font-semibold text-white">{primaryCandidates.length}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.22em] text-white/40">Secondary Pool</p>
                <p className="mt-2 text-2xl font-semibold text-white">{secondaryCandidates.length}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(17,25,40,0.98),rgba(8,13,22,0.99))] shadow-[0_24px_60px_rgba(0,0,0,0.34)]">
              <CardHeader>
                <CardTitle className="text-white">Eligible applicants</CardTitle>
                <CardDescription>
                  Applicants shown here are in an active interview round and still pending a final decision.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                {applicantCards.length > 0 ? (
                  applicantCards
                ) : (
                  <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.03] px-6 py-10 text-center">
                    <Users className="mx-auto h-10 w-10 text-white/35" />
                    <p className="mt-4 text-lg font-medium text-white">No active applicants need interview staffing.</p>
                    <p className="mt-2 text-sm text-white/55">Once an applicant advances to Round 1 or Round 2, they will appear here.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(17,25,40,0.98),rgba(8,13,22,0.99))] shadow-[0_24px_60px_rgba(0,0,0,0.34)]">
              <CardHeader>
                <CardTitle className="text-white">Assignment editor</CardTitle>
                <CardDescription>
                  Primary is limited to PM, Partner, Executive, or Admin. Secondary is limited to Consultant or LC.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="assignment-applicant" className="text-white">
                      Applicant
                    </Label>
                    <select
                      id="assignment-applicant"
                      value={draft.applicantId}
                      onChange={(event) => handleApplicantChange(event.target.value)}
                      className="h-11 w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm text-white outline-none"
                    >
                      {eligibleApplicants.map((applicant) => (
                        <option key={applicant.id} value={applicant.id} className="bg-slate-900 text-white">
                          {applicant.name} • {applicant.current_round ?? 'Round 1'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="assignment-primary" className="text-white">
                      Primary interviewer
                    </Label>
                    <select
                      id="assignment-primary"
                      value={draft.primaryInterviewerId}
                      onChange={(event) => setDraft((currentDraft) => ({ ...currentDraft, primaryInterviewerId: event.target.value }))}
                      className="h-11 w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm text-white outline-none"
                    >
                      <option value="" className="bg-slate-900 text-white">
                        Select PM, Partner, Executive, or Admin
                      </option>
                      {primaryCandidates.map((candidate) => (
                        <option key={candidate.id} value={candidate.id} className="bg-slate-900 text-white">
                          {(candidate.name ?? candidate.email)} • {getAssignmentCandidateRoleLabel(candidate)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="assignment-secondary" className="text-white">
                      Secondary interviewer
                    </Label>
                    <select
                      id="assignment-secondary"
                      value={draft.secondaryInterviewerId}
                      onChange={(event) => setDraft((currentDraft) => ({ ...currentDraft, secondaryInterviewerId: event.target.value }))}
                      className="h-11 w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm text-white outline-none"
                    >
                      <option value="" className="bg-slate-900 text-white">
                        Select Consultant or LC
                      </option>
                      {secondaryCandidates.map((candidate) => (
                        <option key={candidate.id} value={candidate.id} className="bg-slate-900 text-white">
                          {(candidate.name ?? candidate.email)} • {getAssignmentCandidateRoleLabel(candidate)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="assignment-room" className="text-white">
                      Room
                    </Label>
                    <Input
                      id="assignment-room"
                      value={draft.room}
                      onChange={(event) => setDraft((currentDraft) => ({ ...currentDraft, room: event.target.value }))}
                      placeholder="Optional room or Zoom label"
                      className="border-white/10 bg-slate-950/60 text-white placeholder:text-white/30"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="assignment-time" className="text-white">
                      Time
                    </Label>
                    <Input
                      id="assignment-time"
                      type="datetime-local"
                      value={draft.scheduledTime}
                      onChange={(event) => setDraft((currentDraft) => ({ ...currentDraft, scheduledTime: event.target.value }))}
                      className="border-white/10 bg-slate-950/60 text-white"
                    />
                  </div>
                </div>

                <div className="grid gap-3 rounded-3xl border border-white/10 bg-black/20 p-4 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <UserCheck className="h-5 w-5 text-cyan-200" />
                    <p className="mt-3 text-xs uppercase tracking-[0.2em] text-white/45">Primary rule</p>
                    <p className="mt-2 text-sm text-white/75">Only PM, Partner, Executive, or Admin can be saved into the primary slot.</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <ShieldCheck className="h-5 w-5 text-emerald-200" />
                    <p className="mt-3 text-xs uppercase tracking-[0.2em] text-white/45">Secondary rule</p>
                    <p className="mt-2 text-sm text-white/75">Only Consultant or LC can be saved into the secondary slot.</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <DoorOpen className="h-5 w-5 text-amber-200" />
                    <p className="mt-3 text-xs uppercase tracking-[0.2em] text-white/45">Scheduling</p>
                    <p className="mt-2 text-sm text-white/75">Room and time are optional but shared across both interviewer records.</p>
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={!selectedApplicant || saving}
                  className="h-11 w-full bg-cyan-500 text-slate-950 hover:bg-cyan-400"
                >
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Save interview assignment
                </Button>

                {user ? (
                  <p className="text-xs uppercase tracking-[0.2em] text-white/40">
                    Acting as {user.name ?? user.email} • {formatAdminRoleLabel(user.role)}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6 border-white/10 bg-[linear-gradient(180deg,rgba(17,25,40,0.98),rgba(8,13,22,0.99))] shadow-[0_24px_60px_rgba(0,0,0,0.34)]">
            <CardHeader>
              <CardTitle className="text-white">Current assignments</CardTitle>
              <CardDescription>Existing assignments are read directly from the backend and grouped per applicant and round.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {assignmentRows.length > 0 ? (
                assignmentRows.map(({ applicant, primary, secondary }) => {
                  const scheduleSource = primary ?? secondary;

                  return (
                    <div
                      key={applicant.id}
                      className="grid gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-5 xl:grid-cols-[1.2fr_0.8fr_0.7fr]"
                    >
                      <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-white/40">
                          {applicant.name} • {applicant.current_round ?? 'Round 1'}
                        </p>
                        <p className="mt-2 text-sm text-white/60">
                          {applicant.email} • {applicant.cycle_name ?? 'No cycle'}
                        </p>
                        <p className="mt-3 text-sm text-white/70">{applicant.notes ?? applicant.interest ?? 'No additional notes.'}</p>
                      </div>

                      <div className="grid gap-3">
                        <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                          <p className="text-[11px] uppercase tracking-[0.2em] text-white/40">Primary</p>
                          <p className="mt-2 text-sm font-medium text-white">{primary?.interviewer_name ?? 'Unassigned'}</p>
                          <p className="mt-1 text-xs text-white/50">{primary ? formatAdminRoleLabel(primary.interviewer_role) : 'PM or Partner'}</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                          <p className="text-[11px] uppercase tracking-[0.2em] text-white/40">Secondary</p>
                          <p className="mt-2 text-sm font-medium text-white">{secondary?.interviewer_name ?? 'Unassigned'}</p>
                          <p className="mt-1 text-xs text-white/50">{secondary ? formatAdminRoleLabel(secondary.interviewer_role) : 'Consultant or LC'}</p>
                        </div>
                      </div>

                      <div className="grid gap-3">
                        <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                          <p className="text-[11px] uppercase tracking-[0.2em] text-white/40">Schedule</p>
                          <p className="mt-2 flex items-center gap-2 text-sm text-white">
                            <CalendarClock className="h-4 w-4 text-cyan-200" />
                            {formatDateTime(scheduleSource?.scheduled_time ?? null)}
                          </p>
                          <p className="mt-2 flex items-center gap-2 text-sm text-white/70">
                            <DoorOpen className="h-4 w-4 text-cyan-200" />
                            {scheduleSource?.room ?? 'TBD'}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                          <p className="text-[11px] uppercase tracking-[0.2em] text-white/40">Saved</p>
                          <p className="mt-2 text-sm text-white">
                            {formatAssignedAt(primary?.assigned_at ?? secondary?.assigned_at ?? applicant.reviewed_at ?? applicant.created_at)}
                          </p>
                          <p className="mt-1 text-xs text-white/50">By {primary?.assigned_by_user_name ?? secondary?.assigned_by_user_name ?? 'Backend workflow'}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.03] px-6 py-10 text-center">
                  <ClipboardCheck className="mx-auto h-10 w-10 text-white/35" />
                  <p className="mt-4 text-lg font-medium text-white">No assignments saved yet.</p>
                  <p className="mt-2 text-sm text-white/55">Use the assignment editor to create the first manual interview pairing.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default DevopsAssignments;
