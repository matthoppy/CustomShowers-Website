import { useState, useRef } from "react";
import { Turnstile } from "@marsidev/react-turnstile";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";

const WORKER_URL = "https://customshowers-contact.vcwvk4sm9m.workers.dev";

interface QuoteFormProps {
  onSubmitSuccess?: () => void;
  onClose?: () => void;
}

const QuoteForm = ({ onSubmitSuccess, onClose }: QuoteFormProps = {}) => {
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

      const addressLine = formData.get("addressLine") as string;
      const city = formData.get("city") as string;
      const postcode = formData.get("postcode") as string;
      const address = [addressLine, city, postcode].filter(Boolean).join(", ");

      const payload = {
        name: formData.get("name"),
        email: formData.get("email"),
        phone: formData.get("phone"),
        address,
        serviceType: formData.get("serviceType"),
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
        if (typeof window !== 'undefined' && typeof (window as any).gtag === 'function') {
          (window as any).gtag('event', 'conversion', { send_to: 'AW-18009060377/zXn2CNeGqpAcEJnosYtD' });
        }
      setSubmitted(true);
      onSubmitSuccess?.();
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
        <div className="flex gap-3 mt-2">
          <Button
            type="button"
            variant="outline"
            className="bg-transparent border-white/40 text-primary-foreground hover:bg-white/10"
            onClick={() => setSubmitted(false)}
          >
            Send Another Message
          </Button>
          <Button
            type="button"
            className="bg-white text-primary hover:bg-white/90"
            onClick={() => { setSubmitted(false); onClose?.(); }}
          >
            Close
          </Button>
        </div>
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
        <label className="block text-sm font-medium text-primary-foreground mb-2">
          Service Type
        </label>
        <div className="grid grid-cols-2 gap-3">
          {["Supply Only", "Supply + London Installation"].map((option) => (
            <label
              key={option}
              className="flex items-center gap-3 px-4 py-3 bg-background border border-input cursor-pointer has-[:checked]:border-primary has-[:checked]:ring-1 has-[:checked]:ring-primary transition-colors duration-200"
            >
              <input
                type="radio"
                name="serviceType"
                value={option}
                required
                className="accent-primary w-4 h-4 shrink-0"
              />
              <span className="text-sm text-foreground font-medium">{option}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-primary-foreground mb-2">
          Address
        </label>
        <div className="space-y-3">
          <input
            type="text"
            id="addressLine"
            name="addressLine"
            required
            className="w-full px-4 py-3 bg-background border border-input focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors duration-300"
            placeholder="Street address"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              id="city"
              name="city"
              required
              className="w-full px-4 py-3 bg-background border border-input focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors duration-300"
              placeholder="City"
            />
            <input
              type="text"
              id="postcode"
              name="postcode"
              required
              className="w-full px-4 py-3 bg-background border border-input focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors duration-300"
              placeholder="Postcode"
            />
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="photo" className="block text-sm font-medium text-primary-foreground mb-2">
          Upload a photo or rough sketch
        </label>
        <input
          type="file"
          id="photo"
          name="photo"
          accept="image/*,.pdf"
          className="w-full px-4 py-3 bg-background border border-input text-foreground file:mr-4 file:py-1 file:px-3 file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:opacity-90 outline-none transition-colors duration-300"
        />
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium text-primary-foreground mb-2">
          Tell Us About Your Project
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          className="w-full px-4 py-3 bg-background border border-input focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors duration-300 resize-none"
          placeholder="Tell us about your project..."
        ></textarea>
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
        {isSubmitting ? "Sending..." : "Send Message"}
      </Button>
    </form>
  );
};

export default QuoteForm;
