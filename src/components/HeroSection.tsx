import { ArrowDown, Sparkles, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SplitText from '../reactbits/textanimations/SplitText/SplitText';
import FadeContent from '../reactbits/animations/FadeContent/FadeContent';
import chicagoSkyline from '/src/assets/chicago_skyline.png';

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex flex-col justify-center items-center text-center overflow-hidden">
      {/* Enhanced Background with Parallax Effect */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-navy-deep via-navy-medium to-navy-light"></div>
        <img
          src={chicagoSkyline}
          alt="University of Illinois campus"
          className="w-full h-full object-cover opacity-40 hover:opacity-50 transition-opacity duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-navy-deep/90 via-navy-medium/70 to-navy-deep/90"></div>
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-navy-deep/60"></div>

        {/* Animated Particles */}
        <div className="absolute inset-0">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className={`absolute w-1 h-1 bg-teal-primary/30 rounded-full animate-float`}
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
        {/* Badge */}
        <FadeContent delay={0.5}>
          <div className="inline-flex items-center gap-2 bg-teal-primary/10 border border-teal-primary/20 rounded-full px-6 py-3 mb-8 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-teal-primary animate-pulse" />
            <span className="text-sm font-medium text-teal-primary">Premier Student Consulting Firm</span>
            <Award className="w-4 h-4 text-teal-primary" />
          </div>
        </FadeContent>

        <div className="w-full flex flex-col items-center">
          <div className="relative">
            <SplitText
              text="OTCR Consulting"
              className="text-6xl lg:text-8xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-teal-primary to-blue-accent text-center mb-6 drop-shadow-2xl"
              splitType="chars"
            />
            {/* Glow effect */}
            <div className="absolute inset-0 text-6xl lg:text-8xl font-extrabold text-teal-primary/20  animate-pulse">
              OTCR Consulting
            </div>
          </div>

          <FadeContent delay={1.2}>
            <p className="text-xl lg:text-2xl text-white/90 max-w-4xl mx-auto mb-6 leading-relaxed font-light">
              Empowering businesses through strategic consulting and innovative solutions.
            </p>
            <p className="text-lg text-teal-primary/90 max-w-3xl mx-auto mb-12 leading-relaxed">
              Led by top student talent, delivering real-world impact for Fortune 500 companies.
            </p>
          </FadeContent>

          <FadeContent delay={1.4}>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Button
                size="lg"
                className="relative bg-gradient-to-r from-teal-primary to-blue-accent hover:from-teal-light hover:to-blue-light text-white px-10 py-4 text-lg font-semibold transition-all duration-300 hover:scale-105 shadow-2xl hover:shadow-teal-primary/25 group overflow-hidden"
                onClick={() => window.location.href = '/apply'}
              >
                <span className="relative z-10">Apply Now</span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="relative border-2 border-white/50 text-white hover:bg-white/10 hover:border-white hover:text-white px-10 py-4 text-lg font-semibold transition-all duration-300 hover:scale-105 shadow-2xl backdrop-blur-sm group"
                onClick={() => window.location.href = '/about'}
              >
                <span className="relative z-10">About Us</span>
                <div className="absolute inset-0 bg-gradient-to-r from-teal-primary/10 to-blue-accent/10 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
              </Button>
            </div>
          </FadeContent>

          {/* Stats */}
          <FadeContent delay={1.6}>
            <div className="grid grid-cols-3 gap-8 mt-16 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-teal-primary mb-2">50+</div>
                <div className="text-sm text-white/80">Projects Completed</div>
              </div>
              <div className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-blue-accent mb-2">15+</div>
                <div className="text-sm text-white/80">Industry Partners</div>
              </div>
              <div className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-cyan-accent mb-2">98%</div>
                <div className="text-sm text-white/80">Success Rate</div>
              </div>
            </div>
          </FadeContent>
        </div>
      </div>

      {/* Enhanced scroll indicator */}
      <FadeContent delay={1.8}>
        <div className="absolute left-1/2 bottom-8 -translate-x-1/2 flex flex-col items-center group cursor-pointer">
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-primary/20 to-blue-accent/20 border border-teal-primary/30 flex items-center justify-center group-hover:border-teal-primary transition-all duration-300 backdrop-blur-sm group-hover:bg-teal-primary/30 group-hover:scale-110 animate-bounce-slow">
              <ArrowDown className="w-5 h-5 text-teal-primary group-hover:text-white transition-colors duration-300" />
            </div>
            <div className="absolute inset-0 rounded-full bg-teal-primary/20 animate-ping opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>
          <span className="text-sm text-white/75 mt-3 group-hover:text-teal-primary transition-colors duration-300 font-medium">Discover More</span>
        </div>
      </FadeContent>
    </section>
  );
};

export default HeroSection;
