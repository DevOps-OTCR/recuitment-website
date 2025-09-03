import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { ArrowDown } from 'lucide-react';
import chicagoSkyline from '/src/assets/chicago_skyline.png';
import FadeContent from '@/reactbits/animations/FadeContent/FadeContent';
import SplitText from '@/reactbits/textanimations/SplitText/SplitText';

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
              Take the first step towards joining our elite consulting team. Fill out our interest form to stay informed about upcoming events and opportunities.
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
              Fill out our interest form to stay informed about upcoming events, or start working on your application!
            </h2>
            <p className="text-xl text-white/90 mb-12 max-w-3xl mx-auto">
              Applications will open soon. For now, express your interest and we'll keep you updated on all opportunities and events.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Button
                size="lg"
                className="bg-teal-primary hover:bg-teal-light text-white px-8 py-4 text-lg font-semibold hover-scale shadow-lg"
              >
                Interest Form
              </Button>
              <Button
                size="lg"
                className="bg-slate-accent hover:bg-teal-muted text-white px-8 py-4 text-lg font-semibold hover-scale opacity-50 cursor-not-allowed"
                disabled
              >
                Application (Coming Soon)
              </Button>
            </div>
          </div>
        </div>
      </section>



      <Footer />
    </div>
  );
};

export default Apply;
