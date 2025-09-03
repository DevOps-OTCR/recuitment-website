import React from 'react';
import FadeContent from '@/reactbits/animations/FadeContent/FadeContent';

// Enhanced LogoRow component with perfect infinite scroll
const LogoRow = ({ logos, direction = 'left', speed = 30, delay = 0 }) => {
  // Create multiple copies for seamless infinite scroll
  const extendedLogos = [...logos, ...logos, ...logos, ...logos];
  const animationName = direction === 'left' ? 'scroll-left-infinite' : 'scroll-right-infinite';
  const animationDelay = `${delay}s`;

  return (
    <div className="relative overflow-hidden w-full">
      <div
        className="flex whitespace-nowrap gap-12"
        style={{
          animation: `${animationName} ${speed}s linear infinite`,
          animationDelay,
          width: 'fit-content'
        }}
      >
        {extendedLogos.map((client, idx) => (
          <div
            key={`${client.name}-${idx}`}
            className="flex-shrink-0 w-44 h-24 flex items-center justify-center group relative"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/2 rounded-xl backdrop-blur-sm border border-white/10 opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-90 group-hover:scale-100"></div>
            <img
              src={client.logo}
              alt={`${client.name} logo`}
              className="max-w-36 max-h-16 object-contain opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300 group-hover:grayscale-0 relative z-10"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

interface InfiniteScrollLogosProps {
  title: string;
  subtitle: string;
  clients: Array<{ name: string; logo: string }>;
  className?: string;
}

const InfiniteScrollLogos: React.FC<InfiniteScrollLogosProps> = ({
  title,
  subtitle,
  clients,
  className = ""
}) => {
  // Split into three rows for variety
  const row1 = clients.slice(0, Math.ceil(clients.length / 3));
  const row2 = clients.slice(Math.ceil(clients.length / 3), Math.ceil(clients.length * 2 / 3));
  const row3 = clients.slice(Math.ceil(clients.length * 2 / 3));

  return (
    <>
      <style>{`
        @keyframes scroll-left-infinite {
          0% { 
            transform: translateX(0); 
          }
          100% { 
            transform: translateX(-25%); 
          }
        }
        @keyframes scroll-right-infinite {
          0% { 
            transform: translateX(-25%); 
          }
          100% { 
            transform: translateX(0); 
          }
        }
      `}</style>

      <section className={`py-24 bg-gradient-to-br from-background via-navy-medium to-navy-light relative overflow-hidden ${className}`}>
        {/* Background decoration */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-teal-primary/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-accent/5 rounded-full blur-3xl"></div>
        </div>

        <div className="section-container space-y-16 relative z-10">
          <div className="text-center">
            <FadeContent delay={0.1}>
              <div className="inline-flex items-center gap-2 bg-teal-primary/10 border border-teal-primary/20 rounded-full px-6 py-3 mb-6 backdrop-blur-sm">
                <div className="w-2 h-2 bg-teal-primary rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-teal-primary">Trusted Partners</span>
              </div>
            </FadeContent>
            <FadeContent delay={0.2}>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-center mb-6">
                <span className="text-white">{title} </span>
              </h2>
            </FadeContent>
            <FadeContent delay={0.3}>
              <p className="text-xl text-white/85 text-center max-w-3xl mx-auto">
                {subtitle}
              </p>
            </FadeContent>
          </div>

          {/* Infinite scrolling logo rows */}
          <FadeContent delay={0.5}>
            <div className="space-y-8 mask-gradient">
              <LogoRow logos={row1} direction="left" speed={40} delay={0} />
              <LogoRow logos={row2} direction="right" speed={35} delay={0} />
            </div>
          </FadeContent>
        </div>
      </section>
      
      <style>{`
        .mask-gradient {
          mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent);
          -webkit-mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent);
        }
      `}</style>
    </>
  );
};

export default InfiniteScrollLogos;
