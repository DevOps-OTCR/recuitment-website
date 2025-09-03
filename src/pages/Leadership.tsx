import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Linkedin, ArrowDown, Mail } from 'lucide-react';
import ScrollReveal from '@/reactbits/textanimations/ScrollReveal/ScrollReveal';
import FadeContent from '@/reactbits/animations/FadeContent/FadeContent';
import SplitText from '@/reactbits/textanimations/SplitText/SplitText';

import atharvaImg from '/src/assets/atharva.png';
import sidhaarthaImg from '/src/assets/sidhaartha.png';
import stutiImg from '/src/assets/stuti.png';
import adamImg from '/src/assets/adam.png';
import drewImg from '/src/assets/drew.png';
import avaImg from '/src/assets/ava.png';
import lakshImg from '/src/assets/laksh.png';
import jonImg from '/src/assets/jon.png';
import samImg from '/src/assets/sam.png';
import chicagoSkyline from '/src/assets/chicago_skyline.png';

const partners = [
  {
    name: 'Atharva Awasthi',
    role: 'Internal Operations Partner',
    img: atharvaImg,
    linkedin: 'https://linkedin.com/in/atharvaawasthi',
    mail: 'awasthi8@illinois.edu'
  },
  {
    name: 'Sidhaartha Venkatesh',
    role: 'Sourcing Partner',
    img: sidhaarthaImg,
    linkedin: 'https://linkedin.com/in/siddhaartav',
    mail: 'sv39@illinois.edu'
  },
  {
    name: 'Sam Birdsley',
    role: 'Project Excellence Partner',
    img: samImg,
    linkedin: 'https://linkedin.com/in/sam-birdsley-189655248',
    mail: 'samuel36@illinois.edu'
  },
  {
    name: 'Stuti Bhatia',
    role: 'Alumni Relations Partner',
    img: stutiImg,
    linkedin: 'https://linkedin.com/in/stuti-bhatia',
    mail: 'stutib3@illinois.edu'
  },
  {
    name: 'Adam El Bahey',
    role: 'Social Partner',
    img: adamImg,
    linkedin: 'https://linkedin.com/in/adam-el-bahey-64a791209',
    mail: 'elbahey2@illinois.edu'
  },
  {
    name: 'Laksh Sharma',
    role: 'Tech Partner',
    img: lakshImg,
    linkedin: 'https://linkedin.com/in/laksh-sharma-690b6a298',
    mail: 'lsharma2@illinois.edu'
  },
  {
    name: 'Jon Han',
    role: 'Professional Development Partner',
    img: jonImg,
    linkedin: 'https://linkedin.com/in/hanjon',
    mail: 'jonhan2@illinois.edu'
  },
  {
    name: 'Drew Duckler',
    role: 'Career Placement Partner',
    img: drewImg,
    linkedin: 'https://linkedin.com/in/drew-duckler-34176a250',
    mail: 'drewmd3@illinois.edu'
  },
  {
    name: 'Ava Shi',
    role: 'New Hire Development Partner',
    img: avaImg,
    linkedin: 'https://linkedin.com/in/ava-shi-b45b1b277',
    mail: 'avas5@illinois.edu'
  },
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
          <FadeContent delay={0.3}>
            <div className="inline-flex items-center gap-2 bg-teal-primary/10 border border-teal-primary/20 rounded-full px-6 py-3 mb-8 backdrop-blur-sm">
              <div className="w-2 h-2 bg-teal-primary rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-teal-primary">Our Leadership Team</span>
            </div>
          </FadeContent>

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
                <div className="professional-card rounded-2xl overflow-hidden flex flex-col group">
                  {partner.img ? (
                    <img src={partner.img} alt={partner.name} className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-64 bg-navy-light flex items-center justify-center text-4xl text-teal-primary group-hover:text-teal-light transition-colors duration-300">
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
                      <a href={`mailto:${partner.mail}`} className="text-muted-foreground hover:text-accent transition-all duration-300 p-2 rounded-full hover:bg-accent/10 group" >
                        <Mail className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                      </a>
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
