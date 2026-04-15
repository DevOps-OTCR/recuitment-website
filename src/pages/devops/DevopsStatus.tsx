import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Clock3, FileSearch, Mail, Search, XCircle } from 'lucide-react';

import Footer from '@/components/Footer';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ApplicationStatus,
  getApplicationStatusLabel,
  statusService,
  useRecruitingStore,
} from '@/features/recruiting';

const statusConfig: Record<
  ApplicationStatus,
  {
    headline: string;
    description: string;
    badgeClassName: string;
    panelClassName: string;
    Icon: typeof Clock3;
  }
> = {
  [ApplicationStatus.Applied]: {
    headline: 'Your application has been received.',
    description: 'Our team has your materials and will review them before assigning next steps.',
    badgeClassName: 'border-slate-400/30 bg-slate-400/10 text-slate-100',
    panelClassName: 'border-slate-400/20 bg-slate-400/8',
    Icon: FileSearch,
  },
  [ApplicationStatus.Round1]: {
    headline: 'You are in Round 1.',
    description: 'You have advanced to the first interview stage. Please watch your inbox for scheduling details.',
    badgeClassName: 'border-sky-400/30 bg-sky-400/10 text-sky-100',
    panelClassName: 'border-sky-400/20 bg-sky-400/8',
    Icon: Clock3,
  },
  [ApplicationStatus.Round2]: {
    headline: 'You are in Round 2.',
    description: 'You have moved forward in the process. The recruiting team will contact you about your next interview.',
    badgeClassName: 'border-cyan-400/30 bg-cyan-400/10 text-cyan-100',
    panelClassName: 'border-cyan-400/20 bg-cyan-400/8',
    Icon: Clock3,
  },
  [ApplicationStatus.Accepted]: {
    headline: 'You have been accepted.',
    description: 'Congratulations. The recruiting team will follow up with onboarding details and next steps.',
    badgeClassName: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-100',
    panelClassName: 'border-emerald-400/20 bg-emerald-400/8',
    Icon: CheckCircle2,
  },
  [ApplicationStatus.Rejected]: {
    headline: 'A final decision has been made.',
    description: 'Thank you for your interest in OTCR. The team is not moving forward with your application this cycle.',
    badgeClassName: 'border-rose-400/30 bg-rose-400/10 text-rose-100',
    panelClassName: 'border-rose-400/20 bg-rose-400/8',
    Icon: XCircle,
  },
};

const normalizeEmail = (value: string) => value.trim().toLowerCase();

const formatUpdatedAt = (value: string) =>
  new Date(value.includes('T') ? value : `${value}T12:00:00`).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

const DevopsStatus = () => {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') ?? '');
  const [submittedEmail, setSubmittedEmail] = useState(searchParams.get('email') ?? '');
  const applicants = useRecruitingStore((state) => state.applicants);
  const [lookupApplicantId, setLookupApplicantId] = useState<string | null>(null);

  const normalizedSubmittedEmail = normalizeEmail(submittedEmail);
  const hasSearched = normalizedSubmittedEmail.length > 0;

  const applicant = useMemo(
    () => applicants.find((entry) => entry.id === lookupApplicantId) ?? null,
    [applicants, lookupApplicantId]
  );

  const handleLookup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmittedEmail(email);
    const snapshot = await statusService.lookupApplicantStatusByEmail(email);
    setLookupApplicantId(snapshot?.applicantId ?? null);
  };

  const activeStatus = applicant ? statusConfig[applicant.status] : null;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <section className="relative overflow-hidden px-4 pb-16 pt-32">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.16),transparent_35%),linear-gradient(180deg,rgba(15,23,42,0.98),rgba(2,6,23,1))]" />
        <div className="relative mx-auto max-w-4xl">
          <div className="mb-10 text-center">
            <p className="mb-3 text-sm font-medium uppercase tracking-[0.24em] text-cyan-300/80">
              OTCR Recruiting
            </p>
            <h1 className="text-4xl font-bold text-white md:text-5xl">Applicant Status Portal</h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-white/70 md:text-lg">
              Enter the email you used to apply to see your current recruiting stage or final decision.
            </p>
          </div>

          <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Look up your application</CardTitle>
              <CardDescription>
                This portal only shows applicant-safe status updates. It does not expose reviewer notes or internal workflow details.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleLookup}>
                <div className="space-y-2">
                  <Label htmlFor="status-email" className="text-white">
                    Application email
                  </Label>
                  <Input
                    id="status-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="border-white/10 bg-slate-950/60 text-white placeholder:text-white/35"
                  />
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    type="submit"
                    disabled={!normalizeEmail(email)}
                    className="bg-cyan-500 text-slate-950 hover:bg-cyan-400"
                  >
                    <Search className="mr-2 h-4 w-4" />
                    Check Status
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-white/15 bg-transparent text-white hover:bg-white/10"
                    onClick={() => {
                      setEmail('');
                      setSubmittedEmail('');
                      setLookupApplicantId(null);
                    }}
                  >
                    Clear
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {!hasSearched ? (
            <Card className="mt-6 border-dashed border-white/10 bg-white/[0.03]">
              <CardContent className="flex flex-col items-center px-6 py-10 text-center">
                <Mail className="mb-4 h-10 w-10 text-cyan-300/75" />
                <h2 className="text-xl font-semibold text-white">No lookup yet</h2>
                <p className="mt-2 max-w-xl text-sm text-white/65">
                  Use the same email address from your OTCR application. Once you search, we will show your current round or final outcome.
                </p>
              </CardContent>
            </Card>
          ) : applicant && activeStatus ? (
            <Card className={`mt-6 border ${activeStatus.panelClassName}`}>
              <CardContent className="space-y-6 px-6 py-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium ${activeStatus.badgeClassName}`}>
                      {getApplicationStatusLabel(applicant.status)}
                    </div>
                    <h2 className="mt-4 text-2xl font-semibold text-white">{activeStatus.headline}</h2>
                    <p className="mt-2 max-w-2xl text-sm text-white/75">{activeStatus.description}</p>
                  </div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/8">
                    <activeStatus.Icon className="h-7 w-7 text-white" />
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-white/45">Applicant</p>
                    <p className="mt-2 text-base font-medium text-white">{applicant.name}</p>
                    <p className="mt-1 text-sm text-white/60">{applicant.email}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-white/45">Application</p>
                    <p className="mt-2 text-base font-medium text-white">
                      {applicant.teamApplyingFor} team, Cycle {applicant.cycle}
                    </p>
                    <p className="mt-1 text-sm text-white/60">Last updated {formatUpdatedAt(applicant.updatedAt)}</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/70">
                  Need help? Email the recruiting team if you think you used a different address or have not seen an update in a while.
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="mt-6 border-white/10 bg-rose-500/5">
              <CardContent className="px-6 py-10 text-center">
                <XCircle className="mx-auto mb-4 h-10 w-10 text-rose-300" />
                <h2 className="text-xl font-semibold text-white">No application found</h2>
                <p className="mx-auto mt-2 max-w-xl text-sm text-white/65">
                  We could not find an application for <span className="text-white">{normalizedSubmittedEmail}</span>. Check for typos or try the email you used on your application form.
                </p>
                <div className="mt-6">
                  <Link to="/tech/apply">
                    <Button className="bg-white text-slate-950 hover:bg-white/90">Go to Application</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default DevopsStatus;
