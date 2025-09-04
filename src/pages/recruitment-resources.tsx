import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { ArrowDown } from 'lucide-react';
import chicagoSkyline from '/src/assets/chicago_skyline.png';
import FadeContent from '@/reactbits/animations/FadeContent/FadeContent';
import SplitText from '@/reactbits/textanimations/SplitText/SplitText';
import React from 'react';

const RecruitmentResources = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      {/* Intro Section */}
      <section className="min-h-screen flex flex-col justify-center items-center bg-background text-center">
        <div className="absolute inset-0 z-0">
                        <img
                          src={chicagoSkyline}
                          alt="University of Illinois campus"
                          className="w-full h-full object-cover opacity-70"
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background/80"></div>
                      </div>
        <div className="w-full flex flex-col items-center relative z-10">
          <SplitText
            text="Recruitment Resources"
            className="text-5xl lg:text-6xl font-extrabold text-white text-center mb-6"
            splitType="words"
          />
          <FadeContent delay={1}>
            <p className="text-xl text-white/90 text-center max-w-3xl mx-auto">
              Prepare for your OTCR recruitment journey with our curated interview tips, practice cases, and essential resources. Everything you need to succeed in the recruitment process is right here.
            </p>
          </FadeContent>
        </div>
        {/* Scroll arrow */}
        <div className="absolute left-1/2 bottom-8 -translate-x-1/2 flex flex-col items-center animate-bounce-slow">
          <ArrowDown className="w-8 h-8 text-accent" />
          <span className="text-sm text-muted-foreground mt-2">Scroll to know more</span>
        </div>
      </section>

      {/* --- INTERVIEWS SECTION --- */}
      <section className="bg-card text-white py-24 px-6 lg:px-8 rounded-2xl border border-border mb-24 mt-24 animate-scale-in">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-extrabold mb-12 animate-fade-in-up">Interviews</h2>
          
          {/* Round 1 Interview */}
          <div className="mb-16">
            <div className="animate-fade-in-up">
              <h3 className="text-2xl font-bold mb-4 text-teal-primary">Round 1 Interview</h3>
              <p className="text-lg text-white/85 leading-relaxed">
                <b>Consulting:</b> First round interviews will be split into two portions, a behavioral section and a case interview. The case interview will be interviewer led, and candidates will be evaluated on their problem solving and critical thinking skills. Candidates can expect a market sizing question, such as "How many t-shirts are sold in New York City?", within the business strategy problem they will be looking into.
              </p>
              <br />
              <p className="text-lg text-white/85 leading-relaxed">
                <b>Dev Ops:</b> First round interviews will bea behavioral interview with a few technical questions. The technical interview will be based on basic tech stack and programming languages, and candidates will be evaluated on their knowledge and proficiency.
              </p>
            </div>
          </div>

          {/* Coffee Chat */}
          <div className="mb-16">
            <div className="animate-fade-in-up">
              <h3 className="text-2xl font-bold mb-4 text-cyan-accent">Coffee Chat</h3>
              <p className="text-lg text-white/85 leading-relaxed">
                After the first round, selected candidates will be invited for an informal coffee chat with current OTCR members. This is an opportunity for mutual evaluation - we get to know you better personally and professionally, while you can ask questions about OTCR culture, projects, and what it's really like to be part of our organization. This relaxed setting allows for genuine conversation about your interests, career goals, and how you might contribute to our team.
              </p>
            </div>
          </div>

          {/* Round 2 Interview */}
          <div className="mb-16">
            <div className="animate-fade-in-up">
              <h3 className="text-2xl font-bold mb-4 text-cyan-accent">Round 2 Interview</h3>
              <p className="text-lg text-white/85 leading-relaxed">
                <b>Consulting: </b>Second round interviews are more focused on the traditional case interview, which will be interviewee led. We look for the ability to break down a problem into manageable and understandable pieces, draw concise conclusions from available data, and engage in a focused conversation with the interviewer. Candidates will develop a strategy to solve a business question, such as determining the cause and proposing a recommendation for declining profits.
              </p>
              <br />
              <p className="text-lg text-white/85 leading-relaxed">
                <b>Dev Ops: </b>Second round interviews are more focused on the traditional coding interview, which will be interviewer led. We look for the ability to break down a tech problem into small easy to code pieces, program small mockups based on requiremtns, and work with LLM's to bring the idea to life. Candidates will develop a small part of a project to solve a real life problem, such as creating a internal dashboard of a company.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- MARKET SIZING QUESTIONS SECTION --- */}
      <section className="py-24 bg-background">
        <div className="section-container">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-white mb-6 animate-fade-in-up">Market Sizing Practice Questions</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">Sharpen your analytical skills with these practice problems</p>
          </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="professional-card p-8 text-center animate-fade-in-up">
                  <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-2xl font-bold text-accent">1</span>
                  </div>
                  <h3 className="text-xl font-bold text-accent mb-4">Question 1</h3>
                  <p className="text-muted-foreground">How many coffee shops are there in Chicago?</p>
                </div>
                <div className="professional-card p-8 text-center animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                  <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-2xl font-bold text-accent">2</span>
                  </div>
                  <h3 className="text-xl font-bold text-accent mb-4">Question 2</h3>
                  <p className="text-muted-foreground">What is the market size for smartphones in the United States?</p>
                </div>
                <div className="professional-card p-8 text-center animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                  <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-2xl font-bold text-accent">3</span>
                  </div>
                  <h3 className="text-xl font-bold text-accent mb-4">Question 3</h3>
                  <p className="text-muted-foreground">How many pizza slices are consumed daily in New York City?</p>
                </div>
            </div>
        </div>
      </section>

      {/* --- CASE EXAMPLES SECTION --- */}
      <section className="py-24 bg-navy-deep">
        <div className="section-container">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-white mb-6 animate-fade-in-up">Second Round Case Examples</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">Practice with these comprehensive business case scenarios</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="professional-card p-8 animate-fade-in-up">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-accent" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4zm2.5 2.25l1.5-1.5V6.75l-1.5-1.5H5.5L4 6.75v11.5l1.5 1.5h14z"/>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-accent mb-4">Bell & Harris Case</h3>
              </div>
              <p className="text-muted-foreground mb-4 text-center">A comprehensive case study examining strategic challenges and opportunities in the consulting industry.</p>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 mb-6">
                <li>Focus on revenue and cost analysis</li>
                <li>Consider market dynamics</li>
                <li>Propose actionable recommendations</li>
              </ul>
              <div className="text-center">
                <a
                  href="/assets/bell_n_harris.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-accent/20 hover:bg-accent/30 text-accent px-4 py-2 rounded-lg transition-colors font-medium"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                  </svg>
                  Download PDF
                </a>
              </div>
            </div>
            <div className="professional-card p-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-accent" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-accent mb-4">Soloman Energy Case</h3>
              </div>
              <p className="text-muted-foreground mb-4 text-center">An energy sector case study focusing on market entry strategies and operational optimization challenges.</p>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 mb-6">
                <li>Assess market attractiveness</li>
                <li>Evaluate competitive landscape</li>
                <li>Develop entry strategy</li>
              </ul>
              <div className="text-center">
                <a
                  href="/assets/soloman_energy.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-accent/20 hover:bg-accent/30 text-accent px-4 py-2 rounded-lg transition-colors font-medium"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                  </svg>
                  Download PDF
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- LEARNING RESOURCES SECTION --- */}
      <section className="py-24 bg-background">
        <div className="section-container">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-white mb-6 animate-fade-in-up">Learning Resources</h2>
            <p className="text-xl text-white/85 max-w-3xl mx-auto">Additional materials to help you prepare for success</p>
          </div>
            <div className="grid grid-cols-1 gap-8 max-w-2xl mx-auto">
                <div className="professional-card p-6 hover-scale animate-fade-in-up">
                  <div className="mb-4">
                    <img
                      src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=200&fit=crop&crop=focalpoint"
                      alt="Case interview training session"
                      className="w-full h-32 object-cover rounded-lg mb-4"
                    />
                  </div>
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-teal-primary rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-white">Case Interview Fundamentals</h3>
                  </div>
                  <p className="text-white/80 text-sm mb-4">Learn the basics of structuring and solving case interviews with this comprehensive guide.</p>
                  <a href="#" className="text-teal-primary hover:text-cyan-accent text-sm font-medium">Watch Video →</a>
                </div>
            </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default RecruitmentResources;
