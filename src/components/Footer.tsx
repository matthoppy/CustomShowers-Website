const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-footer-bg text-footer-text">
      {/* Bottom Bar */}
      <div className="border-t border-footer-text/20">
        <div className="container mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-footer-text/60">
            <p>&copy; {currentYear} Bespoke Frameless Showers. All rights reserved.</p>
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
