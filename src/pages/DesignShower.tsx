import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Mail, CheckCircle, Ruler, Palette, Shield } from "lucide-react";
import { useState, useRef } from "react";
import ReCAPTCHA from "react-google-recaptcha";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

import galleryImage1 from "@/assets/gallery-1.jpg";
import galleryImage2 from "@/assets/gallery-2.jpg";
import galleryImage3 from "@/assets/gallery-3.jpg";
import galleryImage4 from "@/assets/gallery-4.jpg";

const RECAPTCHA_SITE_KEY = "6Lf2vwQsAAAAAF8TpHeeHhN28sKolp_c5-xNKqwP";

const DesignShower = () => {
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

  const features = [
    {
      icon: Ruler,
      title: "Precise Measurements",
      description: "Every enclosure is measured to the millimetre for a perfect fit",
    },
    {
      icon: Palette,
      title: "Custom Finishes",
      description: "Choose from a range of hardware finishes to match your bathroom",
    },
    {
      icon: Shield,
      title: "Quality Glass",
      description: "Toughened safety glass in various thicknesses from 8mm to 12mm",
    },
  ];

  return (
    <div className="min-h-screen">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-40 pb-16 bg-primary">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-6 uppercase">
              Design Your Shower
            </h1>
            <p className="text-xl text-primary-foreground/80 mb-8">
              Work with our experts to create your perfect bespoke frameless shower enclosure
            </p>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-foreground mb-8 text-center uppercase">
              Our Design Process
            </h2>
            
            <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
              <div>
                <div className="space-y-6 text-muted-foreground">
                  <p className="text-lg">
                    At Bespoke Frameless Showers, we work closely with you to design the perfect shower enclosure for your space. Our experienced team will guide you through every step of the process.
                  </p>
                  <ul className="space-y-4">
                    {[
                      "Initial consultation to understand your requirements",
                      "Professional on-site survey and measurements",
                      "Custom design tailored to your bathroom layout",
                      "Selection of glass thickness, finishes and hardware",
                      "Detailed quotation with no hidden costs",
                    ].map((item, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <img
                  src={galleryImage1}
                  alt="Frameless shower enclosure example"
                  className="w-full h-48 object-cover"
                  loading="lazy"
                />
                <img
                  src={galleryImage2}
                  alt="Frameless shower enclosure example"
                  className="w-full h-48 object-cover"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-primary">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-primary-foreground mb-12 text-center uppercase">
              Why Choose Us
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={index} className="text-center">
                    <div className="mb-4 flex justify-center">
                      <Icon className="w-12 h-12 text-primary-foreground" />
                    </div>
                    <h3 className="text-xl font-bold text-primary-foreground mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-primary-foreground/80">
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-foreground mb-8 text-center uppercase">
              Our Work
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <img
                src={galleryImage1}
                alt="Frameless shower example 1"
                className="w-full h-64 object-cover hover:opacity-90 transition-opacity"
                loading="lazy"
              />
              <img
                src={galleryImage2}
                alt="Frameless shower example 2"
                className="w-full h-64 object-cover hover:opacity-90 transition-opacity"
                loading="lazy"
              />
              <img
                src={galleryImage3}
                alt="Frameless shower example 3"
                className="w-full h-64 object-cover hover:opacity-90 transition-opacity"
                loading="lazy"
              />
              <img
                src={galleryImage4}
                alt="Frameless shower example 4"
                className="w-full h-64 object-cover hover:opacity-90 transition-opacity"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="py-16 bg-muted">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4 uppercase">
                Start Your Design
              </h2>
              <p className="text-muted-foreground text-lg">
                Ready to create your perfect shower? Get in touch for a free consultation
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12">
              {/* Contact Info */}
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-foreground">Get In Touch</h3>
                <p className="text-muted-foreground">
                  Contact us today to discuss your project. We'll arrange a convenient time to visit your property and provide a detailed quote.
                </p>
                <div className="flex items-start gap-4">
                  <Mail className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Email</h4>
                    <a
                      href="mailto:sales@bespokeframelessshowers.co.uk"
                      className="text-muted-foreground hover:text-primary transition-colors duration-300"
                    >
                      sales@bespokeframelessshowers.co.uk
                    </a>
                  </div>
                </div>
              </div>

              {/* Contact Form */}
              <div className="bg-primary p-8">
                <h3 className="text-2xl font-bold text-primary-foreground mb-6">Request A Quote</h3>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-primary-foreground mb-2">
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
                      <label htmlFor="phone" className="block text-sm font-medium text-primary-foreground mb-2">
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
                    <label htmlFor="email" className="block text-sm font-medium text-primary-foreground mb-2">
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
                    <label htmlFor="message" className="block text-sm font-medium text-primary-foreground mb-2">
                      Tell Us About Your Project
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={4}
                      required
                      className="w-full px-4 py-3 bg-background border border-input focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors duration-300 resize-none"
                      placeholder="Describe your bathroom and what you're looking for..."
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
                    {isSubmitting ? "Sending..." : "Get Your Free Quote"}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default DesignShower;
