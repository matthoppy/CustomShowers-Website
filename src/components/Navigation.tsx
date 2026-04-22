import { useState, useEffect } from "react";
import { Phone, Menu, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "./ui/button";
import logo from "@/assets/Custom Showers Main1.png";

interface NavigationProps {
  onOpenQuote?: () => void;
}

const Navigation = ({ onOpenQuote }: NavigationProps) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 80);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const menuItems = [
    { label: "Home", href: "/" },
    { label: "Supply Only", href: "/supply-only" },
    { label: "Balustrades", href: "/balustrades" },
    { label: "Gallery", href: isHomePage ? "#gallery" : "/#gallery" },
    { label: "Contact", href: isHomePage ? "#contact" : "/#contact" },
  ];

  const renderLink = (item: { label: string; href: string }, extraClass = "", onClick?: () => void) => {
    const handleClick = (e: React.MouseEvent) => {
      if (item.href.startsWith("#")) {
        e.preventDefault();
        const element = document.querySelector(item.href);
        if (element) element.scrollIntoView({ behavior: "smooth" });
      }
      onClick?.();
    };
    return (
      <Link key={item.label} to={item.href} className={extraClass} onClick={handleClick}>
        {item.label}
      </Link>
    );
  };

  return (
    <>
      {/* Full-width header — desktop only, shown when NOT scrolled */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out ${
          isScrolled ? "opacity-0 pointer-events-none -translate-y-2" : "opacity-100"
        }`}
      >
        <div className="bg-transparent">
          <div className="container mx-auto px-6">
            <div className="flex items-center justify-between h-24">
              {/* Logo */}
              <Link to="/" className="flex items-center">
                <img src={logo} alt="Custom Showers" className="h-20 w-auto" />
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden lg:flex items-center gap-8">
                {menuItems.map((item) =>
                  renderLink(item, "text-white hover:text-white/70 transition-colors duration-300 font-medium drop-shadow")
                )}
              </nav>

              {/* Get Quote Button */}
              <div className="hidden md:flex items-center gap-4">
                <Button variant="outline" onClick={onOpenQuote} className="border-white text-white hover:bg-white hover:text-primary bg-transparent">
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
                  <X className="w-6 h-6 text-white" />
                ) : (
                  <Menu className="w-6 h-6 text-white" />
                )}
              </button>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
              <nav className="lg:hidden py-6 border-t border-white/20 bg-black/60 backdrop-blur-sm">
                {menuItems.map((item) =>
                  renderLink(
                    item,
                    "block py-3 text-white hover:text-white/70 transition-colors duration-300 font-medium",
                    () => setIsMobileMenuOpen(false)
                  )
                )}
                <a
                  href="tel:+447123456789"
                  className="flex items-center gap-2 py-3 text-white/80 transition-colors duration-300 font-semibold"
                >
                  <Phone className="w-5 h-5" />
                  +44 7123 456789
                </a>
              </nav>
            )}
          </div>
        </div>
      </header>

      {/* Scrolled state — full-width white bar, desktop only */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 hidden lg:block bg-white shadow-sm transition-all duration-500 ease-in-out ${
          isScrolled ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-2 pointer-events-none"
        }`}
      >
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center">
              <img src={logo} alt="Custom Showers" className="h-10 w-auto" />
            </Link>
            <nav className="flex items-center gap-8">
              {menuItems.map((item) =>
                renderLink(item, "text-sm text-foreground hover:text-primary transition-colors duration-200 font-medium")
              )}
            </nav>
            <Button variant="default" onClick={onOpenQuote}>
              Get A Free Quote
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile sticky header (always shown on mobile) */}
      <header className="fixed top-0 left-0 right-0 z-50 lg:hidden bg-background/95 backdrop-blur-sm shadow-sm">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center">
              <img src={logo} alt="Custom Showers" className="h-12 w-auto" />
            </Link>

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
                renderLink(
                  item,
                  "block py-3 text-foreground hover:text-primary transition-colors duration-300 font-medium",
                  () => setIsMobileMenuOpen(false)
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
