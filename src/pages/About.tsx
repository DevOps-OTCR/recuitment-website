import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import PastClients from '@/components/PastClients';
import { Button } from '@/components/ui/button';
import { Linkedin, ArrowDown, Instagram } from 'lucide-react';
import ScrollReveal from '@/reactbits/textanimations/ScrollReveal/ScrollReveal';
import FadeContent from '@/reactbits/animations/FadeContent/FadeContent';
import AnimatedContent from '@/reactbits/animations/AnimatedContent/AnimatedContent';
import SplitText from '@/reactbits/textanimations/SplitText/SplitText';
import teamEventsImg from '/src/assets/team_events.JPG';
import awardsImg from '/src/assets/awards.png';
import chicagoSkyline from '/src/assets/chicago_skyline.png';
import teamEvents from '/src/assets/team_events.JPG';
import awards from '/src/assets/awards.png';
import team from '/src/assets/team.png';

const stats = [
  { number: '25+', label: 'Years of Experience', desc: 'Established at the University of Illinois' },
  { number: '300+', label: 'Alumni Network', desc: 'Successful careers across industries' },
  { number: '15+', label: 'Industries', desc: 'Diverse sector expertise' },
  { number: '100%', label: 'Student-Led', desc: 'Fresh perspectives, proven results' },
];

const galleryItems = [
  { image: teamEventsImg, title: "Team Events", desc: "Building friendships beyond work" },
  { image: "", title: "Client Presentations", desc: "Showcasing our project deliverables" },
  { image: awardsImg, title: "Awards & Recognition", desc: "Celebrating our achievements" },
  { image: "", title: "Networking Events", desc: "Building industry connections" },
  { image: "", title: "Training Sessions", desc: "Skill development workshops" },
  { image: "", title: "Social Gatherings", desc: "Building friendships beyond work" }
];

const About = () => {
  // Real Instagram posts from @otcr_consulting
  // To update: Replace these URLs with actual Instagram post image URLs and links
  const instagramPosts = [
    {
      image: teamEvents,
      link: 'https://www.instagram.com/otcr_consulting/?hl=en',
      caption: 'Team collaboration and consulting excellence',
      postId: 'otcr-post-1'
    },
    {
      image: awards,
      link: 'https://www.instagram.com/otcr_consulting/?hl=en',
      caption: 'Professional development and networking',
      postId: 'otcr-post-2'
    },
    {
      image: team,
      link: 'https://www.instagram.com/otcr_consulting/?hl=en',
      caption: 'Strategic planning and client success',
      postId: 'otcr-post-3'
    }
  ];

  const companyLogos = [
    // Reds/Pinks
    'https://upload.wikimedia.org/wikipedia/commons/7/7e/DoorDash_logo.svg',
    'https://upload.wikimedia.org/wikipedia/commons/2/2a/Meta-Logo.png',
    'https://upload.wikimedia.org/wikipedia/commons/2/24/Adobe_Corporate_Logo.png',
    'https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg',
    // Oranges/Yellows
    'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg',
    'https://upload.wikimedia.org/wikipedia/commons/1/1b/PayPal.svg',
    // Yellows/Golds
    'https://upload.wikimedia.org/wikipedia/commons/0/09/YouTube_full-color_icon_%282017%29.svg',
    // Greens
    'https://upload.wikimedia.org/wikipedia/commons/4/44/Googleplex-Logo.svg',
    'https://upload.wikimedia.org/wikipedia/commons/2/2f/Logo_Tesla_Motors.svg',
    // Blues
    'https://upload.wikimedia.org/wikipedia/commons/4/4a/Logo_2013_Google.png',
    'https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg',
    'https://upload.wikimedia.org/wikipedia/commons/6/6e/Microsoft_Office_Logo_%282013-2019%29.svg',
    'https://upload.wikimedia.org/wikipedia/commons/2/2e/IBM_logo.svg',
    'https://upload.wikimedia.org/wikipedia/commons/2/2d/Expedia_Logo.svg',
    // Blacks/Greys
    'https://upload.wikimedia.org/wikipedia/commons/1/19/LinkedIn_logo.svg',
    'https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg',
    'https://upload.wikimedia.org/wikipedia/commons/0/0e/Apple_logo_black.svg',
    'https://upload.wikimedia.org/wikipedia/commons/4/4f/Twitter-logo.svg',
    'https://upload.wikimedia.org/wikipedia/commons/2/2c/JP_Morgan_Logo_2008.svg',
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* About Hero Section */}
      <section className="min-h-screen flex flex-col justify-center items-center text-center relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-navy-deep via-navy-medium to-navy-light"></div>
          <img
            src={chicagoSkyline}
            alt="University of Illinois campus"
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-navy-deep/90 via-navy-medium/70 to-navy-deep/90"></div>

          {/* Floating elements */}
          <div className="absolute inset-0">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className={`absolute w-1 h-1 bg-teal-primary/20 rounded-full animate-float`}
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

        <div className="w-full flex flex-col items-center relative z-10 px-6">
          <FadeContent delay={0.3}>
            <div className="inline-flex items-center gap-2 bg-teal-primary/10 border border-teal-primary/20 rounded-full px-6 py-3 mb-8 backdrop-blur-sm">
              <div className="w-2 h-2 bg-teal-primary rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-teal-primary">Est. 2000 • University of Illinois</span>
            </div>
          </FadeContent>

          <div className="relative">
            <SplitText
              text="About OTCR"
              className="text-5xl lg:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-teal-primary to-blue-accent text-center mb-6 drop-shadow-2xl"
              splitType="words"
            />
            <div className="absolute inset-0 text-5xl lg:text-7xl font-extrabold text-teal-primary/10">
              About OTCR
            </div>
          </div>

          <FadeContent delay={0.8}>
            <p className="text-xl lg:text-2xl text-white/90 text-center max-w-4xl mx-auto mb-6 leading-relaxed font-light">
              For over two decades, we've been the premier student-run consulting firm at the University of Illinois
            </p>
            <p className="text-lg text-teal-primary/90 text-center max-w-3xl mx-auto leading-relaxed">
              Developing the next generation of business leaders through real-world consulting excellence
            </p>
          </FadeContent>

          {/* Stats preview */}
          <FadeContent delay={1.0}>
            <div className="grid grid-cols-3 gap-8 mt-16 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-teal-primary mb-2">25+</div>
                <div className="text-sm text-white/80">Years</div>
              </div>
              <div className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-blue-accent mb-2">300+</div>
                <div className="text-sm text-white/80">Alumni</div>
              </div>
              <div className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-cyan-accent mb-2">15+</div>
                <div className="text-sm text-white/80">Industries</div>
              </div>
            </div>
          </FadeContent>
        </div>

        {/* Enhanced scroll arrow */}
        <FadeContent delay={1.2}>
          <div className="absolute left-1/2 bottom-8 -translate-x-1/2 flex flex-col items-center group cursor-pointer">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-primary/20 to-blue-accent/20 border border-teal-primary/30 flex items-center justify-center group-hover:border-teal-primary transition-all duration-300 backdrop-blur-sm group-hover:bg-teal-primary/30 group-hover:scale-110 animate-bounce-slow">
                <ArrowDown className="w-5 h-5 text-teal-primary group-hover:text-white transition-colors duration-300" />
              </div>
              <div className="absolute inset-0 rounded-full bg-teal-primary/20 animate-ping opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            <span className="text-sm text-white/75 mt-3 group-hover:text-teal-primary transition-colors duration-300 font-medium">Our Story</span>
          </div>
        </FadeContent>
      </section>

      {/* Stats Section */}
      <section className="py-24 bg-navy-deep">
        <div className="section-container">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-white-accent mb-4">By the Numbers</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">Our track record speaks for itself</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {stats.map((stat, idx) => (
              <FadeContent key={idx} delay={idx * 0.2}>
                <div className="professional-card p-8 text-center group">
                  <AnimatedContent className="scale-in">
                    <div className="text-4xl lg:text-5xl font-bold text-teal-primary mb-4 group-hover:text-teal-light transition-colors duration-300">
                      {stat.number}
                    </div>
                  </AnimatedContent>
                  <h3 className="text-xl font-semibold text-white-accent mb-3">{stat.label}</h3>
                  <p className="text-muted-foreground leading-relaxed">{stat.desc}</p>
                </div>
              </FadeContent>
            ))}
          </div>
        </div>
      </section>

      {/* Past Clients Section */}
      <PastClients />
      
      {/* Our Story */}
      <section className="py-24 bg-background">
        <div className="section-container">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-white">Our Story</h2>
          </div>

          {/* Single layout - Text left, Image right */}
          <div className="flex flex-col lg:flex-row items-center gap-16 max-w-7xl mx-auto">
            <FadeContent delay={0.3} className="lg:w-1/2">
              <div className="text-left space-y-6">
                <p className="text-lg text-white/80 leading-relaxed">
                  Founded in 2000 at the University of Illinois, OTCR Consulting began with a simple yet powerful vision: to provide exceptional learning opportunities for students while delivering real value to businesses.
                </p>
                <p className="text-lg text-white/80 leading-relaxed">
                  What started as a small student organization has evolved into a premier consulting firm that has served over 300 clients. Our unique position allows us to combine academic rigor with fresh perspectives that drive innovation.
                </p>
                <p className="text-lg text-white/80 leading-relaxed">
                  Today, we continue to uphold our founding principles while adapting to the evolving business landscape, always maintaining our commitment to student development and professional excellence.
                </p>
                <p className="text-lg text-white/80 leading-relaxed">
                  Based out of the University of Illinois Urbana-Champaign, we bring together top talent from across disciplines to deliver bold, data-driven solutions to clients. Whether we're helping a startup scale or a Fortune 500 rethink its strategy, we build with purpose and deliver with polish.
                </p>
              </div>
            </FadeContent>
            <FadeContent delay={0.5} className="lg:w-1/2">
              <div className="relative group">
                <div className="absolute -inset-4 bg-gradient-to-r from-teal-primary/20 to-blue-accent/20 rounded-3xl blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
                <div className="relative">
                  <img
                    src="https://cdn.builder.io/api/v1/image/assets%2F98c6b4d260e54d44896320277f23f7f2%2F30534a0aa7fc47d98893090ff73fb707?format=webp&width=800"
                    alt="OTCR team at University of Illinois"
                    className="w-full h-auto rounded-2xl shadow-2xl transform transition duration-300 group-hover:scale-[1.02]"
                  />
                  <div className="absolute inset-0 rounded-2xl ring-1 ring-white/10"></div>
                </div>
              </div>
            </FadeContent>
          </div>
        </div>
      </section>

      {/* What We Do Section */}
      <section className="py-20 bg-navy-deep relative overflow-hidden">


        <div className="section-container relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-white-accent mb-16">What We Do</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <FadeContent delay={0.2}>
              <div className="professional-card p-8 text-center group">
                <div className="w-16 h-16 bg-teal-primary rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-all duration-300">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4zm2.5 2.25l1.5-1.5V6.75l-1.5-1.5H5.5L4 6.75v11.5l1.5 1.5h14z"/>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-teal-primary mb-4 group-hover:text-white transition-colors duration-300">Strategy Consulting</h3>
                <p className="text-white/80">Comprehensive strategic planning and analysis to drive business growth and competitive advantage.</p>
              </div>
            </FadeContent>
            <FadeContent delay={0.4}>
              <div className="professional-card p-8 text-center group">
                <div className="w-16 h-16 bg-blue-accent rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-all duration-300">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-blue-accent mb-4 group-hover:text-white transition-colors duration-300">Market Research</h3>
                <p className="text-white/80">In-depth market analysis and consumer insights to inform strategic decision-making.</p>
              </div>
            </FadeContent>
            <FadeContent delay={0.6}>
              <div className="professional-card p-8 text-center group">
                <div className="w-16 h-16 bg-cyan-accent rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-all duration-300">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-cyan-accent mb-4 group-hover:text-white transition-colors duration-300">Operations Optimization</h3>
                <p className="text-white/80">Process improvement and operational efficiency enhancements to maximize performance.</p>
              </div>
            </FadeContent>
          </div>
        </div>
      </section>

      
    
    {/*}
      <section className="py-24 bg-card">
        <div className="section-container">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Our Journey in Photos
            </h2>
            <p className="text-xl text-white/90 max-w-3xl mx-auto">Capturing moments that define our community and success</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {galleryItems.map((item, idx) => (
              <FadeContent key={idx} delay={idx * 0.1}>
                <div className="aspect-square rounded-2xl group relative overflow-hidden bg-card border border-border/20 hover:border-accent/30 transition-all duration-300">
                  {item.image ? (
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-center p-4 bg-navy-light">
                      <svg className="w-12 h-12 mb-4 text-teal-primary opacity-50" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                      </svg>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-6">
                    <p className="text-lg font-semibold text-white">{item.title}</p>
                    <p className="text-sm text-white/80">{item.desc}</p>
                  </div>
                </div>
              </FadeContent>
            ))}
          </div>
        </div>
      </section>
    */}

      {/* Follow OTCR */}
      <section className="py-20 bg-navy-deep">
        <div className="section-container">
          <h2 className="text-4xl lg:text-5xl font-bold text-center text-foreground mb-16">
            Follow OTCR on Instagram
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-12">
            {instagramPosts.map((post, idx) => (
              <FadeContent key={idx} delay={idx * 0.2}>
                <a
                  href={post.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block aspect-square bg-gradient-to-br from-accent/20 to-accent/5 rounded-2xl border border-accent/20 hover:border-accent/40 transition-all duration-300 hover:transform hover:scale-105 group cursor-pointer overflow-hidden"
                >
                  <img
                    src={post.image}
                    alt={post.caption}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                    <p className="text-white text-sm font-medium">{post.caption}</p>
                  </div>
                </a>
              </FadeContent>
            ))}
          </div>
          <FadeContent delay={0.8}>
            <div className="text-center">
              <a
                href="https://www.instagram.com/otcr_consulting/?hl=en"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="accent" size="lg" className="text-lg px-8 hover:transform hover:scale-105 transition-all duration-300">
                  @otcr_consulting
                </Button>
              </a>
            </div>
          </FadeContent>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;
