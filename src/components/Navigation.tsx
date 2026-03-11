import { useState, useEffect } from "react";
import { Phone, Menu, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "./ui/button";
import logo from "@/assets/CustomShowersMain.png";

interface NavigationProps {
  onOpenQuote?: () => void;
}

const Navigation = ({ onOpenQuote }: NavigationProps) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 80);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const menuItems = [
    { label: "Home", href: "#home" },
    { label: "About", href: "#about" },
    { label: "Services", href: "#services" },
    { label: "Gallery", href: "#gallery" },
    { label: "Contact", href: "#contact" },
  ];

  return (
    <>
      {/* Full-width header — desktop only, shown when NOT scrolled */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out ${
          isScrolled ? "opacity-0 pointer-events-none -translate-y-2" : "opacity-100"
        }`}
      >
        <div className="bg-background/95 backdrop-blur-sm shadow-sm">
          <div className="container mx-auto px-6">
            <div className="flex items-center justify-between h-40">
              {/* Logo */}
              <a href="#home" className="flex items-center">
                <img src={logo} alt="Custom Showers" className="h-36 w-auto" />
              </a>

              {/* Desktop Navigation */}
              <nav className="hidden lg:flex items-center gap-8">
                {menuItems.map((item) =>
                  item.href.startsWith("/") ? (
                    <Link
                      key={item.label}
                      to={item.href}
                      className="text-foreground hover:text-primary transition-colors duration-300 font-medium"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <a
                      key={item.label}
                      href={item.href}
                      className="text-foreground hover:text-primary transition-colors duration-300 font-medium"
                    >
                      {item.label}
                    </a>
                  )
                )}
              </nav>

              {/* Get Quote Button */}
              <div className="hidden md:flex items-center gap-4">
                <Button variant="default" onClick={onOpenQuote}>
                  Get A Free Quote
                </Button>
              </div>

              {/* Mobile Menu Button */}
              <button
                className="lg:hidden p-2"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6 text-foreground" />
                ) : (
                  <Menu className="w-6 h-6 text-foreground" />
                )}
              </button>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
              <nav className="lg:hidden py-6 border-t border-border">
                {menuItems.map((item) =>
                  item.href.startsWith("/") ? (
                    <Link
                      key={item.label}
                      to={item.href}
                      className="block py-3 text-foreground hover:text-primary transition-colors duration-300 font-medium"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <a
                      key={item.label}
                      href={item.href}
                      className="block py-3 text-foreground hover:text-primary transition-colors duration-300 font-medium"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {item.label}
                    </a>
                  )
                )}
                <a
                  href="tel:+447123456789"
                  className="flex items-center gap-2 py-3 text-primary hover:text-primary-hover transition-colors duration-300 font-semibold"
                >
                  <Phone className="w-5 h-5" />
                  +44 7123 456789
                </a>
              </nav>
            )}
          </div>
        </div>
      </header>

      {/* Dynamic Island pill — desktop only, shown when scrolled */}
      <div
        className={`fixed top-4 left-1/2 z-50 -translate-x-1/2 hidden lg:flex items-center transition-all duration-500 ease-in-out ${
          isScrolled
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 -translate-y-4 pointer-events-none"
        }`}
      >
        <div className="flex items-center gap-6 px-6 py-3 rounded-full bg-background/80 backdrop-blur-xl border border-border/60 shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
          {/* Nav links only */}
          <nav className="flex items-center gap-6">
            {menuItems.map((item) =>
              item.href.startsWith("/") ? (
                <Link
                  key={item.label}
                  to={item.href}
                  className="text-sm text-foreground hover:text-primary transition-colors duration-200 font-medium"
                >
                  {item.label}
                </Link>
              ) : (
                <a
                  key={item.label}
                  href={item.href}
                  className="text-sm text-foreground hover:text-primary transition-colors duration-200 font-medium"
                >
                  {item.label}
                </a>
              )
            )}
          </nav>
        </div>
      </div>

      {/* Mobile sticky header (always shown on mobile) */}
      <header className="fixed top-0 left-0 right-0 z-50 lg:hidden bg-background/95 backdrop-blur-sm shadow-sm">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <a href="#home" className="flex items-center">
              <img src={logo} alt="Custom Showers" className="h-12 w-auto" />
            </a>

            <button
              className="p-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6 text-foreground" />
              ) : (
                <Menu className="w-6 h-6 text-foreground" />
              )}
            </button>
          </div>

          {isMobileMenuOpen && (
            <nav className="py-6 border-t border-border">
              {menuItems.map((item) =>
                item.href.startsWith("/") ? (
                  <Link
                    key={item.label}
                    to={item.href}
                    className="block py-3 text-foreground hover:text-primary transition-colors duration-300 font-medium"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <a
                    key={item.label}
                    href={item.href}
                    className="block py-3 text-foreground hover:text-primary transition-colors duration-300 font-medium"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.label}
                  </a>
                )
              )}
              <a
                href="tel:+447123456789"
                className="flex items-center gap-2 py-3 text-primary transition-colors duration-300 font-semibold"
              >
                <Phone className="w-5 h-5" />
                +44 7123 456789
              </a>
              <Button variant="default" className="mt-2 w-full" onClick={() => { onOpenQuote?.(); setIsMobileMenuOpen(false); }}>
                Get A Free Quote
              </Button>
            </nav>
          )}
        </div>
      </header>
    </>
  );
};

export default Navigation;
