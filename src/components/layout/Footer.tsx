import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Youtube, Github, Send } from 'lucide-react';
import Logo from '../../assets/logo.svg?react';
import { Button } from './../ui/Button';
import { Input } from './../ui/input';

const FooterLink = ({ to, children }: { to: string; children: React.ReactNode }) => (
    <li>
        <Link to={to} className="text-muted-foreground hover:text-primary transition-colors duration-300 ease-in-out">
            {children}
        </Link>
    </li>
);

const SocialLink = ({ href, icon: Icon }: { href: string; icon: React.ElementType }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors duration-300">
        <Icon className="h-6 w-6" />
    </a>
);

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const sections = [
      {
          title: "Platform",
          links: [
              { to: "/browse", text: "Browse" },
              { to: "/how-it-works", text: "How It Works" },
              { to: "/safety-tips", text: "Safety" },
          ]
      },
      {
          title: "Company",
          links: [
              { to: "/about", text: "About Us" },
              { to: "/pricing", text: "Pricing" },
          ]
      },
      {
          title: "Legal",
          links: [
              { to: "/terms", text: "Terms of Service" },
              { to: "/privacy", text: "Privacy Policy" },
          ]
      }
  ]

  return (
    <footer className="bg-background/95 backdrop-blur-lg border-t">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* Logo and About */}
            <div className="lg:col-span-4 space-y-6">
                <Link to="/" className="flex items-center gap-2 group">
                    <Logo className="h-10 w-10 text-primary group-hover:animate-pulse" />
                    <span className="text-3xl font-bold text-foreground group-hover:text-primary transition-colors">Rentify</span>
                </Link>
                <p className="text-muted-foreground max-w-sm">
                    The ultimate peer-to-peer rental marketplace. Rent anything, from anyone, anywhere.
                </p>
            </div>

            {/* Links */}
            <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-3 gap-8">
                {sections.map(section => (
                    <div key={section.title}>
                        <h3 className="font-semibold text-lg text-foreground mb-4">{section.title}</h3>
                        <ul className="space-y-3">
                            {section.links.map(link => <FooterLink key={link.to} to={link.to}>{link.text}</FooterLink>)}
                        </ul>
                    </div>
                ))}
            </div>
        </div>

        <div className="border-t mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">&copy; {currentYear} Rentify Inc. All rights reserved.</p>
          <div className="flex space-x-4">
              <SocialLink href="https://github.com/your-repo" icon={Github} />
              <SocialLink href="#" icon={Twitter} />
              <SocialLink href="#" icon={Facebook} />
              <SocialLink href="#" icon={Instagram} />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 