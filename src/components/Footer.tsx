import { useState } from "react";
import PrivacyPolicyModal from "./PrivacyPolicyModal";
import TermsOfServiceModal from "./TermsOfServiceModal";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  return (
    <>
      <footer className="bg-footer-bg text-footer-text">
        {/* Bottom Bar */}
        <div className="border-t border-footer-text/20">
          <div className="container mx-auto px-6 py-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-footer-text/60">
              <p>&copy; {currentYear} Custom Showers. All rights reserved.</p>
              <div className="flex gap-6">
                <button
                  onClick={() => setShowPrivacy(true)}
                  className="hover:text-primary transition-colors duration-300"
                >
                  Privacy Policy
                </button>
                <button
                  onClick={() => setShowTerms(true)}
                  className="hover:text-primary transition-colors duration-300"
                >
                  Terms of Service
                </button>
              </div>
            </div>
          </div>
        </div>
      </footer>

      <PrivacyPolicyModal isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} />
      <TermsOfServiceModal isOpen={showTerms} onClose={() => setShowTerms(false)} />
    </>
  );
};

export default Footer;
