import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

import {
  feedbackMetricFields,
  ratingBandOptions,
  type ApplicantRecord,
  type DecisionValue,
  type FeedbackEntry,
  type IntervieweeGender,
  type InterviewerRole,
} from './types';

interface FeedbackFormProps {
  applicants: ApplicantRecord[];
  initialApplicantId?: number | null;
  onSubmitFeedback: (entry: Omit<FeedbackEntry, 'id' | 'submittedAt'>) => void;
}

interface FeedbackFormState {
  interviewerName: string;
  intervieweeName: string;
  intervieweeGender: IntervieweeGender;
  interviewerRole: InterviewerRole;
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

const initialState = (intervieweeName = ''): FeedbackFormState => ({
  interviewerName: '',
  intervieweeName,
  intervieweeGender: 'Other',
  interviewerRole: 'Primary',
  leadershipScore: '3',
  interestInOtcrScore: '3',
  behavioralPerformanceScore: '3',
  businessAcumenScore: '3',
  qualitativeCreativityScore: '3',
  quantitativeStructureScore: '3',
  casePerformanceScore: '3',
  creativityConversationScore: '3',
  recommendation: 'MAYBE',
  finalRoundSummary: '',
  overallPerformanceOverview: '',
});

const recommendationOptions: { value: DecisionValue; label: string; helper: string }[] = [
  { value: 'YES', label: 'Yes', helper: 'Strong move-forward recommendation.' },
  { value: 'LEAN YES', label: 'Lean Yes', helper: 'Positive overall, with some reservations.' },
  { value: 'MAYBE', label: 'Maybe', helper: 'Only use when you truly cannot lean either way.' },
  { value: 'LEAN NO', label: 'Lean No', helper: 'Negative overall, but not a full stop.' },
  { value: 'NO', label: 'No', helper: 'Clear do-not-move-forward recommendation.' },
];

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
            'flex min-h-[72px] cursor-pointer flex-col justify-between rounded-2xl border px-4 py-3 transition-all',
            isActive
              ? 'border-cyan-300/50 bg-cyan-400/10 text-white shadow-[0_12px_30px_rgba(56,189,248,0.16)]'
              : 'border-white/10 bg-white/[0.03] text-white/70 hover:border-white/20 hover:bg-white/[0.05]'
          )}
        >
          <RadioGroupItem id={id} value={option.value} className="sr-only" />
          <span className="text-sm font-medium">{option.label}</span>
          {option.helper ? <span className="mt-2 text-xs leading-5 text-white/45">{option.helper}</span> : null}
        </Label>
      );
    })}
  </RadioGroup>
);

const FeedbackForm = ({ applicants, initialApplicantId, onSubmitFeedback }: FeedbackFormProps) => {
  const initialApplicant = useMemo(
    () => applicants.find((candidate) => candidate.id === initialApplicantId) ?? null,
    [applicants, initialApplicantId]
  );
  const [form, setForm] = useState<FeedbackFormState>(initialState(initialApplicant?.name ?? ''));

  useEffect(() => {
    setForm(initialState(initialApplicant?.name ?? ''));
  }, [initialApplicant?.name]);

  const matchedApplicant = useMemo(() => {
    const lookup = nameKey(form.intervieweeName);
    if (!lookup) return initialApplicant;
    return applicants.find((candidate) => nameKey(candidate.name) === lookup) ?? null;
  }, [applicants, form.intervieweeName, initialApplicant]);

  const canSubmit =
    applicants.length > 0 &&
    Boolean(matchedApplicant) &&
    Boolean(form.interviewerName.trim()) &&
    Boolean(form.finalRoundSummary.trim()) &&
    Boolean(form.overallPerformanceOverview.trim());

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!matchedApplicant) return;

    onSubmitFeedback({
      applicantId: matchedApplicant.id,
      applicantName: matchedApplicant.name,
      interviewerName: form.interviewerName.trim(),
      intervieweeName: matchedApplicant.name,
      intervieweeGender: form.intervieweeGender,
      interviewerRole: form.interviewerRole,
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

    setForm(initialState(initialApplicant?.name ?? ''));
  };

  const applicantNameOptions = applicants.map((candidate) => candidate.name);

  return (
    <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(17,25,40,0.97),rgba(8,13,22,0.99))] shadow-[0_24px_70px_rgba(0,0,0,0.34)]">
      <CardHeader>
        <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/70">Interviewer feedback</p>
        <CardTitle className="text-2xl text-white">Consultant review form</CardTitle>
        <p className="text-sm leading-6 text-white/55">
          Use the interviewee&apos;s exact applicant name so the submission attaches to the correct profile in the Applicants view.
        </p>
      </CardHeader>
      <CardContent>
        <form className="space-y-8" onSubmit={handleSubmit}>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="interviewerName" className="text-white/70">Your Name</Label>
              <Input
                id="interviewerName"
                value={form.interviewerName}
                onChange={(event) => setForm((current) => ({ ...current, interviewerName: event.target.value }))}
                className="border-white/10 bg-white/5 text-white"
                placeholder="Interviewer name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="intervieweeName" className="text-white/70">Interviewee&apos;s Name (double check spelling)</Label>
              <Input
                id="intervieweeName"
                list="applicant-name-options"
                value={form.intervieweeName}
                onChange={(event) => setForm((current) => ({ ...current, intervieweeName: event.target.value }))}
                className="border-white/10 bg-white/5 text-white"
                placeholder="Select or type the applicant name"
              />
              <datalist id="applicant-name-options">
                {applicantNameOptions.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
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

          <div className="grid gap-6 lg:grid-cols-2">
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
              <ChoicePillGroup
                value={form.interviewerRole}
                onChange={(value) => setForm((current) => ({ ...current, interviewerRole: value }))}
                options={[
                  { value: 'Primary', label: 'Primary' },
                  { value: 'Secondary', label: 'Secondary' },
                ]}
                columnsClassName="sm:grid-cols-2"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/65">Ratings</p>
              <p className="mt-2 text-sm text-white/55">
                Each rubric area uses the same scale: Below Expectations, 1, 2, 3, Above Expectations.
              </p>
            </div>

            <div className="space-y-5">
              {feedbackMetricFields.map((field) => (
                <div key={field.key} className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
                  <p className="text-sm font-medium text-white">{field.label}</p>
                  <p className="mt-2 text-sm leading-6 text-white/45">{field.description}</p>
                  <RadioGroup
                    value={form[field.key]}
                    onValueChange={(value) => setForm((current) => ({ ...current, [field.key]: value }))}
                    className="mt-4 grid gap-2 md:grid-cols-5"
                  >
                    {ratingBandOptions.map((option) => {
                      const optionId = `${field.key}-${option.value}`;
                      const isActive = form[field.key] === String(option.value);

                      return (
                        <Label
                          key={optionId}
                          htmlFor={optionId}
                          className={cn(
                            'flex min-h-[76px] cursor-pointer flex-col justify-between rounded-2xl border px-4 py-3 transition-all',
                            isActive
                              ? 'border-cyan-300/50 bg-cyan-400/10 text-white shadow-[0_10px_24px_rgba(56,189,248,0.16)]'
                              : 'border-white/10 bg-black/20 text-white/65 hover:border-white/20 hover:bg-white/[0.05]'
                          )}
                        >
                          <RadioGroupItem id={optionId} value={String(option.value)} className="sr-only" />
                          <span className="text-sm font-medium">{option.label}</span>
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
              className="min-h-[120px] border-white/10 bg-white/5 text-white"
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
              className="min-h-[140px] border-white/10 bg-white/5 text-white"
              placeholder="Example: LEAN YES. Strong behavioral signal and composure, but I would still test quantitative structuring harder in the final round."
            />
          </div>

          <Button
            type="submit"
            className="w-full rounded-xl bg-cyan-300 text-slate-950 hover:bg-cyan-200"
            disabled={!canSubmit}
          >
            Save feedback
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default FeedbackForm;
