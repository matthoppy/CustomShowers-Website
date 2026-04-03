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

  // Transparent only on home page before scrolling
  const isTransparent = isHomePage && !isScrolled;

  // Anchor links scroll on home page; navigate to home + anchor from other pages
  const anchor = (hash: string) => (isHomePage ? hash : `/${hash}`);

  const menuItems = [
    { label: "Home", href: "/" },
    { label: "Supply Only", href: "/supply-only" },
    { label: "Balustrades", href: "/balustrades" },
    { label: "Gallery", href: anchor("#gallery") },
    { label: "Contact", href: anchor("#contact") },
    { label: "Blog", href: "/blog" },
  ];

  const renderLink = (item: { label: string; href: string }, extraClass = "", onClick?: () => void) => (
    <Link
      key={item.label}
      to={item.href}
      className={extraClass}
      onClick={onClick}
    >
      {item.label}
    </Link>
  );

  return (
    <>
      {/* Full-width header — desktop only, shown when NOT scrolled */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out ${
          isScrolled ? "opacity-0 pointer-events-none -translate-y-2" : "opacity-100"
        }`}
      >
        <div className={`transition-colors duration-500 ${isTransparent ? "bg-transparent" : "bg-background/95 backdrop-blur-sm shadow-sm"}`}>
          <div className="container mx-auto px-6">
            <div className="flex items-center justify-between h-24">
              {/* Logo */}
              <Link to="/" className="flex items-center">
                <img src={logo} alt="Custom Showers" className="h-20 w-auto" />
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden lg:flex items-center gap-8">
                {menuItems.map((item) =>
                  renderLink(
                    item,
                    `transition-colors duration-300 font-medium ${isTransparent ? "text-white/90 hover:text-white" : "text-foreground hover:text-primary"}`
                  )
                )}
              </nav>

              {/* Get Quote Button */}
              <div className="hidden md:flex items-center gap-4">
                <Button variant="default" onClick={onOpenQuote}>
                  Get A Quote
                </Button>
              </div>

              {/* Mobile Menu Button */}
              <button
                className="lg:hidden p-2"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? (
                  <X className={`w-6 h-6 ${isTransparent ? "text-white" : "text-foreground"}`} />
                ) : (
                  <Menu className={`w-6 h-6 ${isTransparent ? "text-white" : "text-foreground"}`} />
                )}
              </button>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
              <nav className="lg:hidden py-6 border-t border-border">
                {menuItems.map((item) =>
                  renderLink(
                    item,
                    "block py-3 text-foreground hover:text-primary transition-colors duration-300 font-medium",
                    () => setIsMobileMenuOpen(false)
                  )
                )}
                <a
                  href="tel:+447883318933"
                  className="flex items-center gap-2 py-3 text-primary hover:text-primary-hover transition-colors duration-300 font-semibold"
                >
                  <Phone className="w-5 h-5" />
                  +44 7883 318933
                </a>
              </nav>
            )}
          </div>
        </div>
      </header>

      {/* Scrolled state — desktop only: logo left, pill centre, button right */}

      {/* Logo — top left */}
      <div
        className={`fixed top-5 left-6 z-50 hidden lg:flex items-center transition-all duration-500 ease-in-out ${
          isScrolled ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-4 pointer-events-none"
        }`}
      >
        <Link to="/" className="bg-white p-2 flex items-center justify-center shadow-[0_8px_32px_rgba(0,0,0,0.12)] rounded-xl">
          <img src={logo} alt="Custom Showers" className="h-10 w-auto" />
        </Link>
      </div>

      {/* Nav pill — centred */}
      <div
        className={`fixed top-5 left-1/2 z-50 -translate-x-1/2 hidden lg:flex items-center transition-all duration-500 ease-in-out ${
          isScrolled ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-4 pointer-events-none"
        }`}
      >
        <div className="flex items-center gap-6 px-6 py-3 rounded-full bg-background/80 backdrop-blur-xl border border-border/60 shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
          <nav className="flex items-center gap-6">
            {menuItems.map((item) =>
              renderLink(
                item,
                "text-sm text-foreground hover:text-primary transition-colors duration-200 font-medium"
              )
            )}
          </nav>
        </div>
      </div>

      {/* Quote button — top right */}
      <div
        className={`fixed top-5 right-6 z-50 hidden lg:flex items-center transition-all duration-500 ease-in-out ${
          isScrolled ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-4 pointer-events-none"
        }`}
      >
        <Button variant="default" onClick={onOpenQuote} className="rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
          Get A Quote
        </Button>
      </div>

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
                href="tel:+447883318933"
                className="flex items-center gap-2 py-3 text-primary transition-colors duration-300 font-semibold"
              >
                <Phone className="w-5 h-5" />
                +44 7883 318933
              </a>
              <Button variant="default" className="mt-2 w-full" onClick={() => { onOpenQuote?.(); setIsMobileMenuOpen(false); }}>
                Get A Quote
              </Button>
            </nav>
          )}
        </div>
      </header>
    </>
  );
};

export default Navigation;
