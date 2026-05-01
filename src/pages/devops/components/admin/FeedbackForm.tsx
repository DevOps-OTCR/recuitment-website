import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

import {
  feedbackMetricFields,
  type ApplicantRecord,
  type DecisionValue,
  type FeedbackEntry,
  type IntervieweeGender,
  type InterviewRound,
  type InterviewerRole,
} from './types';

interface FeedbackFormProps {
  applicants: ApplicantRecord[];
  initialApplicantId?: number | null;
  initialRound?: InterviewRound;
  initialEntry?: FeedbackEntry | null;
  lockedInterviewerName?: string | null;
  lockedIntervieweeName?: string | null;
  lockedInterviewerRole?: InterviewerRole | null;
  lockedRound?: InterviewRound | null;
  onSubmitFeedback: (entry: Omit<FeedbackEntry, 'id' | 'submittedAt'>) => Promise<void> | void;
  submitting?: boolean;
}

interface FeedbackFormState {
  interviewerName: string;
  intervieweeName: string;
  intervieweeGender: IntervieweeGender;
  interviewerRole: InterviewerRole;
  round: InterviewRound;
  leadershipScore: string;
  interestInOtcrScore: string;
  behavioralPerformanceScore: string;
  businessAcumenScore: string;
  qualitativeCreativityScore: string;
  quantitativeStructureScore: string;
  casePerformanceScore: string;
  creativityConversationScore: string;
  recommendation: DecisionValue;
  finalRoundSummary: string;
  overallPerformanceOverview: string;
}

const nameKey = (value: string) => value.trim().replace(/\s+/g, ' ').toLowerCase();
const FEEDBACK_DRAFT_STORAGE = 'otcr_consultant_feedback_draft';

const initialState = (intervieweeName = '', round: InterviewRound = 'Round 1'): FeedbackFormState => ({
  interviewerName: '',
  intervieweeName,
  intervieweeGender: 'Other',
  interviewerRole: 'Primary',
  round,
  leadershipScore: '2',
  interestInOtcrScore: '2',
  behavioralPerformanceScore: '2',
  businessAcumenScore: '2',
  qualitativeCreativityScore: '2',
  quantitativeStructureScore: '2',
  casePerformanceScore: '2',
  creativityConversationScore: '2',
  recommendation: 'MAYBE',
  finalRoundSummary: '',
  overallPerformanceOverview: '',
});

const stateFromEntry = (entry: FeedbackEntry): FeedbackFormState => ({
  interviewerName: entry.interviewerName,
  intervieweeName: entry.intervieweeName,
  intervieweeGender: entry.intervieweeGender,
  interviewerRole: entry.interviewerRole,
  round: entry.round,
  leadershipScore: String(entry.leadershipScore),
  interestInOtcrScore: String(entry.interestInOtcrScore),
  behavioralPerformanceScore: String(entry.behavioralPerformanceScore),
  businessAcumenScore: String(entry.businessAcumenScore),
  qualitativeCreativityScore: String(entry.qualitativeCreativityScore),
  quantitativeStructureScore: String(entry.quantitativeStructureScore),
  casePerformanceScore: String(entry.casePerformanceScore),
  creativityConversationScore: String(entry.creativityConversationScore),
  recommendation: entry.recommendation,
  finalRoundSummary: entry.finalRoundSummary,
  overallPerformanceOverview: entry.overallPerformanceOverview,
});

const recommendationOptions: { value: DecisionValue; label: string; helper: string }[] = [
  { value: 'YES', label: 'Yes', helper: 'Strong move-forward recommendation.' },
  { value: 'LEAN YES', label: 'Lean Yes', helper: 'Positive overall, with some reservations.' },
  { value: 'MAYBE', label: 'Maybe', helper: 'Only use when you truly cannot lean either way.' },
  { value: 'LEAN NO', label: 'Lean No', helper: 'Negative overall, but not a full stop.' },
  { value: 'NO', label: 'No', helper: 'Clear do-not-move-forward recommendation.' },
];

const selectableRatingOptions = [
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '3', label: '3' },
] as const;

const restoreFeedbackDraft = (intervieweeName = '', round: InterviewRound = 'Round 1'): FeedbackFormState => {
  const fallback = initialState(intervieweeName, round);
  if (typeof window === 'undefined') return fallback;

  try {
    const stored = sessionStorage.getItem(FEEDBACK_DRAFT_STORAGE);
    if (!stored) return fallback;

    const parsed = JSON.parse(stored) as Partial<FeedbackFormState> | null;
    if (!parsed || typeof parsed !== 'object') return fallback;

    return {
      ...fallback,
      ...parsed,
      intervieweeName:
        typeof parsed.intervieweeName === 'string' && parsed.intervieweeName.trim().length > 0
          ? parsed.intervieweeName
          : fallback.intervieweeName,
    };
  } catch (error) {
    console.warn('Failed to restore feedback draft', error);
    return fallback;
  }
};

const isPristineFeedbackDraft = (form: FeedbackFormState, intervieweeName = '', round: InterviewRound = 'Round 1') =>
  JSON.stringify(form) === JSON.stringify(initialState(intervieweeName, round));

const countSubstringMatches = (source: string, query: string) => {
  if (!query) return 0;

  let count = 0;
  let searchIndex = 0;

  while (searchIndex < source.length) {
    const matchIndex = source.indexOf(query, searchIndex);
    if (matchIndex === -1) break;
    count += 1;
    searchIndex = matchIndex + 1;
  }

  return count;
};

const ChoicePillGroup = <T extends string>({
  value,
  onChange,
  options,
  columnsClassName = 'sm:grid-cols-3',
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string; helper?: string }[];
  columnsClassName?: string;
}) => (
  <RadioGroup value={value} onValueChange={(nextValue) => onChange(nextValue as T)} className={cn('grid gap-2', columnsClassName)}>
    {options.map((option) => {
      const isActive = value === option.value;
      const id = `${option.value}-${option.label}`.replace(/\s+/g, '-').toLowerCase();

      return (
        <Label
          key={option.value}
          htmlFor={id}
          className={cn(
            'flex min-h-[60px] cursor-pointer flex-col justify-between rounded-2xl border px-3 py-3 transition-all sm:min-h-[68px]',
            isActive
              ? 'border-cyan-300/50 bg-cyan-400/10 text-white shadow-[0_12px_30px_rgba(56,189,248,0.16)]'
              : 'border-white/10 bg-white/[0.03] text-white/70 hover:border-white/20 hover:bg-white/[0.05]'
          )}
        >
          <RadioGroupItem id={id} value={option.value} className="sr-only" />
          <span className="text-sm font-medium">{option.label}</span>
          {option.helper ? <span className="mt-1 text-[11px] leading-4 text-white/45 sm:text-xs sm:leading-5">{option.helper}</span> : null}
        </Label>
      );
    })}
  </RadioGroup>
);

const FeedbackForm = ({
  applicants,
  initialApplicantId,
  initialRound = 'Round 1',
  initialEntry = null,
  lockedInterviewerName = null,
  lockedIntervieweeName = null,
  lockedInterviewerRole = null,
  lockedRound = null,
  onSubmitFeedback,
  submitting = false,
}: FeedbackFormProps) => {
  const initialApplicant = useMemo(
    () => applicants.find((candidate) => candidate.id === initialApplicantId) ?? null,
    [applicants, initialApplicantId]
  );
  const intervieweeFieldRef = useRef<HTMLDivElement | null>(null);
  const [form, setForm] = useState<FeedbackFormState>(() => {
    const restored = initialEntry
      ? stateFromEntry(initialEntry)
      : restoreFeedbackDraft(lockedIntervieweeName ?? initialApplicant?.name ?? '', lockedRound ?? initialRound);
    return {
      ...restored,
      interviewerName: lockedInterviewerName ?? restored.interviewerName,
      intervieweeName: lockedIntervieweeName ?? restored.intervieweeName,
      interviewerRole: lockedInterviewerRole ?? restored.interviewerRole,
      round: lockedRound ?? restored.round,
    };
  });
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [isIntervieweeMenuOpen, setIsIntervieweeMenuOpen] = useState(false);
  const [highlightedApplicantIndex, setHighlightedApplicantIndex] = useState(0);
  const previousInitialApplicantNameRef = useRef(initialApplicant?.name ?? '');
  const previousEntryIdRef = useRef(initialEntry?.id ?? null);

  useEffect(() => {
    const currentEntryId = initialEntry?.id ?? null;
    const previousEntryId = previousEntryIdRef.current;
    previousEntryIdRef.current = currentEntryId;

    if (currentEntryId === previousEntryId) return;

    if (initialEntry) {
      const nextState = stateFromEntry(initialEntry);
      setForm({
        ...nextState,
        interviewerName: lockedInterviewerName ?? nextState.interviewerName,
        intervieweeName: lockedIntervieweeName ?? nextState.intervieweeName,
        interviewerRole: lockedInterviewerRole ?? nextState.interviewerRole,
        round: lockedRound ?? nextState.round,
      });
      setValidationMessage(null);
      return;
    }

    const fallback = initialState(lockedIntervieweeName ?? initialApplicant?.name ?? '', lockedRound ?? initialRound);
    setForm({
      ...fallback,
      interviewerName: lockedInterviewerName ?? fallback.interviewerName,
      intervieweeName: lockedIntervieweeName ?? fallback.intervieweeName,
      interviewerRole: lockedInterviewerRole ?? fallback.interviewerRole,
      round: lockedRound ?? fallback.round,
    });
    setValidationMessage(null);
  }, [
    initialApplicant?.name,
    initialEntry,
    initialRound,
    lockedIntervieweeName,
    lockedInterviewerName,
    lockedInterviewerRole,
    lockedRound,
  ]);

  useEffect(() => {
    const nextInitialApplicantName = initialApplicant?.name ?? '';
    const previousInitialApplicantName = previousInitialApplicantNameRef.current;
    previousInitialApplicantNameRef.current = nextInitialApplicantName;

    if (!nextInitialApplicantName) return;

    setForm((current) => {
      const currentIntervieweeName = current.intervieweeName.trim();
      const previousInitialNameMatches =
        previousInitialApplicantName.trim().length > 0 &&
        nameKey(current.intervieweeName) === nameKey(previousInitialApplicantName);

      if (!currentIntervieweeName || previousInitialNameMatches) {
        return { ...current, intervieweeName: nextInitialApplicantName };
      }

      return current;
    });
  }, [initialApplicant?.name]);

  useEffect(() => {
    if (!lockedInterviewerName) return;
    setForm((current) => {
      if (current.interviewerName === lockedInterviewerName) return current;
      return { ...current, interviewerName: lockedInterviewerName };
    });
  }, [lockedInterviewerName]);

  useEffect(() => {
    if (!lockedIntervieweeName) return;
    setForm((current) => {
      if (current.intervieweeName === lockedIntervieweeName) return current;
      return { ...current, intervieweeName: lockedIntervieweeName };
    });
  }, [lockedIntervieweeName]);

  useEffect(() => {
    if (!lockedInterviewerRole) return;
    setForm((current) => {
      if (current.interviewerRole === lockedInterviewerRole) return current;
      return { ...current, interviewerRole: lockedInterviewerRole };
    });
  }, [lockedInterviewerRole]);

  useEffect(() => {
    const nextRound = lockedRound ?? initialRound;
    setForm((current) => {
      if (current.round === nextRound) return current;
      return { ...current, round: nextRound };
    });
  }, [initialRound, lockedRound]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      if (isPristineFeedbackDraft(form, lockedIntervieweeName ?? initialApplicant?.name ?? '', lockedRound ?? initialRound)) {
        sessionStorage.removeItem(FEEDBACK_DRAFT_STORAGE);
        return;
      }

      sessionStorage.setItem(FEEDBACK_DRAFT_STORAGE, JSON.stringify(form));
    } catch (error) {
      console.warn('Failed to save feedback draft', error);
    }
  }, [form, initialApplicant?.name, initialRound, lockedIntervieweeName, lockedRound]);

  useEffect(() => {
    if (lockedIntervieweeName) {
      setIsIntervieweeMenuOpen(false);
    }
  }, [lockedIntervieweeName]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!intervieweeFieldRef.current?.contains(event.target as Node)) {
        setIsIntervieweeMenuOpen(false);
      }
    };

    window.addEventListener('mousedown', handlePointerDown);
    return () => window.removeEventListener('mousedown', handlePointerDown);
  }, []);

  const matchedApplicant = useMemo(() => {
    const lookup = nameKey(form.intervieweeName);
    if (!lookup) return initialApplicant;
    return applicants.find((candidate) => nameKey(candidate.name) === lookup) ?? null;
  }, [applicants, form.intervieweeName, initialApplicant]);

  const applicantNameOptions = useMemo(
    () =>
      Array.from(new Set(applicants.map((candidate) => candidate.name.trim()).filter(Boolean))).sort((left, right) =>
        left.localeCompare(right)
      ),
    [applicants]
  );

  const intervieweeQuery = form.intervieweeName.trim();
  const filteredApplicantNameOptions = useMemo(() => {
    const normalizedQuery = nameKey(intervieweeQuery);
    if (!normalizedQuery) {
      return applicantNameOptions.slice(0, 12);
    }

    return applicantNameOptions
      .map((name) => {
        const normalizedName = nameKey(name);
        const matchIndex = normalizedName.indexOf(normalizedQuery);
        const matchedCharacters = countSubstringMatches(normalizedName, normalizedQuery) * normalizedQuery.length;
        return { name, matchIndex, matchedCharacters };
      })
      .filter((entry) => entry.matchIndex !== -1)
      .sort((left, right) => {
        if (left.matchedCharacters !== right.matchedCharacters) {
          return right.matchedCharacters - left.matchedCharacters;
        }
        if (left.matchIndex !== right.matchIndex) {
          return left.matchIndex - right.matchIndex;
        }
        return left.name.localeCompare(right.name);
      })
      .map((entry) => entry.name)
      .slice(0, 12);
  }, [applicantNameOptions, intervieweeQuery]);

  useEffect(() => {
    setHighlightedApplicantIndex(0);
  }, [intervieweeQuery]);

  const selectIntervieweeName = (name: string) => {
    setForm((current) => ({ ...current, intervieweeName: name }));
    setIsIntervieweeMenuOpen(false);
    setHighlightedApplicantIndex(0);
  };

  const handleIntervieweeNameKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isIntervieweeMenuOpen) {
      if (event.key === 'ArrowDown' && filteredApplicantNameOptions.length > 0) {
        event.preventDefault();
        setIsIntervieweeMenuOpen(true);
      }
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlightedApplicantIndex((current) =>
        Math.min(current + 1, filteredApplicantNameOptions.length - 1)
      );
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightedApplicantIndex((current) => Math.max(current - 1, 0));
      return;
    }

    if (event.key === 'Enter' && filteredApplicantNameOptions[highlightedApplicantIndex]) {
      event.preventDefault();
      selectIntervieweeName(filteredApplicantNameOptions[highlightedApplicantIndex]);
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      setIsIntervieweeMenuOpen(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const missingFields: string[] = [];

    if (!form.interviewerName.trim()) missingFields.push('your name');
    if (!matchedApplicant) missingFields.push("a valid interviewee name");
    if (!form.finalRoundSummary.trim()) missingFields.push('the final-round summary');
    if (!form.overallPerformanceOverview.trim()) missingFields.push('the overall performance overview');

    if (missingFields.length > 0) {
      setValidationMessage(`Missing: ${missingFields.join(', ')}.`);
      return;
    }

    setValidationMessage(null);

    await onSubmitFeedback({
      applicantId: matchedApplicant.id,
      applicantName: matchedApplicant.name,
      interviewerName: form.interviewerName.trim(),
      intervieweeName: matchedApplicant.name,
      intervieweeGender: form.intervieweeGender,
      interviewerRole: form.interviewerRole,
      round: form.round,
      leadershipScore: Number(form.leadershipScore) as FeedbackEntry['leadershipScore'],
      interestInOtcrScore: Number(form.interestInOtcrScore) as FeedbackEntry['interestInOtcrScore'],
      behavioralPerformanceScore: Number(form.behavioralPerformanceScore) as FeedbackEntry['behavioralPerformanceScore'],
      businessAcumenScore: Number(form.businessAcumenScore) as FeedbackEntry['businessAcumenScore'],
      qualitativeCreativityScore: Number(form.qualitativeCreativityScore) as FeedbackEntry['qualitativeCreativityScore'],
      quantitativeStructureScore: Number(form.quantitativeStructureScore) as FeedbackEntry['quantitativeStructureScore'],
      casePerformanceScore: Number(form.casePerformanceScore) as FeedbackEntry['casePerformanceScore'],
      creativityConversationScore: Number(form.creativityConversationScore) as FeedbackEntry['creativityConversationScore'],
      recommendation: form.recommendation,
      finalRoundSummary: form.finalRoundSummary.trim(),
      overallPerformanceOverview: form.overallPerformanceOverview.trim(),
    });

    setValidationMessage(null);
  };

  return (
    <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(17,25,40,0.97),rgba(8,13,22,0.99))] shadow-[0_24px_70px_rgba(0,0,0,0.34)]">
      <CardHeader className="space-y-2 px-4 pb-4 pt-4 sm:px-5">
        <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/70">Interviewer feedback</p>
        <CardTitle className="text-xl text-white sm:text-2xl">Consultant review form</CardTitle>
        <p className="text-sm leading-6 text-white/55">
          Use the interviewee&apos;s exact applicant name so the submission attaches to the correct profile in the Applicants view.
        </p>
        <p className="text-sm leading-6 text-white/45">
          Unsaved responses stay on this browser if you switch pages and come back before submitting.
        </p>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0 sm:px-5 sm:pb-5">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="interviewerName" className="text-white/70">Your Name</Label>
              <Input
                id="interviewerName"
                value={form.interviewerName}
                onChange={(event) => setForm((current) => ({ ...current, interviewerName: event.target.value }))}
                className="h-11 border-white/10 bg-white/5 text-white"
                placeholder="Interviewer name"
                readOnly={Boolean(lockedInterviewerName)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="intervieweeName" className="text-white/70">Interviewee&apos;s Name (double check spelling)</Label>
              <div ref={intervieweeFieldRef} className="relative">
                {!lockedIntervieweeName ? (
                  <Search className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-white/35" />
                ) : null}
                <Input
                  id="intervieweeName"
                  value={form.intervieweeName}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    setForm((current) => ({ ...current, intervieweeName: nextValue }));
                    if (!lockedIntervieweeName) {
                      setIsIntervieweeMenuOpen(true);
                    }
                  }}
                  onFocus={() => {
                    if (!lockedIntervieweeName) {
                      setIsIntervieweeMenuOpen(true);
                    }
                  }}
                  onKeyDown={handleIntervieweeNameKeyDown}
                  className={cn(
                    'h-11 border-white/10 bg-white/5 text-white',
                    !lockedIntervieweeName && 'pl-9'
                  )}
                  placeholder="Search"
                  readOnly={Boolean(lockedIntervieweeName)}
                  autoComplete="off"
                />
                {!lockedIntervieweeName && isIntervieweeMenuOpen ? (
                  <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-20 overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(17,25,40,0.99),rgba(8,13,22,1))] shadow-[0_22px_60px_rgba(0,0,0,0.45)]">
                    {filteredApplicantNameOptions.length > 0 ? (
                      <div className="max-h-64 overflow-y-auto p-2">
                        {filteredApplicantNameOptions.map((name, index) => {
                          const isHighlighted = index === highlightedApplicantIndex;
                          const isSelected = nameKey(form.intervieweeName) === nameKey(name);

                          return (
                            <button
                              key={name}
                              type="button"
                              onMouseDown={(event) => event.preventDefault()}
                              onMouseEnter={() => setHighlightedApplicantIndex(index)}
                              onClick={() => selectIntervieweeName(name)}
                              className={cn(
                                'flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-left transition-all',
                                isHighlighted || isSelected
                                  ? 'bg-cyan-400/10 text-white'
                                  : 'text-white/75 hover:bg-white/[0.05] hover:text-white'
                              )}
                            >
                              <span className="truncate text-sm font-medium">{name}</span>
                            </button>
                          );
                        })}
                      </div>
                    ) : intervieweeQuery ? (
                      <div className="px-3 py-4 text-sm text-white/50">
                        No applicants contain that search.
                      </div>
                    ) : (
                      <div className="px-3 py-4 text-sm text-white/50">
                        Type a letter to search all applicants by name.
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
              {matchedApplicant ? (
                <div className="flex items-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
                  <CheckCircle2 className="h-4 w-4" />
                  Matched applicant: {matchedApplicant.name} ({matchedApplicant.cycle_name ?? 'No cycle'})
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
                  <AlertCircle className="h-4 w-4" />
                  The name must match an applicant in the Applicants view before this review can be saved.
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div className="space-y-3">
              <Label className="text-white/70">Interviewee&apos;s Gender</Label>
              <ChoicePillGroup
                value={form.intervieweeGender}
                onChange={(value) => setForm((current) => ({ ...current, intervieweeGender: value }))}
                options={[
                  { value: 'Male', label: 'Male' },
                  { value: 'Female', label: 'Female' },
                  { value: 'Other', label: 'Other' },
                ]}
              />
            </div>

            <div className="space-y-3">
              <Label className="text-white/70">Are you the primary or secondary interviewer?</Label>
              {lockedInterviewerRole ? (
                <div className="rounded-2xl border border-cyan-300/30 bg-cyan-400/10 px-4 py-3 text-sm font-medium text-white">
                  {lockedInterviewerRole} interviewer
                </div>
              ) : (
                <ChoicePillGroup
                  value={form.interviewerRole}
                  onChange={(value) => setForm((current) => ({ ...current, interviewerRole: value }))}
                  options={[
                    { value: 'Primary', label: 'Primary' },
                    { value: 'Secondary', label: 'Secondary' },
                  ]}
                  columnsClassName="sm:grid-cols-2"
                />
              )}
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-white/70">Interview round</Label>
            {lockedRound ? (
              <div className="rounded-2xl border border-cyan-300/30 bg-cyan-400/10 px-4 py-3 text-sm font-medium text-white">
                {lockedRound}
              </div>
            ) : (
              <ChoicePillGroup
                value={form.round}
                onChange={(value) => setForm((current) => ({ ...current, round: value }))}
                options={[
                  { value: 'Round 1', label: 'Round 1' },
                  { value: 'Round 2', label: 'Round 2' },
                ]}
                columnsClassName="sm:grid-cols-2"
              />
            )}
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/65">Ratings</p>
              <p className="mt-1 text-sm text-white/55">
                Each rubric area uses static end labels with only the numeric options selectable.
              </p>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              {feedbackMetricFields.map((field) => (
                <div key={field.key} className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-sm font-medium text-white">{field.label}</p>
                  <p className="mt-2 text-sm leading-6 text-white/45">{field.description}</p>
                  <div className="mt-3 flex items-center justify-between gap-4 text-[11px] uppercase tracking-[0.18em] text-white/35">
                    <span>Below Expectations</span>
                    <span>Above Expectations</span>
                  </div>
                  <RadioGroup
                    value={form[field.key]}
                    onValueChange={(value) => setForm((current) => ({ ...current, [field.key]: value }))}
                    className="mt-3 grid grid-cols-3 gap-2"
                  >
                    {selectableRatingOptions.map((option) => {
                      const optionId = `${field.key}-${option.value}`;
                      const isActive = form[field.key] === String(option.value);

                      return (
                        <Label
                          key={optionId}
                          htmlFor={optionId}
                          className={cn(
                            'flex min-h-[68px] cursor-pointer items-start justify-start rounded-2xl border px-4 py-3 transition-all sm:min-h-[76px]',
                            isActive
                              ? 'border-cyan-300/50 bg-cyan-400/10 text-white shadow-[0_10px_24px_rgba(56,189,248,0.16)]'
                              : 'border-white/10 bg-black/20 text-white/65 hover:border-white/20 hover:bg-white/[0.05]'
                          )}
                        >
                          <RadioGroupItem id={optionId} value={String(option.value)} className="sr-only" />
                          <span className="text-xl font-semibold">{option.label}</span>
                        </Label>
                      );
                    })}
                  </RadioGroup>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-white/70">Overall recommendation</Label>
            <ChoicePillGroup
              value={form.recommendation}
              onChange={(value) => setForm((current) => ({ ...current, recommendation: value }))}
              options={recommendationOptions}
              columnsClassName="md:grid-cols-5"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="finalRoundSummary" className="text-white/70">
              Please write a short summary of anything you think would be important to see from the interviewee in the final round.
            </Label>
            <p className="text-sm leading-6 text-white/45">
              Use N/A if this is an obvious no. The goal is to tell the final-round interviewer what to push on and what concerns to watch.
            </p>
            <Textarea
              id="finalRoundSummary"
              value={form.finalRoundSummary}
              onChange={(event) => setForm((current) => ({ ...current, finalRoundSummary: event.target.value }))}
              className="min-h-[110px] border-white/10 bg-white/5 text-white"
              placeholder="What should the final-round interviewer probe further?"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="overallPerformanceOverview" className="text-white/70">
              Please provide a general overview of their overall performance.
            </Label>
            <p className="text-sm leading-6 text-white/45">
              Put your answer first, then the explanation. A yes, lean yes, lean no, or no perspective is the most useful for deliberations.
            </p>
            <Textarea
              id="overallPerformanceOverview"
              value={form.overallPerformanceOverview}
              onChange={(event) => setForm((current) => ({ ...current, overallPerformanceOverview: event.target.value }))}
              className="min-h-[120px] border-white/10 bg-white/5 text-white"
              placeholder="Example: LEAN YES. Strong behavioral signal and composure, but I would still test quantitative structuring harder in the final round."
            />
          </div>

          {validationMessage ? (
            <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              {validationMessage}
            </div>
          ) : null}

          <Button
            type="submit"
            className="w-full cursor-pointer rounded-xl border border-cyan-100/50 bg-cyan-300 text-slate-950 shadow-[0_14px_34px_rgba(34,211,238,0.24)] transition-all duration-200 hover:bg-cyan-100 hover:shadow-[0_0_42px_rgba(103,232,249,0.55)] hover:ring-2 hover:ring-cyan-200/70 hover:ring-offset-2 hover:ring-offset-slate-950"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {initialEntry ? 'Updating response...' : 'Saving feedback...'}
              </>
            ) : (
              initialEntry ? 'Edit response' : 'Save feedback'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default FeedbackForm;
