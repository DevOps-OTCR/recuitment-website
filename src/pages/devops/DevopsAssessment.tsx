import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, CheckCircle, Loader2, Mail, AlertCircle } from 'lucide-react';
import { assessmentApi, AssessmentConfig, ProgressResponse } from '@/lib/assessment-api';
import otcrTechLogo from '@/assets/otcr-technologies-white-nomargins.webp';
import ProgressIndicator from './components/ProgressIndicator';
import ProblemSolvingSection from './components/ProblemSolvingSection';
import CodingSection from './components/CodingSection';
import SystemDesignSection from './components/SystemDesignSection';

type Section = 'problem_solving' | 'coding' | 'system_design';

const SECTION_ORDER: Section[] = ['problem_solving', 'coding', 'system_design'];

const DevopsAssessment = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<AssessmentConfig | null>(null);
  const [progress, setProgress] = useState<ProgressResponse | null>(null);
  const [currentSection, setCurrentSection] = useState<Section>('problem_solving');
  const [submitting, setSubmitting] = useState(false);
  const [aiDetectionFlag, setAiDetectionFlag] = useState<string | null>(null);
  
  // Email verification state
  const [requiresEmail, setRequiresEmail] = useState(false);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);

  // Load assessment config
  useEffect(() => {
    const loadConfig = async () => {
      if (!token) {
        setError('No assessment token provided');
        setLoading(false);
        return;
      }

      try {
        // Fetch config
        const configData = await assessmentApi.getConfig(token);
        
        // Extract and store AI detection flag
        const flag = (configData as any)._aiDetectionFlag;
        if (flag) {
          setAiDetectionFlag(flag);
        }
        
        setConfig(configData);
        setRequiresEmail(configData.requiresEmail || false);
        
        // If email not required, start attempt immediately
        if (!configData.requiresEmail) {
          const progressData = await assessmentApi.startAttempt(token);
          setProgress(progressData);
          setEmailVerified(true);
          
          // Determine current section based on completed sections
          const completed = progressData.sections_completed || [];
          const nextSection = SECTION_ORDER.find(s => !completed.includes(s));
          if (nextSection) {
            setCurrentSection(nextSection);
          }
          
          // Request fullscreen
          requestFullscreen();
          
          // Track focus loss
          setupFocusTracking(token);
        }
        
        setLoading(false);
      } catch (err: any) {
        console.error('Failed to load assessment:', err);
        if (err.message?.includes('404') || err.message?.includes('not found')) {
          setError('Assessment not found. Please check your link.');
        } else if (err.message?.includes('410') || err.message?.includes('expired')) {
          setError('This assessment link has expired.');
        } else {
          setError('Failed to load assessment. Please try again.');
        }
        setLoading(false);
      }
    };

    loadConfig();
  }, [token]);

  // Request fullscreen
  const requestFullscreen = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch(() => {
        // Fullscreen request denied, continue anyway
      });
    }
  };

  // Setup focus loss tracking
  const setupFocusTracking = (assessmentToken: string) => {
    let focusLossReported = false;

    const handleBlur = () => {
      if (!focusLossReported) {
        focusLossReported = true;
        // Report focus loss to backend
        fetch(`${import.meta.env.VITE_OA_API_URL || 'http://localhost:8000'}/api/assessment/${assessmentToken}/focus-loss`, {
          method: 'POST',
        }).catch(() => {
          // Silent fail, continue assessment
        });
      }
    };

    const handleFocus = () => {
      focusLossReported = false;
    };

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  };

  // Handle email verification and start attempt
  const handleEmailVerify = async () => {
    if (!token || !email.trim()) return;
    
    setVerifyingEmail(true);
    setEmailError(null);
    
    try {
      const progressData = await assessmentApi.startAttempt(token, email.trim());
      setProgress(progressData);
      setEmailVerified(true);
      
      // Determine current section based on completed sections
      const completed = progressData.sections_completed || [];
      const nextSection = SECTION_ORDER.find(s => !completed.includes(s));
      if (nextSection) {
        setCurrentSection(nextSection);
      }
      
      // Request fullscreen
      requestFullscreen();
      
      // Track focus loss
      setupFocusTracking(token);

    } catch (err: any) {
      console.error('Failed to verify email:', err);
      if (err.message?.includes('403') || err.message?.includes('does not match')) {
        setEmailError('Email does not match. Please use the email you applied with.');
      } else if (err.message?.includes('400')) {
        setEmailError('Email verification required. Please enter your email.');
      } else {
        setEmailError('Failed to verify email. Please try again.');
      }
    } finally {
      setVerifyingEmail(false);
    }
  };

  const handleSectionSubmit = async (section: Section, payload: any) => {
    if (!token) return;
    
    // Include AI detection flag in payload
    const payloadWithFlag = {
      ...payload,
      _aiDetectionFlag: aiDetectionFlag,
    };
    
    setSubmitting(true);
    try {
      const result = await assessmentApi.submitSection(token, section, payloadWithFlag);
      
      // Update progress
      const newProgress = await assessmentApi.getProgress(token);
      setProgress(newProgress);
      
      // Move to next section
      const currentIndex = SECTION_ORDER.indexOf(section);
      if (currentIndex < SECTION_ORDER.length - 1) {
        setCurrentSection(SECTION_ORDER[currentIndex + 1]);
      }
      
      return result;
    } catch (err: any) {
      console.error('Failed to submit section:', err);
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const isCompleted = progress?.completed_at != null;
  const sectionsCompleted = progress?.sections_completed || [];

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading assessment...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-card/80 border-border/50">
          <CardHeader className="text-center">
            <CardTitle className="text-xl text-white">Unable to Load Assessment</CardTitle>
            <CardDescription className="text-destructive">{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={() => navigate('/tech')}
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Tech
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Email verification state
  if (requiresEmail && !emailVerified) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-card/80 border-border/50">
          <CardHeader className="text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Mail className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-xl text-white">Verify Your Email</CardTitle>
            <CardDescription>
              Please enter the email address you used when applying.
              This helps us link your assessment to your application.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleEmailVerify()}
                className="bg-background/50 border-border text-white placeholder:text-muted-foreground"
              />
            </div>
            
            {emailError && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                <p className="text-sm text-destructive">{emailError}</p>
              </div>
            )}
            
            <Button
              onClick={handleEmailVerify}
              disabled={!email.trim() || verifyingEmail}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {verifyingEmail ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Start Assessment'
              )}
            </Button>
            
            <Button
              variant="ghost"
              onClick={() => navigate('/tech')}
              className="w-full text-muted-foreground hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Completed state
  if (isCompleted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-card/80 border-border/50">
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <CardTitle className="text-2xl text-white">Assessment Complete!</CardTitle>
            <CardDescription>
              Thank you for completing the Technical Assessment.
              We'll review your submission and get back to you soon.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-background/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground text-center">
                Submitted on {new Date(progress!.completed_at!).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate('/tech')}
              className="w-full"
            >
              Back to Tech
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/tech')}
              className="text-muted-foreground hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Exit
            </Button>
            <img 
              src={otcrTechLogo} 
              alt="OTCR Technologies" 
              className="h-6 w-auto"
            />
          </div>
          {config && (
            <span className="text-sm text-muted-foreground">
              ~{config.estimatedMinutes} min
            </span>
          )}
        </div>
      </header>

      {/* Progress Indicator */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <ProgressIndicator
          sections={SECTION_ORDER}
          currentSection={currentSection}
          completedSections={sectionsCompleted}
        />
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 pb-16">
        {currentSection === 'problem_solving' && config && (
          <ProblemSolvingSection
            config={config.problemSolving}
            onSubmit={(payload) => handleSectionSubmit('problem_solving', payload)}
            submitting={submitting}
          />
        )}
        
        {currentSection === 'coding' && config && (
          <CodingSection
            config={config.coding}
            onSubmit={(payload) => handleSectionSubmit('coding', payload)}
            submitting={submitting}
          />
        )}
        
        {currentSection === 'system_design' && config && (
          <SystemDesignSection
            config={config.systemDesign}
            onSubmit={(payload) => handleSectionSubmit('system_design', payload)}
            submitting={submitting}
          />
        )}
      </main>
    </div>
  );
};

export default DevopsAssessment;
