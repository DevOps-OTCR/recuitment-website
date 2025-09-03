import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Menu, X, Linkedin, Instagram } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Item = {
  label: string;
  to: string;
  external?: boolean;
  cta?: boolean;
};

const navItems: Item[] = [
  { label: 'Home', to: '/' },
  { label: 'About OTCR', to: '/about' },
  { label: 'Leadership', to: '/leadership' },
  { label: 'Recruitment Process', to: '/join' },
  { label: 'Resources', to: '/recruitment-resources' },
  { label: 'Apply Now', to: '/apply', cta: true },
  {
    label: 'Clients',
    to: 'https://otcr-consulting.com',
    external: true,
  },
];

const linkBase =
  'relative font-medium transition-all duration-300 py-2 px-3 rounded-lg';
const linkInactive =
  'text-foreground hover:text-accent hover:bg-accent/5';
const linkActive =
  'text-white bg-white/10'; // tweak to your theme

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const renderDesktopItem = (item: Item, idx: number) => {
    if (item.external) {
      return (
        <a
          key={idx}
          href={item.to}
          target="_blank"
          rel="noopener noreferrer"
          className={`${linkBase} ${linkInactive}`}
        >
          <span className="relative z-10">{item.label}</span>
        </a>
      );
    }
    return (
      <NavLink
        key={idx}
        to={item.to}
        end={item.to === '/'} // exact match for Home
        className={({ isActive }) =>
          [
            linkBase,
            isActive ? linkActive : linkInactive,
            item.cta ? 'ring-1 ring-white/20' : '',
          ]
            .filter(Boolean)
            .join(' ')
        }
        onClick={() => window.scrollTo(0, 0)}
      >
        <span className="relative z-10">{item.label}</span>
      </NavLink>
    );
  };

  const renderMobileItem = (item: Item, idx: number) => {
    if (item.external) {
      return (
        <a
          key={idx}
          href={item.to}
          target="_blank"
          rel="noopener noreferrer"
          className="text-foreground hover:text-accent transition-all duration-300 font-medium py-3 px-2 rounded-lg hover:bg-accent/5 transform hover:scale-105"
          onClick={() => setIsMenuOpen(false)}
          style={{ animationDelay: `${idx * 0.05}s` }}
        >
          {item.label}
        </a>
      );
    }
    return (
      <NavLink
        key={idx}
        to={item.to}
        end={item.to === '/'}
        className={({ isActive }) =>
          [
            'transition-all duration-300 font-medium py-3 px-2 rounded-lg transform hover:scale-105',
            isActive
              ? 'text-white bg-white/10'
              : 'text-foreground hover:text-accent hover:bg-accent/5',
          ].join(' ')
        }
        onClick={() => {
          setIsMenuOpen(false);
          window.scrollTo(0, 0);
        }}
        style={{ animationDelay: `${idx * 0.05}s` }}
      >
        {item.label}
      </NavLink>
    );
  };

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-background/95 backdrop-blur-xl border-b border-border/50 px-6 py-4 transition-all duration-300 shadow-lg shadow-navy-deep/20">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Logo */}
        <div className="flex items-center">
          <Link to="/" className="flex items-center group transition-all duration-300">
            <div className="relative">
              <img
                src="https://cdn.builder.io/api/v1/image/assets%2F98c6b4d260e54d44896320277f23f7f2%2Fa46e089f3caf43dab4a95e9cb35165cb?format=webp&width=800"
                alt="OTCR Consulting Logo"
                className="h-10 w-auto transition-all duration-300 group-hover:scale-110 group-hover:drop-shadow-lg"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-teal-primary/20 to-blue-accent/20 rounded-lg scale-0 group-hover:scale-110 transition-transform duration-300 blur-md"></div>
            </div>
          </Link>
        </div>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-x-8">
          {navItems.map(renderDesktopItem)}
        </div>

        {/* Socials */}
        <div className="hidden md:flex items-center space-x-2">
          <a
            href="https://www.linkedin.com/company/otcr-consulting/about/"
            target="_blank"
            rel="noopener noreferrer"
            className="relative rounded-full p-3 transition-all duration-300 group overflow-hidden"
          >
            <Linkedin className="w-5 h-5 text-foreground group-hover:text-white transition-all duration-300 group-hover:scale-110 transform relative z-10" />
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-accent to-teal-primary scale-0 group-hover:scale-100 transition-transform duration-300"></div>
            <div className="absolute inset-0 rounded-full bg-accent/10 group-hover:bg-transparent transition-colors duration-300"></div>
          </a>
          <a
            href="https://www.instagram.com/otcr_consulting/?hl=en"
            target="_blank"
            rel="noopener noreferrer"
            className="relative rounded-full p-3 transition-all duration-300 group overflow-hidden"
          >
            <Instagram className="w-5 h-5 text-foreground group-hover:text-white transition-all duration-300 group-hover:scale-110 transform relative z-10" />
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 scale-0 group-hover:scale-100 transition-transform duration-300"></div>
            <div className="absolute inset-0 rounded-full bg-accent/10 group-hover:bg-transparent transition-colors duration-300"></div>
          </a>
        </div>

        {/* Mobile toggle */}
        <div className="md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMenuOpen((v) => !v)}
            className="relative group"
          >
            <div className="relative z-10">
              {isMenuOpen ? (
                <X className="transition-transform duration-300 rotate-90" />
              ) : (
                <Menu className="transition-transform duration-300 hover:rotate-12" />
              )}
            </div>
            <div className="absolute inset-0 rounded-md bg-accent/20 scale-0 group-hover:scale-100 transition-transform duration-300"></div>
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`md:hidden absolute left-0 top-full w-full bg-background/95 backdrop-blur-md border-b border-border shadow-lg transition-all duration-300 ${
          isMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
        }`}
      >
        <div className="flex flex-col space-y-2 p-4">
          {navItems.map(renderMobileItem)}
          <div className="flex items-center space-x-2 mt-4 px-2">
            <a
              href="https://www.linkedin.com/company/otcr-consulting/about/"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full p-2 hover:bg-accent/10 transition-all duration-300 group"
            >
              <Linkedin className="w-5 h-5 text-foreground group-hover:text-accent transition-colors duration-300" />
            </a>
            <a
              href="https://www.instagram.com/otcr_consulting/?hl=en"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full p-2 hover:bg-accent/10 transition-all duration-300 group"
            >
              <Instagram className="w-5 h-5 text-foreground group-hover:text-accent transition-colors duration-300" />
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}
