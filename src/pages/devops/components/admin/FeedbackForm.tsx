import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

import type { DecisionValue, FeedbackEntry } from './types';

interface FeedbackFormProps {
  applicantId: number;
  defaultAssignedExec: string;
  onSubmitFeedback: (entry: Omit<FeedbackEntry, 'id' | 'submittedAt'>) => void;
}

interface FeedbackFormState {
  interviewerName: string;
  assignedExec: string;
  round: string;
  cultureFitScore: string;
  technicalScore: string;
  communicationScore: string;
  leadershipPotentialScore: string;
  recommendation: DecisionValue;
  strengths: string;
  concerns: string;
  comments: string;
}

const initialState = (assignedExec: string): FeedbackFormState => ({
  interviewerName: '',
  assignedExec,
  round: 'Round 1',
  cultureFitScore: '3',
  technicalScore: '3',
  communicationScore: '3',
  leadershipPotentialScore: '3',
  recommendation: 'MAYBE',
  strengths: '',
  concerns: '',
  comments: '',
});

const scoreFields = [
  { key: 'cultureFitScore', label: 'Culture fit' },
  { key: 'technicalScore', label: 'Technical / case readiness' },
  { key: 'communicationScore', label: 'Communication' },
  { key: 'leadershipPotentialScore', label: 'Leadership potential' },
] as const;

const FeedbackForm = ({ applicantId, defaultAssignedExec, onSubmitFeedback }: FeedbackFormProps) => {
  const [form, setForm] = useState<FeedbackFormState>(initialState(defaultAssignedExec));

  useEffect(() => {
    setForm(initialState(defaultAssignedExec));
  }, [applicantId, defaultAssignedExec]);

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    onSubmitFeedback({
      applicantId,
      interviewerName: form.interviewerName.trim() || 'Anonymous reviewer',
      assignedExec: form.assignedExec.trim() || defaultAssignedExec,
      round: form.round,
      cultureFitScore: Number(form.cultureFitScore),
      technicalScore: Number(form.technicalScore),
      communicationScore: Number(form.communicationScore),
      leadershipPotentialScore: Number(form.leadershipPotentialScore),
      recommendation: form.recommendation,
      strengths: form.strengths.trim(),
      concerns: form.concerns.trim(),
      comments: form.comments.trim(),
    });

    setForm(initialState(form.assignedExec || defaultAssignedExec));
  };

  return (
    <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(18,29,47,0.94),rgba(9,14,24,0.98))]">
      <CardHeader>
        <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/70">Interviewer feedback</p>
        <CardTitle className="text-xl text-white">Review form</CardTitle>
        <p className="text-sm text-white/55">
          Mirrors the handoff’s evaluation model: recommendation, culture fit, technical, communication, comments, plus structured strengths and concerns.
        </p>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={submit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="interviewerName" className="text-white/70">Interviewer name</Label>
              <Input
                id="interviewerName"
                value={form.interviewerName}
                onChange={(event) => setForm((current) => ({ ...current, interviewerName: event.target.value }))}
                className="border-white/10 bg-white/5 text-white"
                placeholder="Exec or interviewer"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assignedExec" className="text-white/70">Assigned exec member</Label>
              <Input
                id="assignedExec"
                value={form.assignedExec}
                onChange={(event) => setForm((current) => ({ ...current, assignedExec: event.target.value }))}
                className="border-white/10 bg-white/5 text-white"
                placeholder="Assigned owner"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-white/70">Interview round</Label>
              <Select value={form.round} onValueChange={(value) => setForm((current) => ({ ...current, round: value }))}>
                <SelectTrigger className="border-white/10 bg-white/5 text-white">
                  <SelectValue placeholder="Select round" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Round 1">Round 1</SelectItem>
                  <SelectItem value="Round 2">Round 2</SelectItem>
                  <SelectItem value="Coffee chat">Coffee chat</SelectItem>
                  <SelectItem value="Final review">Final review</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-white/70">Final decision</Label>
              <Select
                value={form.recommendation}
                onValueChange={(value: DecisionValue) => setForm((current) => ({ ...current, recommendation: value }))}
              >
                <SelectTrigger className="border-white/10 bg-white/5 text-white">
                  <SelectValue placeholder="Select decision" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="YES">Yes</SelectItem>
                  <SelectItem value="NO">No</SelectItem>
                  <SelectItem value="MAYBE">Maybe</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {scoreFields.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label className="text-white/70">{field.label}</Label>
                <Select
                  value={form[field.key]}
                  onValueChange={(value) => setForm((current) => ({ ...current, [field.key]: value }))}
                >
                  <SelectTrigger className="border-white/10 bg-white/5 text-white">
                    <SelectValue placeholder="Score" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Low</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="4">4</SelectItem>
                    <SelectItem value="5">5 - Strong</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="strengths" className="text-white/70">Top strengths</Label>
            <Textarea
              id="strengths"
              value={form.strengths}
              onChange={(event) => setForm((current) => ({ ...current, strengths: event.target.value }))}
              className="min-h-[88px] border-white/10 bg-white/5 text-white"
              placeholder="What stood out positively?"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="concerns" className="text-white/70">Concerns / hesitations</Label>
            <Textarea
              id="concerns"
              value={form.concerns}
              onChange={(event) => setForm((current) => ({ ...current, concerns: event.target.value }))}
              className="min-h-[88px] border-white/10 bg-white/5 text-white"
              placeholder="Any risks, missing examples, or concerns?"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="comments" className="text-white/70">Additional comments</Label>
            <Textarea
              id="comments"
              value={form.comments}
              onChange={(event) => setForm((current) => ({ ...current, comments: event.target.value }))}
              className="min-h-[110px] border-white/10 bg-white/5 text-white"
              placeholder="General notes, final rationale, or handoff comments"
            />
          </div>

          <Button type="submit" className="w-full rounded-xl bg-cyan-300 text-slate-950 hover:bg-cyan-200">
            Save feedback
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default FeedbackForm;
