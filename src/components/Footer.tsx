import { Mail, Phone, MapPin } from 'lucide-react';
import FadeContent from '@/reactbits/animations/FadeContent/FadeContent';

const Footer = () => {
  const footerLinks = {
    about: [
      { label: 'Our Story', href: '/about' },
      { label: 'Our Team', href: '/about' },
      { label: 'After OTCR', href: '/about' }
    ],
    join: [
      { label: 'Apply Now', href: '/join' },
      { label: 'Application Process', href: '/join' }
    ]
  };

  return (
    <footer className="bg-gradient-to-br from-navy-deep via-navy-medium to-background border-t border-border/50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-96 h-96 bg-teal-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-accent/5 rounded-full blur-3xl"></div>
      </div>

      <div className="section-container relative z-10">
        {/* Main Footer Content */}
        <div className="py-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Company Info */}
            <FadeContent delay={0.1}>
              <div className="group">
                <div className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-teal-primary to-blue-accent">
                  OTCR Consulting
                </div>
                <p className="text-white/80 mb-8 leading-relaxed text-lg">
                  Premier student-run consulting firm at the University of Illinois,
                  developing the next generation of business leaders since 2000.
                </p>

                {/* Contact Info */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-4 group hover:bg-white/5 p-3 rounded-lg transition-all duration-300">
                    <div className="w-10 h-10 bg-gradient-to-br from-teal-primary to-blue-accent rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Mail className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-white/75 group-hover:text-white transition-colors duration-300">recruitment@otcr-consulting.com</span>
                  </div>
                  <div className="flex items-center space-x-4 group hover:bg-white/5 p-3 rounded-lg transition-all duration-300">
                    <div className="w-10 h-10 bg-gradient-to-br from-cyan-accent to-teal-primary rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <MapPin className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-white/75 group-hover:text-white transition-colors duration-300">University of Illinois, Urbana-Champaign</span>
                  </div>
                </div>
              </div>
            </FadeContent>

            {/* About Links */}
            <FadeContent delay={0.2}>
              <div>
                <h3 className="text-xl font-bold mb-8 text-white border-b border-teal-primary/30 pb-3">About</h3>
                <ul className="space-y-4">
                  {footerLinks.about.map((link, index) => (
                    <li key={index}>
                      <a
                        href={link.href}
                        className="group flex items-center space-x-3 text-white/75 hover:text-teal-primary transition-all duration-300 p-2 rounded-lg hover:bg-white/5"
                      >
                        <span className="w-2 h-2 bg-teal-primary/50 rounded-full group-hover:bg-teal-primary transition-colors duration-300"></span>
                        <span className="group-hover:translate-x-1 transition-transform duration-300">{link.label}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </FadeContent>

            {/* Join Links */}
            <FadeContent delay={0.3}>
              <div>
                <h3 className="text-xl font-bold mb-8 text-white border-b border-blue-accent/30 pb-3">Join Us</h3>
                <ul className="space-y-4">
                  {footerLinks.join.map((link, index) => (
                    <li key={index}>
                      <a
                        href={link.href}
                        className="group flex items-center space-x-3 text-white/75 hover:text-blue-accent transition-all duration-300 p-2 rounded-lg hover:bg-white/5"
                      >
                        <span className="w-2 h-2 bg-blue-accent/50 rounded-full group-hover:bg-blue-accent transition-colors duration-300"></span>
                        <span className="group-hover:translate-x-1 transition-transform duration-300">{link.label}</span>
                      </a>
                    </li>
                  ))}
                </ul>

                {/*
                <div className="mt-8 p-4 bg-gradient-to-br from-blue-accent/10 to-teal-primary/10 rounded-lg border border-blue-accent/20">
                  <h4 className="text-sm font-semibold text-white mb-2">Stay Updated</h4>
                  <p className="text-xs text-white/70 mb-3">Get the latest news and opportunities</p>
                  <div className="flex">
                    <input
                      type="email"
                      placeholder="your@email.com"
                      className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-l-lg text-white placeholder-white/50 text-sm focus:outline-none focus:border-blue-accent"
                    />
                    <button className="px-4 py-2 bg-gradient-to-r from-blue-accent to-teal-primary text-white rounded-r-lg hover:from-blue-light hover:to-teal-light transition-all duration-300 text-sm">
                      Subscribe
                    </button>
                  </div>
                </div>
                */}
              </div>
            </FadeContent>
          </div>
        </div>
        
        {/* Copyright */}
        <FadeContent delay={0.4}>
          <div className="border-t border-white/10 py-8">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <p className="text-white/75">
                © 2025 OTCR Consulting. All rights reserved.
              </p>
              <div className="flex items-center space-x-6">
                <a href="/privacy" className="text-white/60 hover:text-teal-primary transition-colors duration-300 text-sm">
                  Privacy Policy
                </a>
                <a href="/terms" className="text-white/60 hover:text-teal-primary transition-colors duration-300 text-sm">
                  Terms of Service
                </a>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-white/60 text-sm">Website Status: Active</span>
                </div>
              </div>
            </div>
          </div>
        </FadeContent>
      </div>
    </footer>
  );
};

export default Footer;
