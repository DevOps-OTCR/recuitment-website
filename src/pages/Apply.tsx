import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { ArrowDown } from 'lucide-react';
import FadeContent from '@/reactbits/animations/FadeContent/FadeContent';
import SplitText from '@/reactbits/textanimations/SplitText/SplitText';

const chicagoSkyline = new URL('../assets/chicago_skyline.png', import.meta.url).href;
const cycle = 'Fall 2026';
const interestForm = 'https://docs.google.com/forms/d/1EhjSbp5X06GLFBy6pY3oTAaHrpmnH2_0MkmDNrDGBZo/viewform';
// Update the cycle and each role's availability when recruitment opens or closes.
const applications = [
  {
    name: 'Consultant',
    open: false,
    url: 'https://docs.google.com/forms/d/e/1FAIpQLScRGd_jSfsG86TSIEvweEsDQ6qSc35pk3S81C0U3R1eT7LIWw/viewform?usp=header',
  },
  {
    name: 'Technology',
    open: false,
    url: 'https://docs.google.com/forms/d/e/1FAIpQLSc8ufeVn9KoAHKiBEY_Y2BKxA-uFw13qmfVbQLdos7HNlmj3Q/viewform?usp=header',
  },
];

const Apply = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
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
            text="Apply to OTCR"
            className="text-5xl lg:text-6xl font-extrabold text-white text-center mb-6"
            splitType="words"
          />
          <FadeContent delay={1}>
            <p className="text-xl text-white/90 text-center max-w-3xl mx-auto">
              {applications.some(application => application.open)
                ? `See which ${cycle} applications are open below.`
                : `${cycle} applications are closed.`}{' '}
              For recruitment updates, fill out the{' '}
              <a href={interestForm} target="_blank" rel="noopener noreferrer" className="text-accent underline underline-offset-4">
                interest form
              </a>.
            </p>
          </FadeContent>
        </div>
        {/* Scroll arrow */}
        <div className="absolute left-1/2 bottom-8 -translate-x-1/2 flex flex-col items-center animate-bounce-slow">
          <ArrowDown className="w-8 h-8 text-accent" />
          <span className="text-sm text-white/75 mt-2">Scroll to know more</span>
        </div>
      </section>

      {/* Interest Form Section */}
      <section className="py-24 bg-card">
        <div className="section-container">
          <div className="max-w-4xl mx-auto text-center animate-scale-in">
            <h2 className="text-4xl lg:text-5xl font-extrabold text-white mb-8">
              {cycle} applications
            </h2>
            <ul className="mx-auto mb-8 max-w-md divide-y divide-border text-left">
              {applications.map(application => (
                <li key={application.name} className="flex items-center justify-between gap-4 py-4">
                  {application.open ? (
                    <a href={application.url} target="_blank" rel="noopener noreferrer" className="font-medium text-accent underline underline-offset-4">
                      {application.name} Application
                    </a>
                  ) : (
                    <span>{application.name} Application</span>
                  )}
                  <span className="text-muted-foreground">{application.open ? 'Open' : 'Closed'}</span>
                </li>
              ))}
            </ul>
            <Button asChild size="lg">
              <a href={interestForm} target="_blank" rel="noopener noreferrer">Interest Form</a>
            </Button>
          </div>
        </div>
      </section>



      <Footer />
    </div>
  );
};

export default Apply;
