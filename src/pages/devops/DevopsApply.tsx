import { useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, FileText, ShieldCheck, Sparkles, UploadCloud } from 'lucide-react';
import { Link } from 'react-router-dom';

import Footer from '@/components/Footer';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import otcrTechLogo from '@/assets/otcr-technologies-white-nomargins.webp';
import {
  ApplicationStatus,
  recruitingStore,
  type Applicant,
  type ApplicantCycle,
  type SchoolYear,
  type TeamApplyingFor,
} from '@/features/recruiting';

type FormValues = {
  name: string;
  email: string;
  schoolYear: string;
  whyOtcr: string;
  caseAnswer: string;
  teamApplyingFor: string;
  cycle: `${ApplicantCycle}` | '';
};

type FormErrors = Partial<Record<keyof FormValues | 'resume', string>>;

const initialFormValues: FormValues = {
  name: '',
  email: '',
  schoolYear: '',
  whyOtcr: '',
  caseAnswer: '',
  teamApplyingFor: '',
  cycle: '',
};

const schoolYearOptions: SchoolYear[] = ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate'];
const teamOptions: TeamApplyingFor[] = ['Consulting', 'Operations', 'Technology', 'Design', 'Internal'];

const validateEmail = (email: string) => /\S+@\S+\.\S+/.test(email);

const formatSubmittedAt = (timestamp: string) =>
  new Date(timestamp).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

const toApplicantId = (name: string, email: string) => {
  const base = `${name}-${email}`
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  return `app-${base || Date.now()}`;
};

const DevopsApply = () => {
  const [formValues, setFormValues] = useState<FormValues>(initialFormValues);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedApplication, setSubmittedApplication] = useState<Applicant | null>(null);

  const completionCount = useMemo(() => {
    const values = Object.values(formValues).filter((value) => value.trim?.() || value);
    return values.length + (resumeFile ? 1 : 0);
  }, [formValues, resumeFile]);

  const updateField = <K extends keyof FormValues>(field: K, value: FormValues[K]) => {
    setFormValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleResumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setResumeFile(file);
    setErrors((current) => ({ ...current, resume: undefined }));
  };

  const validateForm = () => {
    const nextErrors: FormErrors = {};

    if (!formValues.name.trim()) nextErrors.name = 'Name is required.';
    if (!formValues.email.trim()) nextErrors.email = 'Email is required.';
    else if (!validateEmail(formValues.email.trim())) nextErrors.email = 'Enter a valid email address.';
    if (!resumeFile) nextErrors.resume = 'Resume is required.';
    if (!formValues.schoolYear.trim()) nextErrors.schoolYear = 'School year is required.';
    if (!formValues.whyOtcr.trim()) nextErrors.whyOtcr = 'Tell us why OTCR is a fit.';
    if (!formValues.caseAnswer.trim()) nextErrors.caseAnswer = 'Case answer is required.';
    if (!formValues.teamApplyingFor.trim()) nextErrors.teamApplyingFor = 'Choose a team.';
    if (!formValues.cycle) nextErrors.cycle = 'Select a cycle.';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateForm() || !resumeFile) return;

    setIsSubmitting(true);

    const existingApplicant = recruitingStore.getApplicantByEmail(formValues.email);
    const submittedAt = existingApplicant?.submittedAt ?? new Date().toISOString();
    const record: Applicant = {
      id: existingApplicant?.id ?? toApplicantId(formValues.name, formValues.email),
      name: formValues.name.trim(),
      email: formValues.email.trim().toLowerCase(),
      resume: resumeFile.name,
      schoolYear: formValues.schoolYear as SchoolYear,
      whyOtcr: formValues.whyOtcr.trim(),
      caseAnswer: formValues.caseAnswer.trim(),
      teamApplyingFor: formValues.teamApplyingFor as TeamApplyingFor,
      cycle: Number(formValues.cycle) as ApplicantCycle,
      status: ApplicationStatus.Applied,
      currentRound: null,
      finalDecision: 'pending',
      assignedPrimaryInterviewerId: existingApplicant?.assignedPrimaryInterviewerId ?? null,
      assignedSecondaryInterviewerId: existingApplicant?.assignedSecondaryInterviewerId ?? null,
      submittedAt,
      updatedAt: new Date().toISOString(),
      notes: existingApplicant?.notes ?? 'Submitted through /tech/apply',
    };

    recruitingStore.upsertApplicant(record);
    setSubmittedApplication(record);
    setIsSubmitting(false);
  };

  if (submittedApplication) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <section className="relative overflow-hidden px-4 pb-20 pt-32">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(20,184,166,0.16),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.12),transparent_30%)]" />
          <div className="relative mx-auto max-w-3xl">
            <Card className="border-white/10 bg-slate-950/80 shadow-2xl shadow-teal-950/20 backdrop-blur">
              <CardHeader className="space-y-6 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-500/10">
                  <CheckCircle2 className="h-8 w-8 text-emerald-300" />
                </div>
                <div className="space-y-2">
                  <CardTitle className="text-3xl text-white">Application submitted</CardTitle>
                  <CardDescription className="mx-auto max-w-xl text-base text-slate-300">
                    Your OTCR recruiting profile has been created locally with status <span className="font-semibold text-white">applied</span>.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-sm text-slate-300 md:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Applicant</p>
                    <p className="mt-1 font-medium text-white">{submittedApplication.name}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Email</p>
                    <p className="mt-1 font-medium text-white">{submittedApplication.email}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Team</p>
                    <p className="mt-1 font-medium text-white">{submittedApplication.teamApplyingFor}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Cycle</p>
                    <p className="mt-1 font-medium text-white">Cycle {submittedApplication.cycle}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Resume</p>
                    <p className="mt-1 font-medium text-white">{submittedApplication.resume}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Submitted</p>
                    <p className="mt-1 font-medium text-white">{formatSubmittedAt(submittedApplication.submittedAt)}</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-teal-400/20 bg-teal-400/10 p-4 text-sm text-teal-50">
                  This uses local state only. No backend, database, or real file upload was triggered.
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button asChild className="flex-1 bg-teal-500 text-slate-950 hover:bg-teal-400">
                    <Link to="/tech">Back to Tech</Link>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 border-white/15 bg-white/5 text-white hover:bg-white/10"
                    onClick={() => {
                      setSubmittedApplication(null);
                      setFormValues(initialFormValues);
                      setResumeFile(null);
                      setErrors({});
                    }}
                  >
                    Submit another application
                  </Button>
                </div>
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
      <section className="relative overflow-hidden pb-20 pt-28">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.18),transparent_34%),radial-gradient(circle_at_80%_20%,rgba(96,165,250,0.12),transparent_24%),linear-gradient(180deg,rgba(2,6,23,0.96),rgba(2,6,23,1))]" />
        <div className="relative mx-auto grid max-w-6xl gap-8 px-4 lg:grid-cols-[0.88fr_1.12fr]">
          <div className="space-y-6">
            <Link to="/tech" className="inline-flex items-center gap-2 text-sm text-slate-300 transition hover:text-white">
              <ArrowLeft className="h-4 w-4" />
              Back to OTCR Tech
            </Link>

            <div className="space-y-5">
              <img src={otcrTechLogo} alt="OTCR Technologies" className="h-14 w-auto" />
              <div className="inline-flex items-center gap-2 rounded-full border border-teal-400/20 bg-teal-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-teal-100">
                <Sparkles className="h-3.5 w-3.5" />
                OTCR Recruiting Pipeline
              </div>
              <div className="space-y-4">
                <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-white md:text-5xl">
                  Apply for the team without touching the evaluator dashboard.
                </h1>
                <p className="max-w-xl text-base leading-7 text-slate-300">
                  Submit your applicant profile, attach a resume placeholder, and enter your written responses. This page stores an upstream application record locally with recruiting status set to <span className="font-semibold text-white">applied</span>.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Required</p>
                <p className="mt-2 text-2xl font-semibold text-white">8/8</p>
                <p className="mt-1 text-sm text-slate-400">Core intake fields covered</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Storage</p>
                <p className="mt-2 text-2xl font-semibold text-white">Local</p>
                <p className="mt-1 text-sm text-slate-400">No backend or DB hookup</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Progress</p>
                <p className="mt-2 text-2xl font-semibold text-white">{completionCount}/8</p>
                <p className="mt-1 text-sm text-slate-400">Fields completed so far</p>
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-5 text-sm text-emerald-50">
              <div className="flex items-center gap-2 font-medium text-white">
                <ShieldCheck className="h-4 w-4 text-emerald-300" />
                Submission behavior for this build
              </div>
              <p>Resume upload is UI-only and stores the selected filename in local state.</p>
              <p>The created record is ready to feed the future applicant portal and recruiting workflow.</p>
            </div>
          </div>

          <Card className="border-white/10 bg-slate-950/80 shadow-2xl shadow-slate-950/40 backdrop-blur">
            <CardHeader className="space-y-3">
              <CardTitle className="text-2xl text-white">Applicant submission</CardTitle>
              <CardDescription className="text-slate-300">
                Complete all required fields to create a local OTCR application record.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-white">Name</Label>
                    <Input
                      id="name"
                      value={formValues.name}
                      onChange={(event) => updateField('name', event.target.value)}
                      placeholder="Full name"
                      className="border-white/10 bg-white/5 text-white placeholder:text-slate-500"
                    />
                    {errors.name ? <p className="text-xs text-rose-300">{errors.name}</p> : null}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formValues.email}
                      onChange={(event) => updateField('email', event.target.value)}
                      placeholder="name@illinois.edu"
                      className="border-white/10 bg-white/5 text-white placeholder:text-slate-500"
                    />
                    {errors.email ? <p className="text-xs text-rose-300">{errors.email}</p> : null}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">School year</Label>
                    <Select value={formValues.schoolYear} onValueChange={(value) => updateField('schoolYear', value)}>
                      <SelectTrigger className="border-white/10 bg-white/5 text-white">
                        <SelectValue placeholder="Select school year" />
                      </SelectTrigger>
                      <SelectContent className="border-white/10 bg-slate-950 text-white">
                        {schoolYearOptions.map((option) => (
                          <SelectItem key={option} value={option} className="focus:bg-white/10 focus:text-white">
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.schoolYear ? <p className="text-xs text-rose-300">{errors.schoolYear}</p> : null}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Team applying for</Label>
                    <Select value={formValues.teamApplyingFor} onValueChange={(value) => updateField('teamApplyingFor', value)}>
                      <SelectTrigger className="border-white/10 bg-white/5 text-white">
                        <SelectValue placeholder="Choose a team" />
                      </SelectTrigger>
                      <SelectContent className="border-white/10 bg-slate-950 text-white">
                        {teamOptions.map((option) => (
                          <SelectItem key={option} value={option} className="focus:bg-white/10 focus:text-white">
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.teamApplyingFor ? <p className="text-xs text-rose-300">{errors.teamApplyingFor}</p> : null}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-white">Cycle</Label>
                    <Select value={formValues.cycle} onValueChange={(value: `${ApplicantCycle}`) => updateField('cycle', value)}>
                      <SelectTrigger className="border-white/10 bg-white/5 text-white md:max-w-[220px]">
                        <SelectValue placeholder="Select cycle" />
                      </SelectTrigger>
                      <SelectContent className="border-white/10 bg-slate-950 text-white">
                        <SelectItem value="1" className="focus:bg-white/10 focus:text-white">Cycle 1</SelectItem>
                        <SelectItem value="2" className="focus:bg-white/10 focus:text-white">Cycle 2</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.cycle ? <p className="text-xs text-rose-300">{errors.cycle}</p> : null}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="resume" className="text-white">Resume upload</Label>
                  <label
                    htmlFor="resume"
                    className="group flex cursor-pointer items-center gap-4 rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-4 transition hover:border-teal-300/40 hover:bg-white/[0.05]"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-400/10 text-teal-200">
                      {resumeFile ? <FileText className="h-5 w-5" /> : <UploadCloud className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-white">
                        {resumeFile ? resumeFile.name : 'Choose a resume file'}
                      </p>
                      <p className="text-sm text-slate-400">
                        UI placeholder only. No upload occurs in this build.
                      </p>
                    </div>
                  </label>
                  <Input id="resume" type="file" className="hidden" onChange={handleResumeChange} />
                  {errors.resume ? <p className="text-xs text-rose-300">{errors.resume}</p> : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="whyOtcr" className="text-white">Why OTCR</Label>
                  <Textarea
                    id="whyOtcr"
                    value={formValues.whyOtcr}
                    onChange={(event) => updateField('whyOtcr', event.target.value)}
                    placeholder="Why do you want to join OTCR, and what kind of work are you hoping to do?"
                    className="min-h-[120px] border-white/10 bg-white/5 text-white placeholder:text-slate-500"
                  />
                  {errors.whyOtcr ? <p className="text-xs text-rose-300">{errors.whyOtcr}</p> : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="caseAnswer" className="text-white">Case answer</Label>
                  <Textarea
                    id="caseAnswer"
                    value={formValues.caseAnswer}
                    onChange={(event) => updateField('caseAnswer', event.target.value)}
                    placeholder="Walk through how you would structure and solve a short consulting-style prompt."
                    className="min-h-[160px] border-white/10 bg-white/5 text-white placeholder:text-slate-500"
                  />
                  {errors.caseAnswer ? <p className="text-xs text-rose-300">{errors.caseAnswer}</p> : null}
                </div>

                <div className="flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-slate-400">
                    Required fields are validated before creating the local application record.
                  </p>
                  <Button type="submit" disabled={isSubmitting} className="bg-teal-500 text-slate-950 hover:bg-teal-400">
                    {isSubmitting ? 'Submitting...' : 'Submit application'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default DevopsApply;
