import { Phone, Mail } from "lucide-react";

const FixedContactButtons = () => {
  return (
    <div className="fixed right-0 top-1/2 -translate-y-1/2 z-40 flex flex-col">
      <a
        href="tel:0982888858"
        className="bg-primary hover:bg-primary-hover text-primary-foreground w-14 h-14 flex items-center justify-center transition-all duration-300 hover:w-16"
        aria-label="Call us"
      >
        <Phone className="w-6 h-6" />
      </a>
      <a
        href="mailto:admin@balustrading.co.nz"
        className="bg-primary hover:bg-primary-hover text-primary-foreground w-14 h-14 flex items-center justify-center transition-all duration-300 hover:w-16"
        aria-label="Email us"
      >
        <Mail className="w-6 h-6" />
      </a>
    </div>
  );
};

export default FixedContactButtons;
