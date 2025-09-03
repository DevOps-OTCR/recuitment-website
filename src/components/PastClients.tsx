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
            className="flex-shrink-0 w-40 h-20 flex items-center justify-center group"
          >
            <img
              src={client.logo}
              alt={`${client.name} logo`}
              className="max-w-32 max-h-14 object-contain opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

const PastClients = () => {
  // Enhanced alumni companies list with working colored logos including consulting firms
  const clients = [
    // Tech Giants - Using brand-official colors
    { name: 'Microsoft', logo: 'https://upload.wikimedia.org/wikipedia/commons/9/96/Microsoft_logo_%282012%29.svg' },
    { name: 'Google', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg' },
    { name: 'Apple', logo: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg' },
    { name: 'Amazon', logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg' },
    { name: 'Meta', logo: 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Meta_Platforms_Inc._logo.svg' },
    { name: 'Netflix', logo: 'https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg' },
    { name: 'Tesla', logo: 'https://upload.wikimedia.org/wikipedia/commons/b/bb/Tesla_T_symbol.svg' },
    { name: 'Spotify', logo: 'https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg' },
    { name: 'Uber', logo: 'https://upload.wikimedia.org/wikipedia/commons/c/cc/Uber_logo_2018.png' },
    { name: 'LinkedIn', logo: 'https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png' },
    { name: 'Airbnb', logo: 'https://upload.wikimedia.org/wikipedia/commons/6/69/Airbnb_Logo_Bélo.svg' },
    { name: 'Adobe', logo: 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Adobe_Systems_logo_and_wordmark.svg' },
    // Consulting Firms
    { name: 'McKinsey & Company', logo: 'https://logos-world.net/wp-content/uploads/2022/09/McKinsey-Logo.png' },
    { name: 'BCG', logo: 'https://logos-world.net/wp-content/uploads/2022/06/BGG-Logo.png' },
    // { name: 'Bain & Company', logo: 'https://logos-world.net/wp-content/uploads/2021/02/Bain-Company-Logo.png' },
    { name: 'Deloitte', logo: 'https://logos-world.net/wp-content/uploads/2021/08/Deloitte-Logo.png' },
    { name: 'PwC', logo: 'https://upload.wikimedia.org/wikipedia/commons/0/05/PricewaterhouseCoopers_Logo.svg' },
    { name: 'EY', logo: 'https://logos-world.net/wp-content/uploads/2022/07/Ernst-Young-Logo.png' },
    { name: 'KPMG', logo: 'https://logos-world.net/wp-content/uploads/2022/08/KPMG-Logo.png' },
    // Financial Services
    { name: 'Goldman Sachs', logo: 'https://logos-world.net/wp-content/uploads/2020/10/Goldman-Sachs-Logo.png' },
    { name: 'JPMorgan Chase', logo: 'https://logos-world.net/wp-content/uploads/2021/04/JPMorgan-Chase-Logo.png' },
    { name: 'Morgan Stanley', logo: 'https://logos-world.net/wp-content/uploads/2021/04/Morgan-Stanley-Logo.png' },
    // Additional Companies
    { name: 'Salesforce', logo: 'https://upload.wikimedia.org/wikipedia/commons/f/f9/Salesforce.com_logo.svg' },
    { name: 'Oracle', logo: 'https://upload.wikimedia.org/wikipedia/commons/5/50/Oracle_logo.svg' },
    { name: 'IBM', logo: 'https://upload.wikimedia.org/wikipedia/commons/5/51/IBM_logo.svg' },
  ];

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

      <section className="py-24 bg-gradient-to-br from-card to-muted/50 relative overflow-hidden">

        
        <div className="section-container space-y-12 relative z-10">
          <h2 className="text-4xl font-extrabold text-center text-foreground">
            Our Alumni Work At
          </h2>
          <FadeContent delay={0.3}>
            <p className="text-xl text-muted-foreground text-center max-w-2xl mx-auto">
              OTCR graduates have gone on to work at some of the world's most prestigious companies
            </p>
          </FadeContent>

          {/* Infinite scrolling logo rows */}
          <FadeContent delay={0.5}>
            <div className="space-y-8 mask-gradient">
              <LogoRow logos={row1} direction="left" speed={40} delay={0} />
              <LogoRow logos={row2} direction="right" speed={35} delay={0} />
              <LogoRow logos={row3} direction="left" speed={45} delay={0} />
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

export default PastClients;
