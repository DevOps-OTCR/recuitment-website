import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Linkedin, ArrowDown, Mail } from 'lucide-react';
import ScrollReveal from '@/reactbits/textanimations/ScrollReveal/ScrollReveal';
import FadeContent from '@/reactbits/animations/FadeContent/FadeContent';
import SplitText from '@/reactbits/textanimations/SplitText/SplitText';

import lakshImg from '/src/assets/laksh.jpeg';
import aaronImg from '/src/assets/aaron.jpeg';
import shritanImg from '/src/assets/shritan.jpeg';
import ivanImg from '/src/assets/ivan.jpeg';
import rohanImg from '/src/assets/rohan.jpeg';
import manImg from '/src/assets/man.jpeg';
import anuImg from '/src/assets/anu.jpeg';
import chinmayImg from '/src/assets/chinmay.jpeg';
import rishabhImg from '/src/assets/rishabh.jpeg';
import chicagoSkyline from '/src/assets/chicago_skyline.png';

const partners = [
  {
    name: 'Aaron Poetzel',
    role: 'Internal Operations Partner',
    img: aaronImg,
    linkedin: 'https://www.linkedin.com/in/aaron-poetzel/',
    mail: 'poetzel3@illinois.edu'
  },
  {
    name: 'Laksh Sharma',
    role: 'Executive Partner',
    img: lakshImg,
    linkedin: 'https://linkedin.com/in/laksh-sharma-690b6a298',
    mail: 'lsharma2@illinois.edu'
  },
  {
    name: 'Man Kwanpracha',
    role: 'Project Excellence Partner',
    img: manImg,
    linkedin: '',
    mail: ''
  },
  {
    name: 'Shritan Bhupathiraju',
    role: 'Corporate Affairs Partner',
    img: shritanImg,
    linkedin: '',
    mail: ''
  },
  {
    name: 'Ivan Nang',
    role: 'Professional Development Partner',
    img: ivanImg,
    linkedin: '',
    mail: ''
  },
  {
    name: 'Anu Ghosh',
    role: 'Alumni Relations Partner',
    img: anuImg,
    linkedin: '',
    mail: ''
  },
  {
    name: 'Chinmay Rawat',
    role: 'Technology Partner',
    img: chinmayImg,
    linkedin: '',
    mail: ''
  },
  {
    name: 'Rohan Raman',
    role: 'Social Partner',
    img: rohanImg,
    linkedin: '',
    mail: ''
  },
  {
    name: 'Rishabh Chhabra',
    role: 'Finance Partner',
    img: rishabhImg,
    linkedin: '',
    mail: ''
  }
];

const Leadership = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Leadership Hero Section */}
      <section className="min-h-screen flex flex-col justify-center items-center text-center relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-navy-deep via-navy-medium to-navy-light"></div>
          <img
            src={chicagoSkyline}
            alt="University of Illinois campus"
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-navy-deep/90 via-navy-medium/70 to-navy-deep/90"></div>
        </div>

        <div className="w-full flex flex-col items-center relative z-10 px-6">

          <SplitText
            text="Lead by Mission-Driven People"
            className="text-5xl lg:text-7xl font-extrabold bg-clip-text bg-gradient-to-r from-white via-teal-primary to-blue-accent text-center mb-6 drop-shadow-2xl"
            splitType="words"
          />
          <FadeContent delay={1}>
            <p className="text-xl lg:text-2xl text-white/90 text-center max-w-4xl mx-auto mb-6 leading-relaxed font-light">
              Whose expertise can be yours during our collaboration
            </p>
            <p className="text-lg text-teal-primary/90 text-center max-w-3xl mx-auto leading-relaxed">
              Meet the experienced leaders guiding OTCR's strategic vision and operational excellence
            </p>
          </FadeContent>
        </div>

        {/* Enhanced scroll arrow */}
        <FadeContent delay={1.5}>
          <div className="absolute left-1/2 bottom-8 -translate-x-1/2 flex flex-col items-center group cursor-pointer">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-primary/20 to-blue-accent/20 border border-teal-primary/30 flex items-center justify-center group-hover:border-teal-primary transition-all duration-300 backdrop-blur-sm group-hover:bg-teal-primary/30 group-hover:scale-110 animate-bounce-slow">
                <ArrowDown className="w-5 h-5 text-teal-primary group-hover:text-white transition-colors duration-300" />
              </div>
              <div className="absolute inset-0 rounded-full bg-teal-primary/20 animate-ping opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            <span className="text-sm text-white/75 mt-3 group-hover:text-teal-primary transition-colors duration-300 font-medium">Meet The Team</span>
          </div>
        </FadeContent>
      </section>

      {/*
      <section className="py-24 bg-card">
        <div className="section-container">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-white mb-6">Our Leadership in Action</h2>
            <p className="text-xl text-white/90 max-w-3xl mx-auto">See our leaders collaborating and making an impact</p>
          </div>

          <FadeContent delay={0.2}>
            <div className="image-placeholder aspect-video max-w-4xl mx-auto rounded-2xl mb-16">
              <div className="text-center">
                <svg className="w-20 h-20 mb-6 mx-auto opacity-80" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
                <p className="text-2xl font-semibold mb-2">Leadership Team Photo</p>
                <p className="text-lg opacity-75">Add a professional group photo of your leadership team here</p>
              </div>
            </div>
          </FadeContent>
        </div>
      </section>
      */}

      {/* Team Grid Section */}
      <section className="py-24 bg-background">
        <div className="section-container">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-white mb-6">Meet Our Leaders</h2>
            <p className="text-xl text-white/85 max-w-3xl mx-auto">Get to know the individuals shaping our future</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto align-items-middle">
            {partners.map((partner, idx) => (
              <FadeContent key={idx} delay={idx * 0.1}>
                <div className="professional-card rounded-2xl overflow-hidden flex flex-col group ">
                  {partner.img ? (
                    <img 
                      src={partner.img} 
                      alt={partner.name} 
                      className="w-full aspect-square object-cover object-top group-hover:scale-110 transition-transform duration-300" 
                    />
                  ) : (
                    <div className="w-full aspect-square bg-navy-light flex items-center justify-center text-4xl text-teal-primary group-hover:text-teal-light transition-colors duration-300">
                      <div className="w-16 h-16 rounded-full bg-teal-primary/20 flex items-center justify-center">
                        ?
                      </div>
                    </div>
                  )}
                  <div className="p-6 flex-1 flex flex-col justify-end">
                    <div className="text-lg font-semibold text-white mb-1 group-hover:text-teal-primary transition-colors duration-300">{partner.name}</div>
                    <div className="text-md text-white/80 mb-4">{partner.role}</div>
                    <div className="flex items-center space-x-3 mt-auto">
                      {partner.linkedin && (
                        <a
                          href={partner.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-accent transition-all duration-300 p-2 rounded-full hover:bg-accent/10 group"
                        >
                          <Linkedin className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                        </a>
                      )}
                      {partner.mail && (
                        <a href={`mailto:${partner.mail}`} className="text-muted-foreground hover:text-accent transition-all duration-300 p-2 rounded-full hover:bg-accent/10 group" >
                          <Mail className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </FadeContent>
            ))}
          </div>
        </div>
      </section>


      {/* Leadership Philosophy Section */}
      <section className="py-24 bg-navy-deep">
        <div className="section-container">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-extrabold text-white mb-8">Our Leadership Philosophy</h2>
            <FadeContent delay={0.3}>
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                At OTCR, we believe that great leadership comes from a combination of expertise, empathy, and innovation. Our leadership team is carefully selected not just for their academic achievements, but for their passion for mentoring and their commitment to excellence.
              </p>
            </FadeContent>
            <FadeContent delay={0.5}>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Each leader brings unique perspectives from diverse backgrounds and industries, ensuring that our consulting approach is both comprehensive and cutting-edge. Together, they foster an environment where both clients and team members can thrive and achieve their goals.
              </p>
            </FadeContent>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Leadership;
