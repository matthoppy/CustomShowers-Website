import { useState } from "react";
import { Turnstile } from "@marsidev/react-turnstile";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";

const MAKE_WEBHOOK_URL = "https://hook.eu1.make.com/wru9vum5ew9twpibdjwvhlmpbvmmgoba";

const QuoteForm = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
          e.preventDefault();

          if (!turnstileToken) {
                  toast({
                            variant: "destructive",
                            title: "Error",
                            description: "Please complete the security check",
                  });
                  return;
          }

          setIsSubmitting(true);

          try {
                  const formData = new FormData(e.currentTarget);

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

            await fetch(MAKE_WEBHOOK_URL, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                                  name: formData.get("name"),
                                  email: formData.get("email"),
                                  phone: formData.get("phone"),
                                  address: formData.get("address"),
                                  message: formData.get("message"),
                                  photo,
                      }),
            });

            toast({
                      title: "Success!",
                      description: "Your message has been sent. We'll get back to you soon!",
            });
                  e.currentTarget.reset();
                  setTurnstileToken(null);
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
          <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                                  <label htmlFor="name" className="block text-sm font-medium text-primary-foreground mb-2">
                                              Name
                                  </label>label>
                                  <input
                                                type="text"
                                                id="name"
                                                name="name"
                                                required
                                                className="w-full px-4 py-3 bg-background border border-input focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors duration-300"
                                                placeholder="Your name"
                                              />
                        </div>div>
                        <div>
                                  <label htmlFor="phone" className="block text-sm font-medium text-primary-foreground mb-2">
                                              Phone
                                  </label>label>
                                  <input
                                                type="tel"
                                                id="phone"
                                                name="phone"
                                                required
                                                className="w-full px-4 py-3 bg-background border border-input focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors duration-300"
                                                placeholder="Your phone"
                                              />
                        </div>div>
                </div>div>
                <div>
                        <label htmlFor="email" className="block text-sm font-medium text-primary-foreground mb-2">
                                  Email
                        </label>label>
                        <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    required
                                    className="w-full px-4 py-3 bg-background border border-input focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors duration-300"
                                    placeholder="your@email.com"
                                  />
                </div>div>
                <div>
                        <label htmlFor="address" className="block text-sm font-medium text-primary-foreground mb-2">
                                  Address
                        </label>label>
                        <input
                                    type="text"
                                    id="address"
                                    name="address"
                                    required
                                    className="w-full px-4 py-3 bg-background border border-input focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors duration-300"
                                    placeholder="Installation address"
                                  />
                </div>div>
                <div>
                        <label htmlFor="photo" className="block text-sm font-medium text-primary-foreground mb-2">
                                  Upload a photo or rough sketch
                        </label>label>
                        <input
                                    type="file"
                                    id="photo"
                                    name="photo"
                                    accept="image/*,.pdf"
                                    className="w-full px-4 py-3 bg-background border border-input text-foreground file:mr-4 file:py-1 file:px-3 file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:opacity-90 outline-none transition-colors duration-300"
                                  />
                </div>div>
                <div>
                        <label htmlFor="message" className="block text-sm font-medium text-primary-foreground mb-2">
                                  Tell Us About Your Project
                        </label>label>
                        <textarea
                                    id="message"
                                    name="message"
                                    rows={5}
                                    className="w-full px-4 py-3 bg-background border border-input focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors duration-300 resize-none"
                                    placeholder="Tell us about your project..."
                                  ></textarea>textarea>
                </div>div>
                <Turnstile
                          siteKey="0x4AAAAAACmVMi3ZDLDzTYwv"
                          onSuccess={(token) => setTurnstileToken(token)}
                          onExpire={() => setTurnstileToken(null)}
                        />
                <div className="flex flex-col items-center gap-2">
                        <span className="bg-white text-primary text-xs font-semibold px-4 py-1.5 rounded-full shadow-sm">
                                  Free &amp; No Obligation
                        </span>span>
                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                          {isSubmitting ? "Sending..." : "Send Message"}
                        </Button>Button>
                </div>div>
          </form>form>
        );
};

export default QuoteForm;</form>
