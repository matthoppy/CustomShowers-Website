import { Link } from "react-router-dom";
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";
import { Button } from "../components/ui/button";
import { useState } from "react";
import QuoteModal from "../components/QuoteModal";

const applications = [
  {
    title: "Staircases",
    description:
      "Frameless glass balustrades open up stairwells and let light flow between floors. We manufacture panels to suit straight flights, winders, and curved staircases — supply only or supply and fit across London.",
  },
  {
    title: "Juliet Balconies",
    description:
      "A clean, minimal alternative to traditional Juliet railings. Our frameless glass Juliet balconies are fixed directly to the structural opening with no visible posts, meeting all UK building regulations.",
  },
  {
    title: "Terraces & Balconies",
    description:
      "Preserve the view from external terraces and balconies without the bulk of steel railings. Toughened and laminated glass panels rated to building regulation loads, supplied nationwide.",
  },
  {
    title: "Landing Infills",
    description:
      "Replace timber spindles or closed panels with frameless glass on internal landings. Dramatically brightens hallways and adds a contemporary feel to period and new-build properties alike.",
  },
  {
    title: "Pool & Garden Surrounds",
    description:
      "Glass balustrades around swimming pools and raised garden terraces. Frameless channel-fixed systems keep sightlines completely clear while meeting safety requirements.",
  },
  {
    title: "Commercial & Retail",
    description:
      "Mezzanine floors, office atria, and retail spaces. We work with architects and contractors on commercial projects requiring bespoke glass balustrade systems.",
  },
];

const systems = [
  {
    name: "Frameless Channel Fixed",
    description:
      "Glass sits in a continuous floor or wall channel with no posts. The cleanest possible look — the glass appears to float. Best for straight runs with solid substrate.",
  },
  {
    name: "Frameless Post Fixed",
    description:
      "Minimal stainless steel or powder-coated posts fix into the floor or stringer. Suits timber floors, steel staircases, and situations where a channel fix isn't possible.",
  },
  {
    name: "Semi-Frameless",
    description:
      "Top and bottom rails with glass infill panels. Slightly more structure than frameless, but still a clean result — a popular choice for external terraces and commercial applications.",
  },
];

const faqs = [
  {
    question: "Do your balustrades meet UK building regulations?",
    answer:
      "Yes. All our balustrade systems are designed to meet the relevant sections of Approved Document K and BS 6180. We use toughened and laminated glass rated to the required loadings for the specific application. For planning or building control purposes, we can provide technical specifications.",
  },
  {
    question: "What glass do you use for balustrades?",
    answer:
      "We use 10mm toughened safety glass as standard for interior applications, and 17.5mm or 21.5mm toughened laminated glass for external or high-load situations. Laminated glass is required in most external balcony and terrace applications to meet fall-arrest requirements.",
  },
  {
    question: "Do you supply only, or can you install too?",
    answer:
      "Both. We supply balustrade systems nationwide with full technical drawings and installation guides. Our installation team covers London and surrounding areas for supply-and-fit projects.",
  },
  {
    question: "Can you work with curved or shaped balustrades?",
    answer:
      "Straight and angled runs are our standard. Curved glass balustrades are possible but require specialist manufacture — contact us with your requirements and we'll advise on feasibility and lead times.",
  },
  {
    question: "What hardware finishes are available?",
    answer:
      "Posts, clamps, and handrails are available in satin stainless steel, brushed nickel, matt black, and brushed brass. Powder-coated finishes in RAL colours are available on request for commercial projects.",
  },
  {
    question: "How do I get a quote?",
    answer:
      "Send us your dimensions, a brief description of the application (indoor/outdoor, staircase/terrace etc.), and any photos if you have them. We'll come back with a detailed quote, usually within one business day.",
  },
];

const Balustrades = () => {
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation onOpenQuote={() => setQuoteModalOpen(true)} />

      {/* Hero */}
      <section className="bg-primary text-primary-foreground pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-4xl text-center">
          <p className="text-secondary uppercase tracking-widest text-sm font-semibold mb-4">
            Staircases · Balconies · Terraces
          </p>
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-wider mb-6">
            Frameless Glass Balustrades
          </h1>
          <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto mb-10">
            Bespoke toughened glass balustrade systems for staircases, Juliet balconies, terraces,
            and landings. Supply only UK wide. Supply and fit across London.
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

      {/* Applications */}
      <section className="py-20 px-6 bg-background">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Where We Work</h2>
          <p className="text-center text-muted-foreground mb-16 max-w-xl mx-auto">
            Frameless glass balustrades for every setting — residential, commercial, interior, and external.
          </p>
          <div className="grid md:grid-cols-2 gap-10">
            {applications.map((app) => (
              <div key={app.title} className="flex gap-5">
                <div className="flex-shrink-0 w-1 rounded-full bg-primary mt-1" />
                <div>
                  <h3 className="font-semibold text-lg mb-2">{app.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{app.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Systems */}
      <section className="py-20 px-6 bg-muted/40">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Fixing Systems</h2>
          <p className="text-center text-muted-foreground mb-16 max-w-xl mx-auto">
            We'll advise on the right system for your substrate and aesthetic. If you're unsure, just describe the application and we'll guide you.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {systems.map((system) => (
              <div key={system.name} className="bg-background rounded-xl p-8 shadow-sm">
                <h3 className="font-semibold text-lg mb-3">{system.name}</h3>
                <p className="text-muted-foreground leading-relaxed">{system.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why us */}
      <section className="py-20 px-6 bg-background">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">Why Custom Showers for Balustrades?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Same Glass, Same Standard",
                body: "We use 10mm toughened safety glass across our shower and balustrade work — BS EN 12150 compliant, manufactured to order, cut to your exact dimensions.",
              },
              {
                title: "Nationwide Supply",
                body: "We deliver balustrade glass and hardware anywhere in the UK, packaged to protect panels in transit. Full installation drawings included.",
              },
              {
                title: "London Installation",
                body: "Our installation team handles balustrade projects across London and the Home Counties — the same team that fits our shower enclosures.",
              },
            ].map((card) => (
              <div key={card.title} className="bg-muted/40 rounded-xl p-8">
                <h3 className="font-semibold text-lg mb-3">{card.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6 bg-muted/40">
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
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-primary-foreground/80 mb-8">
            Send us your dimensions and application details — we'll come back with a quote within one business day.
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

export default Balustrades;
