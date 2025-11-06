import { Button } from "./ui/button";
import { useState, useRef } from "react";
import ReCAPTCHA from "react-google-recaptcha";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const RECAPTCHA_SITE_KEY = "6Lf2vwQsAAAAAF8TpHeeHhN28sKolp_c5-xNKqwP";

const Contact = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const recaptchaToken = recaptchaRef.current?.getValue();
    if (!recaptchaToken) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please complete the reCAPTCHA verification",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      const data = {
        name: formData.get("name") as string,
        email: formData.get("email") as string,
        phone: formData.get("phone") as string,
        message: formData.get("message") as string,
        recaptchaToken,
      };

      const { error } = await supabase.functions.invoke("send-contact-email", {
        body: data,
      });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Your message has been sent. We'll get back to you soon!",
      });

      e.currentTarget.reset();
      recaptchaRef.current?.reset();
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send message. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="py-24 bg-background">
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
        <div className="max-w-2xl mx-auto">
          {/* Contact Form */}
          <div className="bg-secondary p-8">
            <h3 className="text-2xl font-bold text-foreground mb-6">Request A Quote</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                    Name
                  </label>
                  <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  className="w-full px-4 py-3 bg-background border border-input focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors duration-300"
                  placeholder="Your name"
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-2">
                    Phone
                  </label>
                  <input
                  type="tel"
                  id="phone"
                  name="phone"
                  required
                  className="w-full px-4 py-3 bg-background border border-input focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors duration-300"
                  placeholder="Your phone"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  className="w-full px-4 py-3 bg-background border border-input focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors duration-300"
                  placeholder="your@email.com"
                />
              </div>
              
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  required
                  className="w-full px-4 py-3 bg-background border border-input focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors duration-300 resize-none"
                  placeholder="Tell us about your project..."
                ></textarea>
              </div>
              
              <div>
                <ReCAPTCHA
                  ref={recaptchaRef}
                  sitekey={RECAPTCHA_SITE_KEY}
                  theme="light"
                />
              </div>
              
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Sending..." : "Send Message"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
