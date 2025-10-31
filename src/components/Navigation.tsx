import { useState, useEffect } from "react";
import { Phone, Menu, X } from "lucide-react";
import { Button } from "./ui/button";

const Navigation = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
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
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-background shadow-md" : "bg-background/95 backdrop-blur-sm"
      }`}
    >
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-24">
          {/* Logo */}
          <a href="#home" className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">BC</span>
            </div>
            <span className="text-xl font-bold text-foreground hidden sm:block">
              Balustrading Concepts
            </span>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {menuItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-foreground hover:text-primary transition-colors duration-300 font-medium"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Phone Number */}
          <div className="hidden md:flex items-center gap-4">
            <a
              href="tel:1300123456"
              className="flex items-center gap-2 text-primary hover:text-primary-hover transition-colors duration-300"
            >
              <Phone className="w-5 h-5" />
              <span className="font-semibold text-lg">1300 123 456</span>
            </a>
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
            {menuItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="block py-3 text-foreground hover:text-primary transition-colors duration-300 font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <a
              href="tel:1300123456"
              className="flex items-center gap-2 py-3 text-primary hover:text-primary-hover transition-colors duration-300 font-semibold"
            >
              <Phone className="w-5 h-5" />
              1300 123 456
            </a>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Navigation;
