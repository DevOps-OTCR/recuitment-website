import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ArrowRight, ArrowDown, Code, Brain, Lightbulb, FileText, Search,
  Server, Cloud,
  GitBranch, Activity, Shield, Zap, Users, Rocket, Briefcase, Sparkles, Award
} from 'lucide-react';
import FadeContent from '@/reactbits/animations/FadeContent/FadeContent';
import SplitText from '@/reactbits/textanimations/SplitText/SplitText';
import chicagoSkyline from '@/assets/chicago_skyline.png';

const DevopsLanding = () => {
  const [token, setToken] = useState('');
  const [checkEmail, setCheckEmail] = useState('');
  const navigate = useNavigate();

  const handleStartAssessment = () => {
    if (token.trim()) {
      navigate(`/tech/assessment/${token.trim()}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleStartAssessment();
    }
  };

  const handleCheckStatus = () => {
    if (!checkEmail.trim()) return;
    navigate(`/tech/status?email=${encodeURIComponent(checkEmail.trim().toLowerCase())}`);
  };

  // Internal platform work
  const internalWork = [
    {
      icon: Users,
      title: 'Internal Platforms',
      description: 'Build dashboards and tools for consultant management, staffing visibility, and project assignment tracking.',
    },
    {
      icon: GitBranch,
      title: 'Recruiting Systems',
      description: 'Develop intake pipelines, candidate tracking, and automated workflows to streamline recruiting and onboarding.',
    },
    {
      icon: Brain,
      title: 'Knowledge Systems',
      description: 'Create RAG-powered search and Q&A over internal playbooks and documentation with citation-backed responses.',
    },
    {
      icon: Server,
      title: 'Web & Content',
      description: 'Maintain and improve public-facing sites, initiative pages, and information architecture.',
    },
  ];

  // Client consulting work (broad examples across industries)
  const consultingWork = [
    {
      icon: Activity,
      title: 'Simulation & Impact Analysis',
      description: 'Replay historical data to simulate decisions and measure impact on cost, operations, or reach.',
    },
    {
      icon: Cloud,
      title: 'Data Pipelines',
      description: 'Unify heterogeneous data—claims, encounters, broadcast feeds, ad logs—with rule-based logic and cloud ETL.',
    },
    {
      icon: Lightbulb,
      title: 'ML & Computer Vision',
      description: 'Hybrid vision pipelines (YOLO, Detectron2, Cloud Vision) for detection and metric extraction at scale.',
    },
    {
      icon: Shield,
      title: 'Production Deployment',
      description: 'Secure APIs with logging, monitoring, and validation on GCP, Kubernetes, or on-prem.',
    },
  ];

  const recruitmentSteps = [
    {
      step: 1,
      title: 'Application',
      description: 'Submit your application with your resume. Tell us about your experience and interest in tech.',
      icon: FileText,
    },
    {
      step: 2,
      title: 'Application Review',
      description: 'Our team reviews applications. Select candidates may be invited to complete an online assessment.',
      icon: Search,
    },
    {
      step: 3,
      title: 'Interviews',
      description: 'Meet the team through behavioral and technical interviews to discuss your experience and fit.',
      icon: Users,
    },
    {
      step: 4,
      title: 'Acceptance',
      description: 'Welcome to the team! Start working on real client projects and building your skills.',
      icon: Rocket,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section - same layout as main landing */}
      <section className="relative min-h-screen flex flex-col justify-center items-center text-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-navy-deep via-navy-medium to-navy-light"></div>
          <img
            src={chicagoSkyline}
            alt=""
            className="w-full h-full object-cover opacity-40 hover:opacity-50 transition-opacity duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-navy-deep/90 via-navy-medium/70 to-navy-deep/90"></div>
          <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-navy-deep/60"></div>
          <div className="absolute inset-0">
            {[...Array(30)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-teal-primary/30 rounded-full animate-float"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 4}s`,
                  animationDuration: `${4 + Math.random() * 4}s`
                }}
              />
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center items-center w-full relative z-10 px-6">
          <FadeContent delay={0.5}>
            <div className="inline-flex items-center gap-2 bg-teal-primary/10 border border-teal-primary/20 rounded-full px-6 py-3 mb-8 backdrop-blur-sm">
              <Sparkles className="w-4 h-4 text-teal-primary animate-pulse" />
              <span className="text-sm font-medium text-teal-primary">UIUC's premier technical consulting firm</span>
              <Award className="w-4 h-4 text-teal-primary" />
            </div>
          </FadeContent>

          <div className="w-full flex flex-col items-center">
            <div className="relative">
              <SplitText
                text="OTCR Technologies"
                className="text-6xl lg:text-8xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-teal-primary to-blue-accent text-center mb-6 drop-shadow-2xl"
                splitType="chars"
              />
              <div className="absolute inset-0 text-6xl lg:text-8xl font-extrabold text-teal-primary/20 animate-pulse pointer-events-none" aria-hidden>
                OTCR Technologies
              </div>
            </div>

            <FadeContent delay={1.2}>
              <p className="text-xl lg:text-2xl text-white/90 max-w-4xl mx-auto mb-6 leading-relaxed font-light">
                Build systems, ship products, and solve real world problems, alongside student engineers who care about clean code, automation, and scale.
              </p>
              <p className="text-lg text-teal-primary/90 max-w-3xl mx-auto mb-12 leading-relaxed">
                Led by top student talent, delivering real-world impact for Fortune 500 companies.
              </p>
            </FadeContent>

            <FadeContent delay={1.4}>
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                <Link to="/tech/apply">
                  <Button size="lg" className="bg-teal-primary hover:bg-teal-primary/90 text-white font-semibold px-8">
                    <FileText className="w-5 h-5 mr-2" />
                    Apply Now
                  </Button>
                </Link>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                  onClick={() => document.getElementById('apply-section')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Check Status
                  <ArrowDown className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </FadeContent>
          </div>
        </div>

        <FadeContent delay={1.2}>
          <div className="absolute left-1/2 bottom-8 -translate-x-1/2 flex flex-col items-center group cursor-pointer">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-primary/20 to-blue-accent/20 border border-teal-primary/30 flex items-center justify-center group-hover:border-teal-primary transition-all duration-300 backdrop-blur-sm group-hover:bg-teal-primary/30 group-hover:scale-110 animate-bounce-slow">
                <ArrowDown className="w-5 h-5 text-teal-primary group-hover:text-white transition-colors duration-300" />
              </div>
              <div className="absolute inset-0 rounded-full bg-teal-primary/20 animate-ping opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            <span className="text-sm text-white/75 mt-3 group-hover:text-teal-primary transition-colors duration-300 font-medium">Learn more</span>
          </div>
        </FadeContent>
      </section>

      {/* What We Do */}
      <section className="py-24 bg-navy-deep">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-white mb-6">What We Do</h2>
            <p className="text-xl text-white/85 max-w-3xl mx-auto">
              The Tech team builds internal platforms and delivers technical consulting solutions for real clients
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Internal Work */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-teal-primary/20 flex items-center justify-center">
                  <Server className="w-5 h-5 text-teal-primary" />
                </div>
                <h3 className="text-2xl font-bold text-white">Internal Platforms</h3>
              </div>
              <p className="text-white/70 mb-6 text-sm">
                Ship and improve core systems that support consultant management, recruiting, and knowledge sharing across the firm.
              </p>
              <div className="grid gap-4">
                {internalWork.map((item, idx) => (
                  <div key={idx} className="professional-card p-6 group">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-teal-primary/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                        <item.icon className="w-5 h-5 text-teal-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white mb-1">{item.title}</h4>
                        <p className="text-white/70 text-sm leading-relaxed">{item.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 rounded-lg bg-teal-primary/5 border border-teal-primary/20">
                <p className="text-xs text-teal-primary/80">
                  <span className="font-semibold">Tech stack:</span> React, TypeScript, Python, Node.js, PostgreSQL, Docker, CI/CD, Next.js
                </p>
              </div>
            </div>

            {/* Consulting Work */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-blue-accent/20 flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-blue-accent" />
                </div>
                <h3 className="text-2xl font-bold text-white">Technical Consulting</h3>
              </div>
              <p className="text-white/70 mb-6 text-sm">
                Data pipelines, ML models, and dashboards for clients across healthcare, media, adtech, and more.
              </p>
              <div className="grid gap-4">
                {consultingWork.map((item, idx) => (
                  <div key={idx} className="professional-card p-6 group">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-blue-accent/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                        <item.icon className="w-5 h-5 text-blue-accent" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white mb-1">{item.title}</h4>
                        <p className="text-white/70 text-sm leading-relaxed">{item.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 rounded-lg bg-blue-accent/5 border border-blue-accent/20">
                <p className="text-xs text-blue-accent/80">
                  <span className="font-semibold">Tech stack:</span> Python, C++, Java, SQL, REST APIs, Docker, Azure, AWS, GCP, BI
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recruitment Timeline */}
      <section className="py-24 bg-background">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-white mb-6">Recruitment Process</h2>
            <p className="text-xl text-white/85 max-w-3xl mx-auto">
              Our structured process helps us find passionate engineers who thrive in collaborative environments
            </p>
          </div>

          <div className="relative flex flex-col items-center">
            {/* Vertical line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-border z-0" style={{ transform: 'translateX(-50%)' }} />
            
            {/* Timeline events */}
            {recruitmentSteps.map((step, idx) => {
              const isLeft = idx % 2 === 0;
              return (
                <div key={idx} className="w-full flex flex-col md:flex-row items-center mb-16 last:mb-0 relative">
                  {/* Left side (card if left, empty if right) */}
                  <div className={`md:w-1/2 flex ${isLeft ? 'justify-end' : 'justify-end md:invisible'}`}>
                    {isLeft && (
                      <div className="professional-card p-8 max-w-xl w-full">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full bg-teal-primary/20 flex items-center justify-center">
                            <step.icon className="w-5 h-5 text-teal-primary" />
                          </div>
                          <div>
                            <div className="text-xs text-teal-primary font-semibold uppercase tracking-wide">Step {step.step}</div>
                            <div className="font-extrabold text-2xl text-white">{step.title}</div>
                          </div>
                        </div>
                        <p className="text-base text-white/90">{step.description}</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Timeline circle */}
                  <div className="z-20 flex flex-col items-center w-0 mx-4">
                    <div className="w-8 h-8 rounded-full border-4 border-border bg-background flex items-center justify-center" />
                  </div>
                  
                  {/* Right side (card if right, empty if left) */}
                  <div className={`md:w-1/2 flex ${!isLeft ? 'justify-start' : 'justify-start md:invisible'}`}>
                    {!isLeft && (
                      <div className="professional-card p-8 max-w-xl w-full">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full bg-teal-primary/20 flex items-center justify-center">
                            <step.icon className="w-5 h-5 text-teal-primary" />
                          </div>
                          <div>
                            <div className="text-xs text-teal-primary font-semibold uppercase tracking-wide">Step {step.step}</div>
                            <div className="font-extrabold text-2xl text-white">{step.title}</div>
                          </div>
                        </div>
                        <p className="text-base text-white/90">{step.description}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Apply Section */}
      <section id="apply-section" className="py-24 bg-navy-deep">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-extrabold text-white mb-6">Ready to Join?</h2>
            <p className="text-xl text-white/85 max-w-2xl mx-auto">
              Apply now, check your application status, or start your assessment
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Apply Now */}
            <Card className="bg-gradient-to-br from-teal-primary/20 to-teal-primary/5 border-teal-primary/30">
              <CardHeader className="text-center pb-4">
                <div className="w-14 h-14 rounded-full bg-teal-primary/20 flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-7 h-7 text-teal-primary" />
                </div>
                <CardTitle className="text-xl text-white">Apply Now</CardTitle>
                <CardDescription>
                  Submit your application to join the Technologies Division
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/tech/apply">
                  <Button className="w-full bg-teal-primary hover:bg-teal-primary/90 text-white">
                    Start Application
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Check Status */}
            <Card className="bg-card/80 backdrop-blur-sm border-border/50">
              <CardHeader className="text-center pb-4">
                <div className="w-14 h-14 rounded-full bg-blue-accent/20 flex items-center justify-center mx-auto mb-4">
                  <Search className="w-7 h-7 text-blue-accent" />
                </div>
                <CardTitle className="text-xl text-white">Check Status</CardTitle>
                <CardDescription>
                  Already applied? Check your application status
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={checkEmail}
                  onChange={(e) => setCheckEmail(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleCheckStatus()}
                  className="bg-background/50 border-border text-white placeholder:text-muted-foreground"
                />
                <Button 
                  onClick={handleCheckStatus}
                  disabled={!checkEmail.trim()}
                  variant="outline"
                  className="w-full"
                >
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Open Status Portal
                  </>
                </Button>
                <p className="text-xs text-muted-foreground">
                  We&apos;ll take you to the applicant portal and prefill this email for lookup.
                </p>
              </CardContent>
            </Card>

            {/* Assessment Code */}
            <Card className="bg-card/80 backdrop-blur-sm border-border/50">
              <CardHeader className="text-center pb-4">
                <div className="w-14 h-14 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
                  <Code className="w-7 h-7 text-purple-400" />
                </div>
                <CardTitle className="text-xl text-white">Have a Code?</CardTitle>
                <CardDescription>
                  Enter your assessment code to begin
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  type="text"
                  placeholder="Enter assessment code"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="bg-background/50 border-border text-white placeholder:text-muted-foreground"
                />
                <Button 
                  onClick={handleStartAssessment}
                  disabled={!token.trim()}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                >
                  Begin Assessment
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <p className="text-xs text-muted-foreground text-center pt-1">
                  Your progress will be saved automatically
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Assessment Preview */}
      <section className="py-16 px-6 bg-background">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold text-white mb-4">What's in the Assessment?</h3>
            <p className="text-muted-foreground">A 30-45 minute evaluation of your technical skills</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="professional-card p-6 group">
              <div className="w-10 h-10 rounded-lg bg-teal-primary/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                <Brain className="w-5 h-5 text-teal-primary" />
              </div>
              <h4 className="text-lg font-bold text-white mb-1">Problem Solving</h4>
              <p className="text-sm text-teal-primary mb-3">~8-10 minutes</p>
              <p className="text-white/80 text-sm">
                6 quick questions testing your analytical thinking and decision-making approach.
              </p>
            </div>

            <div className="professional-card p-6 group">
              <div className="w-10 h-10 rounded-lg bg-blue-accent/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                <Code className="w-5 h-5 text-blue-accent" />
              </div>
              <h4 className="text-lg font-bold text-white mb-1">Coding Challenge</h4>
              <p className="text-sm text-blue-accent mb-3">~12-18 minutes</p>
              <p className="text-white/80 text-sm">
                One coding problem in Python. Write and run your code with instant feedback.
              </p>
            </div>

            <div className="professional-card p-6 group">
              <div className="w-10 h-10 rounded-lg bg-cyan-accent/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                <Lightbulb className="w-5 h-5 text-cyan-accent" />
              </div>
              <h4 className="text-lg font-bold text-white mb-1">System Design</h4>
              <p className="text-sm text-cyan-accent mb-3">~10-15 minutes</p>
              <p className="text-white/80 text-sm">
                Design a simple feature. Show how you break down problems and think about trade-offs.
              </p>
            </div>
          </div>

          {/* Tips */}
          <div className="mt-12 max-w-2xl mx-auto">
            <h4 className="text-lg font-semibold text-white mb-4 text-center">Tips Before You Start</h4>
            <ul className="space-y-3 text-muted-foreground text-sm">
              <li className="flex items-start gap-3">
                <Zap className="w-4 h-4 text-teal-primary mt-0.5 flex-shrink-0" />
                Find a quiet place with a stable internet connection
              </li>
              <li className="flex items-start gap-3">
                <Zap className="w-4 h-4 text-teal-primary mt-0.5 flex-shrink-0" />
                Have a text editor ready if you want to draft code locally
              </li>
              <li className="flex items-start gap-3">
                <Zap className="w-4 h-4 text-teal-primary mt-0.5 flex-shrink-0" />
                You can only submit each section once — review before submitting
              </li>
              <li className="flex items-start gap-3">
                <Zap className="w-4 h-4 text-teal-primary mt-0.5 flex-shrink-0" />
                There's no penalty for wrong answers — show your thinking process
              </li>
            </ul>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default DevopsLanding;
