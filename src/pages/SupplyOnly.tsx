import { Link } from "react-router-dom";
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";
import { Button } from "../components/ui/button";
import { useState } from "react";
import QuoteModal from "../components/QuoteModal";

const steps = [
  {
    number: "01",
    title: "Send Your Measurements",
    description:
      "Provide us with your bathroom dimensions — width, height, and any angles or returns. Sketches, photos, or dimensioned drawings are all fine. The more detail you send, the more accurate your quote will be.",
  },
  {
    number: "02",
    title: "Receive Your Quote",
    description:
      "We'll come back to you with a detailed quote covering glass panels, hardware, and delivery. Quotes are valid for 30 days and are itemised so you can see exactly what you're getting.",
  },
  {
    number: "03",
    title: "Confirm & Pay",
    description:
      "Once you're happy, confirm the order and pay in full. This triggers manufacture of your bespoke glass panels — cut and toughened to your exact measurements.",
  },
  {
    number: "04",
    title: "Manufacturing",
    description:
      "Your glass is manufactured to order using 10mm toughened safety glass that meets BS EN 12150. Lead times are typically 2–4 weeks depending on complexity and current workload.",
  },
  {
    number: "05",
    title: "Delivery Nationwide",
    description:
      "We deliver across the UK in purpose-built A-frames designed to protect bespoke glass in transit. You'll be notified with a delivery window and tracking details. Inspect all panels on arrival — defects must be reported within 24 hours.",
  },
  {
    number: "06",
    title: "Your Installer Fits",
    description:
      "Hand the panels and hardware over to your bathroom fitter or tiler. You'll receive custom installation instructions prepared specifically for your shower, including detailed diagrams and measurements. Our frameless systems are designed to be straightforward to install for any competent tradesperson. We're available by phone or email if your installer has questions.",
  },
];

const faqs = [
  {
    question: "Do I need to be in London?",
    answer:
      "No. We supply across the entire UK. Delivery is available nationwide.",
  },
  {
    question: "Who installs the shower?",
    answer:
      "You arrange installation through your own bathroom fitter, tiler, or builder. We provide the glass and hardware only. If you're in London and need installation, ask us about our full supply-and-fit service.",
  },
  {
    question: "What if my measurements are slightly off?",
    answer:
      "Glass is manufactured to a standard industry tolerance of ±3mm. We recommend double-checking measurements before confirming. Once manufacture has started, changes cannot be made.",
  },
  {
    question: "What glass thickness do you use?",
    answer:
      "We supply 10mm toughened safety glass as standard, fully compliant with BS EN 12150.",
  },
  {
    question: "Can I choose my own hardware finish?",
    answer:
      "Yes. We offer hardware in chrome, brushed nickel, matt black, and brushed brass. Specify your preferred finish when requesting a quote.",
  },
  {
    question: "What's included in a supply-only order?",
    answer:
      "Glass panels, hinges, channels or wall profiles, handles, seals, and any other hardware specified in your quote. You'll also receive custom installation instructions prepared specifically for your shower, with detailed diagrams and measurements to guide your installer.",
  },
];

const SupplyOnly = () => {
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation onOpenQuote={() => setQuoteModalOpen(true)} />

      {/* Hero */}
      <section
        className="relative text-primary-foreground pt-32 pb-20 px-6 bg-cover bg-center bg-fixed"
        style={{
          backgroundImage: "url(/images/greentile.landscape.png)",
        }}
      >
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative container mx-auto max-w-4xl text-center">
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-wider mb-6">
            Bespoke Glass. Delivered to Your Door.
          </h1>
          <p className="text-xl text-primary-foreground/90 max-w-2xl mx-auto mb-10">
            Order premium frameless shower enclosures direct — measured to your specification,
            manufactured to order, and shipped anywhere in the UK. Your installer fits, we supply the glass.
          </p>
          <Button
            variant="default"
            size="lg"
            className="bg-white text-primary hover:bg-white/90"
            onClick={() => setQuoteModalOpen(true)}
          >
            Get A Quote
          </Button>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6 bg-background">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">How It Works</h2>
          <p className="text-center text-muted-foreground mb-16 max-w-xl mx-auto">
            Six straightforward steps from your bathroom dimensions to glass on-site, ready to install.
          </p>

          <div className="grid md:grid-cols-2 gap-10">
            {steps.map((step) => (
              <div key={step.number} className="flex gap-6">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                  {step.number}
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Supply Only */}
      <section className="py-20 px-6 bg-muted/40">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">Why Choose Supply Only?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Use Your Own Installer",
                body: "You've already got a trusted bathroom fitter. Supply-only means they install our glass — you don't pay for labour you don't need.",
              },
              {
                title: "Available Nationwide",
                body: "Our full supply-and-fit service is focused on London, but supply-only orders ship anywhere in the UK.",
              },
              {
                title: "Same Quality Glass",
                body: "Identical 10mm toughened safety glass, premium hardware, and precise manufacturing — regardless of whether we fit it.",
              },
            ].map((card) => (
              <div key={card.title} className="bg-background rounded-xl p-8 shadow-sm">
                <h3 className="font-semibold text-lg mb-3">{card.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6 bg-background">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold text-center mb-12">Common Questions</h2>
          <div className="space-y-8">
            {faqs.map((faq) => (
              <div key={faq.question} className="border-b border-border pb-8 last:border-0 last:pb-0">
                <h3 className="font-semibold text-lg mb-2">{faq.question}</h3>
                <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-primary text-primary-foreground text-center">
        <div className="container mx-auto max-w-2xl">
          <h2 className="text-3xl font-bold mb-4">Ready to Order?</h2>
          <p className="text-primary-foreground/80 mb-8">
            Send us your measurements and we'll come back with a detailed quote — usually within one business day.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              className="bg-white text-primary hover:bg-white/90"
              size="lg"
              onClick={() => setQuoteModalOpen(true)}
            >
              Get A Quote
            </Button>
            <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10" asChild>
              <Link to="/">Back to Home</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
      <QuoteModal open={quoteModalOpen} onOpenChange={setQuoteModalOpen} />
    </div>
  );
};

export default SupplyOnly;
