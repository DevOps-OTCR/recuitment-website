import { useEffect, useMemo, useState } from 'react';
import { ArrowLeftRight, CalendarClock, ClipboardCheck, DoorOpen, ShieldCheck, UserCheck, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

import Footer from '@/components/Footer';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  getApplicationStatusLabel,
  getInterviewRoundLabel,
  isPartnerOrPm,
  isValidAssignmentForRole,
  recruitingStore,
  Role,
  useRecruitingStore,
  type Applicant,
  type Assignment,
  type InterviewRound,
  type RecruitingUser,
} from '@/features/recruiting';

const MOCK_ASSIGNER_ID = 'user-partner-maya';

const assignmentNavButtonClass = (active: boolean) =>
  [
    'inline-flex h-11 items-center gap-2 rounded-xl border px-4 text-sm transition-all',
    active
      ? 'border-cyan-300/50 bg-cyan-400/10 text-white hover:bg-cyan-400/15'
      : 'border-white/10 bg-white/5 text-white/75 hover:bg-white/10 hover:text-white',
  ].join(' ');

const formatDateTime = (value: string | null) => {
  if (!value) return 'TBD';

  return new Date(value).toLocaleString('en-US', {
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

const getDisplayRole = (role: RecruitingUser['role']) => {
  switch (role) {
    case Role.Partner:
      return 'Partner';
    case Role.PM:
      return 'PM';
    case Role.Consultant:
      return 'Consultant';
    case Role.LC:
      return 'LC';
    default:
      return 'Applicant';
  }
};

const getCurrentRoundAssignments = (assignments: Assignment[], applicantId: string, round: InterviewRound) =>
  assignments.filter((assignment) => assignment.applicantId === applicantId && assignment.round === round);

const DevopsAssignments = () => {
  const { toast } = useToast();
  const [draft, setDraft] = useState<AssignmentDraft>(emptyDraft);

  const { applicants, assignments, users } = useRecruitingStore((state) => state);

  const currentUser =
    users.find((user) => user.id === MOCK_ASSIGNER_ID) ??
    users.find((user) => isPartnerOrPm(user)) ??
    null;

  const eligibleApplicants = useMemo(
    () =>
      applicants
        .filter((applicant) => applicant.finalDecision === 'pending' && applicant.currentRound !== null)
        .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()),
    [applicants]
  );

  const primaryCandidates = useMemo(
    () => users.filter((user) => user.active && isValidAssignmentForRole('primary', user)),
    [users]
  );

  const secondaryCandidates = useMemo(
    () => users.filter((user) => user.active && isValidAssignmentForRole('secondary', user)),
    [users]
  );

  const selectedApplicant = useMemo(
    () => eligibleApplicants.find((applicant) => applicant.id === draft.applicantId) ?? null,
    [draft.applicantId, eligibleApplicants]
  );

  useEffect(() => {
    if (eligibleApplicants.length === 0) return;

    setDraft((currentDraft) => {
      if (currentDraft.applicantId && eligibleApplicants.some((applicant) => applicant.id === currentDraft.applicantId)) {
        return currentDraft;
      }

      const defaultApplicant = eligibleApplicants[0];
      const defaultAssignments = getCurrentRoundAssignments(assignments, defaultApplicant.id, defaultApplicant.currentRound!);

      return {
        applicantId: defaultApplicant.id,
        primaryInterviewerId: defaultAssignments.find((assignment) => assignment.role === 'primary')?.interviewerId ?? '',
        secondaryInterviewerId: defaultAssignments.find((assignment) => assignment.role === 'secondary')?.interviewerId ?? '',
        room: defaultAssignments[0]?.room ?? '',
        scheduledTime: defaultAssignments[0]?.scheduledTime ?? '',
      };
    });
  }, [assignments, eligibleApplicants]);

  const handleApplicantChange = (applicantId: string) => {
    const applicant = eligibleApplicants.find((entry) => entry.id === applicantId) ?? null;
    if (!applicant || !applicant.currentRound) return;

    const currentAssignments = getCurrentRoundAssignments(assignments, applicant.id, applicant.currentRound);

    setDraft({
      applicantId: applicant.id,
      primaryInterviewerId: currentAssignments.find((assignment) => assignment.role === 'primary')?.interviewerId ?? '',
      secondaryInterviewerId: currentAssignments.find((assignment) => assignment.role === 'secondary')?.interviewerId ?? '',
      room: currentAssignments[0]?.room ?? '',
      scheduledTime: currentAssignments[0]?.scheduledTime ?? '',
    });
  };

  const handleSave = () => {
    if (!selectedApplicant || !selectedApplicant.currentRound || !currentUser) return;

    const primaryUser = users.find((user) => user.id === draft.primaryInterviewerId) ?? null;
    const secondaryUser = users.find((user) => user.id === draft.secondaryInterviewerId) ?? null;

    if (!primaryUser || !isValidAssignmentForRole('primary', primaryUser)) {
      toast({
        title: 'Primary interviewer required',
        description: 'Select a PM or Partner as the primary interviewer.',
        variant: 'destructive',
      });
      return;
    }

    if (!secondaryUser || !isValidAssignmentForRole('secondary', secondaryUser)) {
      toast({
        title: 'Secondary interviewer required',
        description: 'Select a Consultant or LC as the secondary interviewer.',
        variant: 'destructive',
      });
      return;
    }

    const scheduledTime = draft.scheduledTime.trim() || null;
    const room = draft.room.trim() || null;
    const assignedAt = new Date().toISOString();

    recruitingStore.upsertAssignment({
      id: `assignment-${selectedApplicant.id}-${selectedApplicant.currentRound}-primary`,
      applicantId: selectedApplicant.id,
      round: selectedApplicant.currentRound,
      role: 'primary',
      interviewerId: primaryUser.id,
      assignedByUserId: currentUser.id,
      assignedAt,
      room,
      scheduledTime,
    });

    recruitingStore.upsertAssignment({
      id: `assignment-${selectedApplicant.id}-${selectedApplicant.currentRound}-secondary`,
      applicantId: selectedApplicant.id,
      round: selectedApplicant.currentRound,
      role: 'secondary',
      interviewerId: secondaryUser.id,
      assignedByUserId: currentUser.id,
      assignedAt,
      room,
      scheduledTime,
    });

    toast({
      title: 'Interview assignment saved',
      description: `${selectedApplicant.name} now has ${primaryUser.name} and ${secondaryUser.name} assigned for ${getInterviewRoundLabel(selectedApplicant.currentRound)}.`,
    });
  };

  const applicantCards = eligibleApplicants.map((applicant) => {
    const currentAssignments = getCurrentRoundAssignments(assignments, applicant.id, applicant.currentRound!);
    const primaryAssignment = currentAssignments.find((assignment) => assignment.role === 'primary') ?? null;
    const secondaryAssignment = currentAssignments.find((assignment) => assignment.role === 'secondary') ?? null;
    const primaryUser = users.find((user) => user.id === primaryAssignment?.interviewerId) ?? null;
    const secondaryUser = users.find((user) => user.id === secondaryAssignment?.interviewerId) ?? null;
    const fullyAssigned = Boolean(primaryAssignment && secondaryAssignment);

    return (
      <button
        key={applicant.id}
        type="button"
        onClick={() => handleApplicantChange(applicant.id)}
        className={[
          'rounded-3xl border p-5 text-left transition-all',
          draft.applicantId === applicant.id
            ? 'border-cyan-300/40 bg-cyan-400/10 shadow-[0_20px_60px_rgba(34,211,238,0.12)]'
            : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]',
        ].join(' ')}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-white/40">
              {getApplicationStatusLabel(applicant.status)} • {getInterviewRoundLabel(applicant.currentRound)}
            </p>
            <h3 className="mt-2 text-lg font-semibold text-white">{applicant.name}</h3>
            <p className="mt-1 text-sm text-white/55">
              {applicant.teamApplyingFor} • Cycle {applicant.cycle} • {applicant.schoolYear}
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
            <p className="mt-2 text-sm font-medium text-white">{primaryUser?.name ?? 'Unassigned'}</p>
            <p className="mt-1 text-xs text-white/50">{primaryUser ? getDisplayRole(primaryUser.role) : 'PM or Partner only'}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
            <p className="text-[11px] uppercase tracking-[0.2em] text-white/40">Secondary</p>
            <p className="mt-2 text-sm font-medium text-white">{secondaryUser?.name ?? 'Unassigned'}</p>
            <p className="mt-1 text-xs text-white/50">{secondaryUser ? getDisplayRole(secondaryUser.role) : 'Consultant or LC only'}</p>
          </div>
        </div>
      </button>
    );
  });

  const assignmentRows = useMemo(() => {
    const grouped = new Map<string, { applicant: Applicant; primary: Assignment | null; secondary: Assignment | null }>();

    eligibleApplicants.forEach((applicant) => {
      const currentAssignments = getCurrentRoundAssignments(assignments, applicant.id, applicant.currentRound!);
      grouped.set(applicant.id, {
        applicant,
        primary: currentAssignments.find((assignment) => assignment.role === 'primary') ?? null,
        secondary: currentAssignments.find((assignment) => assignment.role === 'secondary') ?? null,
      });
    });

    return Array.from(grouped.values()).sort(
      (left, right) =>
        new Date(
          right.primary?.assignedAt ?? right.secondary?.assignedAt ?? right.applicant.updatedAt
        ).getTime() -
        new Date(left.primary?.assignedAt ?? left.secondary?.assignedAt ?? left.applicant.updatedAt).getTime()
    );
  }, [assignments, eligibleApplicants]);

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
                This page sits directly beside <span className="text-white/80">#/tech/manage</span> and uses the shared recruiting store to staff active interview rounds without a backend dependency.
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
                  Primary is limited to PM or Partner. Secondary is limited to Consultant or LC. Room and time stay optional.
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
                          {applicant.name} • {getInterviewRoundLabel(applicant.currentRound)}
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
                        Select PM or Partner
                      </option>
                      {primaryCandidates.map((user) => (
                        <option key={user.id} value={user.id} className="bg-slate-900 text-white">
                          {user.name} • {getDisplayRole(user.role)}
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
                      {secondaryCandidates.map((user) => (
                        <option key={user.id} value={user.id} className="bg-slate-900 text-white">
                          {user.name} • {getDisplayRole(user.role)}
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
                    <p className="mt-2 text-sm text-white/75">Only Partner or PM can be saved into the primary slot.</p>
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
                  onClick={handleSave}
                  disabled={!selectedApplicant || !currentUser}
                  className="h-11 w-full bg-cyan-500 text-slate-950 hover:bg-cyan-400"
                >
                  Save manual assignment
                </Button>

                {currentUser ? (
                  <p className="text-xs uppercase tracking-[0.2em] text-white/40">
                    Acting as {currentUser.name} • {getDisplayRole(currentUser.role)} for local shared-state saves
                  </p>
                ) : null}
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6 border-white/10 bg-[linear-gradient(180deg,rgba(17,25,40,0.98),rgba(8,13,22,0.99))] shadow-[0_24px_60px_rgba(0,0,0,0.34)]">
            <CardHeader>
              <CardTitle className="text-white">Current assignments</CardTitle>
              <CardDescription>
                Existing assignments are read directly from the shared recruiting store and grouped per applicant and round.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {assignmentRows.length > 0 ? (
                assignmentRows.map(({ applicant, primary, secondary }) => {
                  const primaryUser = users.find((user) => user.id === primary?.interviewerId) ?? null;
                  const secondaryUser = users.find((user) => user.id === secondary?.interviewerId) ?? null;
                  const assignedBy = users.find((user) => user.id === (primary?.assignedByUserId ?? secondary?.assignedByUserId ?? '')) ?? null;
                  const scheduleSource = primary ?? secondary;

                  return (
                    <div
                      key={applicant.id}
                      className="grid gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-5 xl:grid-cols-[1.2fr_0.8fr_0.7fr]"
                    >
                      <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-white/40">
                          {applicant.name} • {getInterviewRoundLabel(applicant.currentRound)}
                        </p>
                        <p className="mt-2 text-sm text-white/60">
                          {applicant.email} • {applicant.teamApplyingFor} • Cycle {applicant.cycle}
                        </p>
                        <p className="mt-3 text-sm text-white/70">{applicant.notes}</p>
                      </div>

                      <div className="grid gap-3">
                        <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                          <p className="text-[11px] uppercase tracking-[0.2em] text-white/40">Primary</p>
                          <p className="mt-2 text-sm font-medium text-white">{primaryUser?.name ?? 'Unassigned'}</p>
                          <p className="mt-1 text-xs text-white/50">{primaryUser ? getDisplayRole(primaryUser.role) : 'PM or Partner'}</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                          <p className="text-[11px] uppercase tracking-[0.2em] text-white/40">Secondary</p>
                          <p className="mt-2 text-sm font-medium text-white">{secondaryUser?.name ?? 'Unassigned'}</p>
                          <p className="mt-1 text-xs text-white/50">{secondaryUser ? getDisplayRole(secondaryUser.role) : 'Consultant or LC'}</p>
                        </div>
                      </div>

                      <div className="grid gap-3">
                        <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                          <p className="text-[11px] uppercase tracking-[0.2em] text-white/40">Schedule</p>
                          <p className="mt-2 flex items-center gap-2 text-sm text-white">
                            <CalendarClock className="h-4 w-4 text-cyan-200" />
                            {formatDateTime(scheduleSource?.scheduledTime ?? null)}
                          </p>
                          <p className="mt-2 flex items-center gap-2 text-sm text-white/70">
                            <DoorOpen className="h-4 w-4 text-cyan-200" />
                            {scheduleSource?.room ?? 'TBD'}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                          <p className="text-[11px] uppercase tracking-[0.2em] text-white/40">Saved</p>
                          <p className="mt-2 text-sm text-white">{formatAssignedAt(primary?.assignedAt ?? secondary?.assignedAt ?? applicant.updatedAt)}</p>
                          <p className="mt-1 text-xs text-white/50">By {assignedBy?.name ?? 'Shared recruiting store'}</p>
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
