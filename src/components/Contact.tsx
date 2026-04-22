import { Mail } from "lucide-react";
import QuoteForm from "./QuoteForm";

const Contact = () => {
  return (
    <section id="contact" className="py-14 bg-background">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 uppercase">
            Get In Touch
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Ready to transform your space? Contact us for a free consultation and quote
          </p>
        </div>

        {/* Contact Content */}
        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Contact Info */}
          <div className="space-y-8">
            <div>
              <h3 className="text-2xl font-bold text-foreground mb-6">Contact Information</h3>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <Mail className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Email</h4>
                    <a
                      href="mailto:sales@customshowers.uk"
                      className="text-muted-foreground hover:text-primary transition-colors duration-300"
                    >
                      sales@customshowers.uk
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-primary p-8">
            <h3 className="text-2xl font-bold text-primary-foreground mb-6">Request A Quote</h3>
            <QuoteForm />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
