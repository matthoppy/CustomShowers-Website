import { useState, useRef } from "react";
import { Turnstile } from "@marsidev/react-turnstile";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import balustradeHero from "@/assets/balustrade-internal3.JPG";
import balustradeChannel from "@/assets/balustrade-channel.JPG";
import balustradeChannel2 from "@/assets/balustrade-channel2.JPG";
import balustradeChannel3 from "@/assets/balustrade-channel3.JPG";
import balustradeChannel4 from "@/assets/balustrade-channel4.JPG";
import balustradeClamps from "@/assets/balustrade-clamps.JPG";
import balustradeClamps3 from "@/assets/balustrade-clamps3.JPG";
import balustraadeCurved from "@/assets/balustrade-curved.JPG";
import balustradeInternal from "@/assets/balustrade-internal.JPG";
import balustradeInternal2 from "@/assets/balustrade-internal2.JPG";
import balustradeJuliette from "@/assets/balustrade-juliette.JPG";
import balustradeJuliette2 from "@/assets/balustrade-juliette2.JPG";
import balustradePost1 from "@/assets/balustrade-posts1.JPG";
import balustradePost2 from "@/assets/balustrade-posts2.JPG";
import balustradePost3 from "@/assets/balustrade-posts3.JPG";
import balustradeStandoff from "@/assets/balustrade-standoff.JPG";
import balustradeStandoff2 from "@/assets/balustrade-standoff2.JPG";
import balustradesPosts4 from "@/assets/balustrades-posts4.JPG";

const WORKER_URL = "https://customshowers-contact.vcwvk4sm9m.workers.dev";

const BalustradeQuoteForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!turnstileToken) {
      toast({
        variant: "destructive",
        title: "Security check required",
        description: "Please complete the security check before submitting.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData(formRef.current!);
      let photo: { name: string; type: string; data: string } | null = null;
      const file = formData.get("photo") as File;

      if (file && file.size > 0) {
        if (file.size > 5 * 1024 * 1024) {
          toast({ variant: "destructive", title: "File too large", description: "Please upload a file under 5MB." });
          setIsSubmitting(false);
          return;
        }
        const buffer = await file.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
        photo = { name: file.name, type: file.type, data: base64 };
      }

      const payload = {
        name: formData.get("name"),
        email: formData.get("email"),
        phone: formData.get("phone"),
        serviceType: formData.get("projectType"),
        message: formData.get("message"),
        turnstileToken,
        photo,
      };

      const response = await fetch(WORKER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(`Request failed: ${response.status}`);

      formRef.current?.reset();
      setTurnstileToken(null);
      setSubmitted(true);

      if (typeof window !== "undefined" && typeof (window as any).gtag === "function") {
        (window as any).gtag("event", "conversion", { send_to: "AW-18009060377/zXn2CNeGqpAcEJnosYtD" });
      }
    } catch (error) {
      console.error("Form submission error:", error);
      toast({
        variant: "destructive",
        title: "Something went wrong",
        description: "Failed to send your message. Please try again or call us directly.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center space-y-5">
        <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-primary-foreground">Message Received!</h3>
        <p className="text-primary-foreground/80 max-w-sm leading-relaxed">
          Thank you for getting in touch. A member of our team will review your enquiry and get back to you within 1 business day.
        </p>
        <Button
          type="button"
          variant="outline"
          className="bg-transparent border-white/40 text-primary-foreground hover:bg-white/10"
          onClick={() => setSubmitted(false)}
        >
          Send Another Enquiry
        </Button>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
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
        <label htmlFor="projectType" className="block text-sm font-medium text-primary-foreground mb-2">
          Type of Project
        </label>
        <select
          id="projectType"
          name="projectType"
          required
          className="w-full px-4 py-3 bg-background border border-input focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors duration-300 text-foreground"
        >
          <option value="" disabled selected>Select project type</option>
          <option value="Staircase Balustrade">Staircase Balustrade</option>
          <option value="Juliet Balcony">Juliet Balcony</option>
          <option value="Internal Railing">Internal Railing</option>
          <option value="External Balustrade">External Balustrade</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium text-primary-foreground mb-2">
          Description / Measurements
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          className="w-full px-4 py-3 bg-background border border-input focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors duration-300 resize-none"
          placeholder="Describe your project and include any measurements or dimensions if known..."
        ></textarea>
      </div>

      <div>
        <label htmlFor="photo" className="block text-sm font-medium text-primary-foreground mb-2">
          Upload Plans or Drawings (optional)
        </label>
        <input
          type="file"
          id="photo"
          name="photo"
          accept="image/*,.pdf"
          className="w-full px-4 py-3 bg-background border border-input text-foreground file:mr-4 file:py-1 file:px-3 file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:opacity-90 outline-none transition-colors duration-300"
        />
      </div>

      <div className="flex justify-center">
        <Turnstile
          siteKey="0x4AAAAAACmVMi3ZDLDzTYwv"
          onSuccess={(token) => setTurnstileToken(token)}
          onExpire={() => setTurnstileToken(null)}
        />
      </div>

      <Button
        type="submit"
        className="w-full bg-white text-primary hover:bg-white/90"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Sending..." : "Request a Quote"}
      </Button>
    </form>
  );
};

const Balustrades = () => {
  const formRef = useRef<HTMLDivElement>(null);

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen">
      <Navigation onOpenQuote={scrollToForm} />

      {/* Hero */}
      <section className="relative h-screen w-full overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${balustradeHero})` }}
          role="img"
          aria-label="Bespoke glass balustrade installation"
        >
          <div className="absolute inset-0 bg-overlay/50" />
        </div>
        <div className="relative h-full flex items-center justify-center text-center px-6">
          <div className="max-w-5xl">
            <h1 className="text-5xl md:text-7xl font-black text-primary-foreground uppercase tracking-wider mb-6 animate-fade-in">
              Glass Balustrades &amp; Juliet Balconies in London
            </h1>
            <p className="text-xl md:text-2xl text-primary-foreground/90 mb-8 max-w-3xl mx-auto font-light">
              Bespoke glass solutions for staircases, balconies, and internal spaces — supplied and installed across London.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="hero" onClick={scrollToForm}>
                Get a Quote
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="bg-white text-primary hover:bg-white/90"
                onClick={scrollToForm}
              >
                Send Your Plans
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Intro */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-6 max-w-4xl text-center">
          <p className="text-xl text-muted-foreground leading-relaxed mb-4">
            While our main focus is bespoke frameless shower enclosures, we also design, supply, and install glass balustrades and Juliet balconies across London.
          </p>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Using the same attention to detail and high-quality materials, we create clean, modern glass systems tailored to each project. Whether it's a staircase, landing, or external balcony, every installation is made to measure and finished to a high standard.
          </p>
        </div>
      </section>

      {/* Services */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 uppercase">
              Our Balustrade Services
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {[
              {
                title: "Staircase Balustrades",
                description: "Frameless or channel-fixed glass systems for stairs and landings, creating a clean, open feel.",
              },
              {
                title: "Juliet Balconies",
                description: "Safe, minimalist glass barriers for upper-floor openings, designed to maximise light and views.",
              },
              {
                title: "Internal Glass Railings",
                description: "Modern glass solutions for mezzanines and open-plan spaces.",
              },
              {
                title: "External Balustrades",
                description: "Durable, weather-resistant systems for terraces and outdoor areas.",
              },
            ].map((service) => (
              <div key={service.title} className="bg-background p-8 border border-border">
                <h3 className="text-xl font-bold text-foreground mb-3">{service.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 uppercase">
              Our Balustrade Work
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A selection of our recent installations showcasing different styles and applications.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              { src: balustradeChannel, alt: "Channel-fixed balustrade" },
              { src: balustradeChannel2, alt: "Channel system detail" },
              { src: balustradeChannel3, alt: "Channel balustrade installation" },
              { src: balustradeChannel4, alt: "Channel balustrade application" },
              { src: balustradeClamps, alt: "Clamp-fixed system" },
              { src: balustradeClamps3, alt: "Balustrade clamps detail" },
              { src: balustraadeCurved, alt: "Curved balustrade" },
              { src: balustradeInternal, alt: "Internal glass railing" },
              { src: balustradeInternal2, alt: "Internal balustrade design" },
              { src: balustradeInternal3, alt: "Modern internal railing" },
              { src: balustradeJuliette, alt: "Juliet balcony" },
              { src: balustradeJuliette2, alt: "Juliet balcony installation" },
              { src: balustradePost1, alt: "Post-supported balustrade" },
              { src: balustradePost2, alt: "Posts and clamping" },
              { src: balustradePost3, alt: "Staircase balustrade" },
              { src: balustradeStandoff, alt: "Standoff system" },
              { src: balustradeStandoff2, alt: "Standoff detail" },
              { src: balustradesPosts4, alt: "Posts installation" },
            ].map((image, idx) => (
              <div key={idx} className="overflow-hidden bg-background border border-border hover:shadow-lg transition-shadow duration-300">
                <img
                  src={image.src}
                  alt={image.alt}
                  className="w-full h-64 object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Materials */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 uppercase">
              Made to Measure, Built to Last
            </h2>
          </div>
          <p className="text-xl text-muted-foreground leading-relaxed text-center">
            All of our balustrades and Juliet balconies are made using high-quality toughened or laminated glass, ensuring both safety and durability. We offer a range of fixing options, including channel systems and post-supported designs, depending on your preference and project requirements. Every detail is considered — from clean edge finishes to discreet fixings — to achieve a seamless final result.
          </p>
        </div>
      </section>

      {/* Process */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 uppercase">
              Our Process
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {[
              {
                step: "01",
                title: "Send Your Plans or Measurements",
                description: "Share drawings, dimensions, or photos of your space.",
              },
              {
                step: "02",
                title: "Design & Quote",
                description: "We'll recommend the best solution and provide a clear quote.",
              },
              {
                step: "03",
                title: "Manufacture",
                description: "Your glass is made to measure using high-quality materials.",
              },
              {
                step: "04",
                title: "Installation (London Only)",
                description: "Our team installs everything to a high standard.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="text-5xl font-black text-primary/20 mb-4">{item.step}</div>
                <h3 className="text-lg font-bold text-foreground mb-3">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 uppercase">
              Why Custom Showers
            </h2>
          </div>
          <div className="flex flex-wrap justify-center gap-6 max-w-4xl mx-auto">
            {[
              "Specialists in frameless glass systems",
              "High-quality materials and finishes",
              "Made-to-measure for every project",
              "Supply and installation across London",
              "Trusted by homeowners and contractors",
            ].map((point) => (
              <div key={point} className="flex items-center gap-3 bg-white/10 px-6 py-4 rounded-sm">
                <svg className="w-5 h-5 text-white shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-medium">{point}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 uppercase">
            Got a project in mind?
          </h2>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Send us your plans or measurements and we'll provide a tailored quote.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="default" size="lg" onClick={scrollToForm}>
              Request a Quote
            </Button>
            <Button variant="outline" size="lg" onClick={scrollToForm}>
              Upload Your Plans
            </Button>
          </div>
        </div>
      </section>

      {/* Quote Form */}
      <section id="quote" ref={formRef} className="py-24 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 uppercase">
              Get In Touch
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Tell us about your project and we'll get back to you with a tailored quote.
            </p>
          </div>
          <div className="max-w-2xl mx-auto">
            <div className="bg-primary p-8">
              <h3 className="text-2xl font-bold text-primary-foreground mb-6">Request a Balustrade Quote</h3>
              <BalustradeQuoteForm />
            </div>
          </div>
        </div>
      </section>

      {/* SEO Footer Text */}
      <section className="py-12 bg-background border-t border-border">
        <div className="container mx-auto px-6 max-w-4xl">
          <p className="text-sm text-muted-foreground text-center leading-relaxed">
            We provide glass balustrades and Juliet balconies across London, including staircases, terraces, and internal spaces. All systems are made to measure and designed to meet safety standards while maintaining a clean, modern look.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Balustrades;
