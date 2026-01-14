import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { ArrowDown } from 'lucide-react';
import FadeContent from '@/reactbits/animations/FadeContent/FadeContent';
import SplitText from '@/reactbits/textanimations/SplitText/SplitText';

const chicagoSkyline = new URL('../assets/chicago_skyline.png', import.meta.url).href;

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
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a
                href="https://docs.google.com/forms/d/e/1FAIpQLSd9imBmn6u_4MKFTn4ZD5lzQkMQQzDkCsdaKQTgS-nZFq4VnQ/viewform"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  size="lg"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-4 text-base font-medium hover-scale"
                >
                  Consultant Application
                </Button>
              </a>

              <a
                href="https://docs.google.com/forms/d/e/1FAIpQLSci6UG2bIJP4G36TDTlZ1IWg2GkAF_WaUk1uzh_ibmnkDohiw/viewform"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  size="lg"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-4 text-base font-medium hover-scale"
                >
                  Interest Form
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>



      <Footer />
    </div>
  );
};

export default Apply;
