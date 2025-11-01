const Footer = () => {
  const currentYear = new Date().getFullYear();

  const services = [
    "Residential Balustrading",
    "Commercial Projects",
    "Custom Design",
    "Installation",
    "Maintenance",
    "Consultation",
  ];

  return (
    <footer className="bg-footer-bg text-footer-text">
      {/* Main Footer Content */}
      <div className="container mx-auto px-6 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold">BC</span>
              </div>
              <span className="text-lg font-bold">Balustrading Concepts</span>
            </div>
            <p className="text-footer-text/80 leading-relaxed">
              Premium glass balustrading solutions for residential and commercial projects across Australia.
            </p>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-lg font-bold mb-4 text-footer-text">Our Services</h4>
            <ul className="space-y-2">
              {services.map((service) => (
                <li key={service}>
                  <a
                    href="#services"
                    className="text-footer-text/80 hover:text-primary transition-colors duration-300 hover:underline"
                  >
                    {service}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-bold mb-4 text-footer-text">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <a href="#home" className="text-footer-text/80 hover:text-primary transition-colors duration-300 hover:underline">
                  Home
                </a>
              </li>
              <li>
                <a href="#about" className="text-footer-text/80 hover:text-primary transition-colors duration-300 hover:underline">
                  About Us
                </a>
              </li>
              <li>
                <a href="#gallery" className="text-footer-text/80 hover:text-primary transition-colors duration-300 hover:underline">
                  Gallery
                </a>
              </li>
              <li>
                <a href="#contact" className="text-footer-text/80 hover:text-primary transition-colors duration-300 hover:underline">
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Contact CTA */}
          <div>
            <h4 className="text-lg font-bold mb-4 text-footer-text">Get Started</h4>
            <p className="text-footer-text/80 mb-4">
              Ready to transform your space? Contact us today for a free quote.
            </p>
            <a
              href="tel:0982888858"
              className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground hover:bg-primary-hover transition-colors duration-300 font-semibold"
            >
              Call 09 828 8858
            </a>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-footer-text/20">
        <div className="container mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-footer-text/60">
            <p>&copy; {currentYear} Balustrading Concepts. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-primary transition-colors duration-300">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-primary transition-colors duration-300">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
