import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, CheckCircle, Loader2, Mail, AlertCircle, Clock } from 'lucide-react';
import { assessmentApi, AssessmentConfig, ProgressResponse } from '@/lib/assessment-api';
import { getOaApiUrl } from '@/lib/oa-api-url';
import otcrTechLogo from '@/assets/otcr-technologies-white-nomargins.webp';
import ProgressIndicator from './components/ProgressIndicator';
import ProblemSolvingSection from './components/ProblemSolvingSection';
import CodingSection from './components/CodingSection';
import SystemDesignSection from './components/SystemDesignSection';

type Section = 'problem_solving' | 'coding' | 'system_design';

const SECTION_ORDER: Section[] = ['problem_solving', 'coding', 'system_design'];
const getDraftStorageKey = (token: string) => `assessmentDrafts:${token}`;

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
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [assessmentStartTime, setAssessmentStartTime] = useState<number | null>(null);
  // Draft responses to persist when navigating back/forward
  const [problemSolvingDraft, setProblemSolvingDraft] = useState<Record<string, string>>({});
  const [codingDraft, setCodingDraft] = useState<string>('');
  const [systemDesignDraft, setSystemDesignDraft] = useState<string>('');
  
  // Email verification state
  const [requiresEmail, setRequiresEmail] = useState(false);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  
  // Pledge agreement state
  const [pledgeAccepted, setPledgeAccepted] = useState(false);

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
        
        // If email not required, show pledge screen
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

  // Restore drafts (and last section) from localStorage on load
  useEffect(() => {
    if (!token || typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(getDraftStorageKey(token));
      if (!stored) return;

      const parsed = JSON.parse(stored) as {
        problemSolving?: Record<string, string>;
        coding?: string;
        systemDesign?: string;
        currentSection?: Section;
      };

      if (parsed.problemSolving) setProblemSolvingDraft(parsed.problemSolving);
      if (typeof parsed.coding === 'string') setCodingDraft(parsed.coding);
      if (typeof parsed.systemDesign === 'string') setSystemDesignDraft(parsed.systemDesign);
      if (parsed.currentSection && SECTION_ORDER.includes(parsed.currentSection)) {
        setCurrentSection(parsed.currentSection);
      }
    } catch (err) {
      console.warn('Failed to restore drafts', err);
    }
  }, [token]);

  // Stopwatch timer effect
  useEffect(() => {
    if (!assessmentStartTime) return;
    
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - assessmentStartTime) / 1000));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [assessmentStartTime]);

  // Progress snapshot every 5 minutes (for submission review timeline)
  const lastSnapshotMinutesRef = useRef<number>(0);
  useEffect(() => {
    if (!token || !assessmentStartTime || progress?.completed_at != null) return;
    const minutes = Math.floor(elapsedSeconds / 300) * 5; // 0, 5, 10, 15...
    if (minutes <= lastSnapshotMinutesRef.current) return;
    lastSnapshotMinutesRef.current = minutes;
    assessmentApi.recordProgressSnapshot(token, {
      sections_completed: progress?.sections_completed ?? [],
      current_section: currentSection,
      elapsed_seconds: elapsedSeconds,
    }).catch(() => { /* non-blocking */ });
  }, [token, assessmentStartTime, elapsedSeconds, progress?.sections_completed, progress?.completed_at, currentSection]);

  // Persist drafts (and current section) to localStorage
  useEffect(() => {
    if (!token || typeof window === 'undefined') return;

    const payload = {
      problemSolving: problemSolvingDraft,
      coding: codingDraft,
      systemDesign: systemDesignDraft,
      currentSection,
    };

    try {
      localStorage.setItem(getDraftStorageKey(token), JSON.stringify(payload));
    } catch (err) {
      console.warn('Failed to save drafts', err);
    }
  }, [token, problemSolvingDraft, codingDraft, systemDesignDraft, currentSection]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

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
        fetch(`${getOaApiUrl()}/api/assessment/${assessmentToken}/focus-loss`, {
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

  // Handle pledge acceptance
  const handlePledgeAccept = () => {
    setPledgeAccepted(true);
    setAssessmentStartTime(Date.now());
    
    // Request fullscreen
    requestFullscreen();
    
    // Track focus loss
    if (token) {
      setupFocusTracking(token);
    }
  };

  // Handle email verification and start attempt
  const handleEmailVerify = async () => {
    if (!token || !email.trim()) return;
    
    setVerifyingEmail(true);
    setEmailError(null);
    
    try {
      const progressData = await assessmentApi.startAttempt(token, email.trim());
      setProgress(progressData);
      
      // Determine current section based on completed sections
      const completed = progressData.sections_completed || [];
      const nextSection = SECTION_ORDER.find(s => !completed.includes(s));
      if (nextSection) {
        setCurrentSection(nextSection);
      }
      
      setEmailVerified(true);

    } catch (err: any) {
      console.error('Failed to verify email:', err);
      if (err.message?.includes('403') || err.message?.includes('does not match')) {
        setEmailError('Email does not match. Please use the personal or Illinois email you signed up with.');
      } else if (err.message?.includes('400')) {
        setEmailError('Email verification required. Please enter your email.');
      } else {
        setEmailError('Failed to verify email. Please try again.');
      }
    } finally {
      setVerifyingEmail(false);
    }
  };

  const submitOneSection = async (section: Section, payload: any) => {
    const payloadWithFlag = { ...payload, _aiDetectionFlag: aiDetectionFlag };
    await assessmentApi.submitSection(token!, section, payloadWithFlag);
    const newProgress = await assessmentApi.getProgress(token!);
    setProgress(newProgress);
    return newProgress;
  };

  const handleSectionSubmit = async (section: Section, payload: any) => {
    if (!token) return;

    setSubmitting(true);
    try {
      // When submitting the last section (system_design), submit any earlier sections that aren't submitted yet
      if (section === 'system_design') {
        if (!sectionsCompleted.includes('problem_solving') && config?.problemSolving) {
          const psPayload: Record<string, any> = {};
          for (const q of config.problemSolving.questions) {
            const val = problemSolvingDraft[q.id];
            psPayload[q.id] = {
              answer: val ?? '',
              questionText: q.questionText,
              type: q.type,
              options: q.options || null,
            };
          }
          await submitOneSection('problem_solving', psPayload);
        }
        if (!sectionsCompleted.includes('coding')) {
          await submitOneSection('coding', {
            code: codingDraft || config?.coding?.problem?.starterCode || '',
            language: 'python3',
          });
        }
      }

      await submitOneSection(section, payload);

      // Ensure we have latest progress (especially after submitting all parts on last section)
      const latestProgress = await assessmentApi.getProgress(token);
      setProgress(latestProgress);

      // Move to next section (unless this was the last)
      const currentIndex = SECTION_ORDER.indexOf(section);
      if (currentIndex < SECTION_ORDER.length - 1) {
        setCurrentSection(SECTION_ORDER[currentIndex + 1]);
      }

      return latestProgress;
    } catch (err: any) {
      console.error('Failed to submit section:', err);
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const isCompleted = progress?.completed_at != null;
  const sectionsCompleted = progress?.sections_completed || [];

  // Clear stored drafts after completion
  useEffect(() => {
    if (!token || typeof window === 'undefined') return;
    if (isCompleted) {
      localStorage.removeItem(getDraftStorageKey(token));
    }
  }, [isCompleted, token]);

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
              Please enter the personal or Illinois email address you used when you signed up.
              This helps us link your assessment to your application.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Personal or Illinois email you signed up with"
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

  // Pledge screen (after email verification, before assessment)
  if (emailVerified && !pledgeAccepted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full bg-card/80 border-border/50">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-white">Academic Integrity Pledge</CardTitle>
            <CardDescription>
              Please review and accept the following terms before starting the assessment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-background/50 rounded-lg p-6 space-y-4 max-h-96 overflow-y-auto">
              <p className="text-sm text-muted-foreground leading-relaxed">
                By starting this assessment, I agree to the following:
              </p>
              
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex gap-3">
                  <span className="text-primary font-bold flex-shrink-0">•</span>
                  <span>
                    <strong className="text-white">No Cheating:</strong> I will not cheat or attempt to gain an unfair advantage. I understand that dishonesty will result in immediate disqualification.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary font-bold flex-shrink-0">•</span>
                  <span>
                    <strong className="text-white">No Outside Resources:</strong> I will not use any external resources including the internet, ChatGPT, AI tools, Stack Overflow, documentation, or any other reference materials except what is provided in this assessment.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary font-bold flex-shrink-0">•</span>
                  <span>
                    <strong className="text-white">No Copy/Paste:</strong> I will not copy and paste code or solutions from any external source.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary font-bold flex-shrink-0">•</span>
                  <span>
                    <strong className="text-white">No Spell Check / Grammar Tools:</strong> I will not use spell checkers, grammar tools, or any automated writing assistance.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary font-bold flex-shrink-0">•</span>
                  <span>
                    <strong className="text-white">Integrity Monitoring:</strong> This assessment monitors for suspicious activity including window focus loss and AI-generated content detection. Any flagged behavior may result in disqualification.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary font-bold flex-shrink-0">•</span>
                  <span>
                    <strong className="text-white">Own Work:</strong> All work submitted must be my own. I understand that submitting work that is not entirely my own is academic dishonesty.
                  </span>
                </li>
              </ul>

              <div className="border-t border-border/30 pt-4 mt-4">
                <p className="text-xs text-muted-foreground">
                  <strong className="text-white block mb-2">Timing Information:</strong>
                  This assessment is <strong>untimed</strong>, but we recommend completing it within <strong>30-45 minutes</strong>. There is no time limit, and you can take as long as needed to complete all sections. A timer will track your elapsed time for reference.
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  <strong className="text-white block mb-1">Navigation:</strong>
                  You can move back and forth between sections (Problem, Coding, Design). Once you submit a section, it is saved as is and cannot be changed.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handlePledgeAccept}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                I Agree and Accept
              </Button>
              
              <Button
                variant="ghost"
                onClick={() => navigate('/tech')}
                className="w-full text-muted-foreground hover:text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Exit fullscreen helper
  const exitFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {
        // Ignore errors
      });
    }
  };

  // Completed state
  if (isCompleted) {
    // Exit fullscreen when assessment is complete
    exitFullscreen();
    
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-card/80 border-border/50">
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <CardTitle className="text-2xl text-white">Thank You!</CardTitle>
            <CardDescription className="text-base">
              Your assessment has been submitted successfully.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-2">
              <p className="text-muted-foreground">
                We appreciate you taking the time to complete the OTCR Technologies technical assessment.
              </p>
              <p className="text-muted-foreground">
                Our team will review your submission and <strong className="text-white">reach out soon with results</strong>.
              </p>
            </div>
            
            <div className="bg-background/50 rounded-lg p-4 border border-border/30">
              <p className="text-xs text-muted-foreground text-center">
                Submitted on {new Date(progress!.completed_at!).toLocaleString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            
            <p className="text-xs text-muted-foreground text-center">
              You may now close this window.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <img 
              src={otcrTechLogo} 
              alt="OTCR Technologies" 
              className="h-6 w-auto"
            />
            {/* Section Navigation Tabs */}
            <nav className="flex items-center gap-1">
              {SECTION_ORDER.map((section, index) => {
                const isCompleted = sectionsCompleted.includes(section);
                const isCurrent = section === currentSection;
                const labels: Record<Section, string> = {
                  problem_solving: 'Problem',
                  coding: 'Coding',
                  system_design: 'Design',
                };
                
                return (
                  <button
                    key={section}
                    onClick={() => setCurrentSection(section)}
                    className={`
                      px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2
                      ${isCurrent 
                        ? 'bg-primary/20 text-primary' 
                        : isCompleted 
                          ? 'text-green-500 hover:bg-green-500/10'
                          : 'text-muted-foreground hover:text-white hover:bg-white/5'
                      }
                    `}
                  >
                    <span className={`
                      w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold
                      ${isCurrent 
                        ? 'bg-primary text-primary-foreground' 
                        : isCompleted 
                          ? 'bg-green-500/20 text-green-500'
                          : 'bg-muted text-muted-foreground'
                      }
                    `}>
                      {isCompleted ? '✓' : index + 1}
                    </span>
                    {labels[section]}
                  </button>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {assessmentStartTime && (
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span className="font-mono font-medium text-white">{formatTime(elapsedSeconds)}</span>
              </div>
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground text-center px-4 pb-2 max-w-2xl mx-auto">
          You can move back and forth between sections. Once you submit a section, it is saved as is and cannot be changed.
        </p>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6 pb-16">
        {currentSection === 'problem_solving' && config && (
          <ProblemSolvingSection
            config={config.problemSolving}
            onSubmit={(payload) => handleSectionSubmit('problem_solving', payload)}
            initialAnswers={problemSolvingDraft}
            onAnswersChange={setProblemSolvingDraft}
            submitting={submitting}
          />
        )}
        
        {currentSection === 'coding' && config && token && (
          <CodingSection
            config={config.coding}
            token={token}
            onSubmit={(payload) => handleSectionSubmit('coding', payload)}
            onBack={() => setCurrentSection('problem_solving')}
            codeDraft={codingDraft || config.coding.problem.starterCode}
            onCodeChange={setCodingDraft}
            submitting={submitting}
          />
        )}
        
        {currentSection === 'system_design' && config && (
          <SystemDesignSection
            config={config.systemDesign}
            onSubmit={(payload) => handleSectionSubmit('system_design', payload)}
            onBack={() => setCurrentSection('coding')}
            responseDraft={systemDesignDraft}
            onResponseChange={setSystemDesignDraft}
            submitting={submitting}
          />
        )}
      </main>
    </div>
  );
};

export default DevopsAssessment;
