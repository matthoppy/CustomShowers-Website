import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "How much does a custom shower enclosure cost?",
    answer:
      "Pricing varies based on size, hardware finish and whether you choose supply-only or full supply & install. Every project is different, so we provide free, no-obligation quotes tailored to your exact requirements — get in touch and we'll turn your enquiry around quickly.",
  },
  {
    question: "Do you offer supply-only or do you install as well?",
    answer:
      "We offer both. Many customers choose our supply-only service — we produce fully bespoke enclosures with detailed technical drawings and installation guides so your own fitter can install with confidence. We also offer a full supply and install service across London with our own experienced team.",
  },
  {
    question: "What areas do you cover?",
    answer:
      "We supply nationwide across the UK. Our installation team covers all London boroughs and surrounding areas including Surrey, Essex, Hertfordshire and Kent. Contact us to confirm availability in your area.",
  },
  {
    question: "How long does it take from order to installation?",
    answer:
      "Lead times vary by order complexity, but most bespoke enclosures are ready within 2–4 weeks from survey sign-off. We'll give you a clear timeline when you book your survey. Installation itself typically takes half a day to a full day depending on the size and complexity of the enclosure.",
  },
  {
    question: "What glass do you use?",
    answer:
      "All our frameless enclosures are made with 10mm toughened safety glass — the premium choice for frameless installations. It's heavier, more rigid, and gives a much more substantial feel than thinner alternatives, while being fully compliant with BS EN 12150. We offer a range of hardware finishes including chrome, brushed nickel, matte black, brushed brass and gold.",
  },
  {
    question: "Can you work with awkward spaces like loft conversions or sloped ceilings?",
    answer:
      "Absolutely — bespoke is what we do. We regularly work with challenging spaces including loft conversions, sloped ceilings, alcoves, and non-standard layouts. We carry out a full survey before production to ensure every enclosure fits perfectly.",
  },
  {
    question: "Do you offer a warranty on your products?",
    answer:
      "Yes. All our enclosures come with a manufacturer's warranty covering glass and hardware. Our installation work is also guaranteed. Full warranty terms are provided with every order.",
  },
  {
    question: "What is the difference between frameless and semi-frameless?",
    answer:
      "Frameless enclosures use thick toughened glass with minimal or concealed hardware — giving a clean, open look with no visible frame around the glass. Semi-frameless designs use thinner glass with a partial frame for structural support. Frameless is generally considered more premium and easier to clean.",
  },
];

const FAQItem = ({
  question,
  answer,
  isOpen,
  onToggle,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}) => (
  <div className="border-b border-border">
    <button
      className="w-full flex items-center justify-between py-5 text-left gap-4"
      onClick={onToggle}
      aria-expanded={isOpen}
    >
      <span className="font-semibold text-foreground text-base">{question}</span>
      <ChevronDown
        className={`w-5 h-5 text-primary flex-shrink-0 transition-transform duration-200 ${
          isOpen ? "rotate-180" : ""
        }`}
      />
    </button>
    {isOpen && (
      <p className="pb-5 text-muted-foreground leading-relaxed">{answer}</p>
    )}
  </div>
);

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-24 bg-muted/30">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 uppercase">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-muted-foreground">
              Everything you need to know about our bespoke shower enclosures
            </p>
          </div>

          {/* Accordion */}
          <div className="border-t border-border">
            {faqs.map((faq, i) => (
              <FAQItem
                key={i}
                question={faq.question}
                answer={faq.answer}
                isOpen={openIndex === i}
                onToggle={() => setOpenIndex(openIndex === i ? null : i)}
              />
            ))}
          </div>

          {/* CTA */}
          <div className="mt-12 text-center">
            <p className="text-muted-foreground mb-4">
              Still have questions? We're happy to help.
            </p>
            <a
              href="#contact"
              className="inline-block bg-primary text-primary-foreground px-8 py-3 font-semibold uppercase tracking-widest text-sm hover:bg-primary/90 transition-colors"
            >
              Get in Touch
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
