import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Upload, Loader2, ArrowLeft, FileText, AlertCircle } from 'lucide-react';
import otcrTechLogo from '@/assets/otcr-technologies-white-nomargins.webp';

const API_BASE_URL = import.meta.env.VITE_OA_API_URL || 'http://localhost:8000';

interface ApplicationResult {
  id: number;
  name: string;
  email: string;
  status: string;
  message: string;
}

const DevopsApply = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isEmbed = searchParams.get('embed') === 'true';
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [interest, setInterest] = useState('');
  const [resume, setResume] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ApplicationResult | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        setError('Please upload a PDF or Word document.');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB.');
        return;
      }
      setResume(file);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !email.trim() || !interest.trim() || !resume) {
      setError('Please fill in all fields and upload your resume.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('email', email.trim().toLowerCase());
      formData.append('interest', interest.trim());
      formData.append('resume', resume);

      const response = await fetch(`${API_BASE_URL}/api/applications`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to submit application');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Success state
  if (result) {
    const successContent = (
      <Card className="bg-card/80 backdrop-blur-sm border-border/50">
        <CardHeader className="text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <CardTitle className="text-2xl text-white">Application Submitted!</CardTitle>
          <CardDescription>{result.message}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-background/50 rounded-lg p-4 space-y-2">
            <p className="text-sm text-muted-foreground">
              <span className="text-white font-medium">Name:</span> {result.name}
            </p>
            <p className="text-sm text-muted-foreground">
              <span className="text-white font-medium">Email:</span> {result.email}
            </p>
            <p className="text-sm text-muted-foreground">
              <span className="text-white font-medium">Status:</span>{' '}
              <span className="capitalize">{result.status}</span>
            </p>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            You can check your application status anytime on the Tech page.
          </p>
          {!isEmbed && (
            <Button
              variant="outline"
              onClick={() => navigate('/tech')}
              className="w-full"
            >
              Back to Tech
            </Button>
          )}
        </CardContent>
      </Card>
    );

    // Embed mode - minimal wrapper
    if (isEmbed) {
      return (
        <div className="min-h-screen bg-background p-4">
          <div className="max-w-md mx-auto pt-8">
            {successContent}
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <section className="pt-32 pb-16 px-4">
          <div className="max-w-md mx-auto">
            {successContent}
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  // Form card component (reused in both modes)
  const formCard = (
    <Card className="bg-card/80 backdrop-blur-sm border-border/50">
      <CardHeader>
        {isEmbed && (
          <img 
            src={otcrTechLogo} 
            alt="OTCR Technologies" 
            className="h-12 w-auto mx-auto mb-4"
          />
        )}
        <CardTitle className="text-xl text-white">{isEmbed ? 'Apply to OTCR Technologies' : 'Your Information'}</CardTitle>
        <CardDescription>
          Fill out the form below to apply.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-white">Full Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-background/50 border-border text-white placeholder:text-muted-foreground"
              required
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-white">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-background/50 border-border text-white placeholder:text-muted-foreground"
              required
            />
            <p className="text-xs text-muted-foreground">
              Use the email you want us to contact you at.
            </p>
          </div>

          {/* Interest */}
          <div className="space-y-2">
            <Label htmlFor="interest" className="text-white">Why are you interested in OTCR Technologies?</Label>
            <Input
              id="interest"
              type="text"
              placeholder="One sentence about your interest"
              value={interest}
              onChange={(e) => setInterest(e.target.value)}
              className="bg-background/50 border-border text-white placeholder:text-muted-foreground"
              maxLength={200}
              required
            />
            <p className="text-xs text-muted-foreground">
              Keep it brief — one sentence is perfect.
            </p>
          </div>

          {/* Resume Upload */}
          <div className="space-y-2">
            <Label htmlFor="resume" className="text-white">Resume</Label>
            <div className="relative">
              <input
                id="resume"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                required
              />
              <div className={`
                flex items-center gap-3 p-4 rounded-lg border-2 border-dashed
                transition-colors cursor-pointer
                ${resume 
                  ? 'border-green-500/50 bg-green-500/5' 
                  : 'border-border hover:border-primary/50 bg-background/50'
                }
              `}>
                {resume ? (
                  <>
                    <FileText className="w-5 h-5 text-green-500" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{resume.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(resume.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-white">Click to upload resume</p>
                      <p className="text-xs text-muted-foreground">PDF or Word, max 5MB</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={submitting || !name.trim() || !email.trim() || !resume}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Application'
            )}
          </Button>

          {/* Back Link - hidden in embed mode */}
          {!isEmbed && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate('/tech')}
              className="w-full text-muted-foreground hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Tech
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  );

  // Embed mode - minimal wrapper with just the form
  if (isEmbed) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-md mx-auto pt-4">
          {formCard}
        </div>
      </div>
    );
  }

  // Full page mode
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Main Content - Side by side on desktop */}
      <section className="pt-28 lg:pt-32 pb-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-start">
            {/* Left side - Info */}
            <div className="text-center lg:text-left lg:sticky lg:top-32">
              <img 
                src={otcrTechLogo} 
                alt="OTCR Technologies" 
                className="h-20 lg:h-28 w-auto mx-auto lg:mx-0 mb-6"
              />
              <h1 className="text-4xl lg:text-5xl font-extrabold text-white mb-4">
                Apply to Technologies Division
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                Submit your application to join the Technologies Division.
                We'll review your application and reach out about next steps.
              </p>
              
              {/* Quick info */}
              <div className="hidden lg:block space-y-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-teal-primary/20 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-teal-primary" />
                  </div>
                  <span>Application takes ~2 minutes</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-teal-primary/20 flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-teal-primary" />
                  </div>
                  <span>We review applications within a week</span>
                </div>
              </div>
            </div>

            {/* Right side - Form */}
            <div className="w-full max-w-md mx-auto lg:mx-0">
              {formCard}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default DevopsApply;
