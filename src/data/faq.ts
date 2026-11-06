/**
 * The questions on the home page. The FAQ section shows them and the
 * FAQPage structured data repeats them for search engines.
 */

export interface Faq {
  question: string;
  answer: string;
}

export const faqs: Faq[] = [
  {
    question: "How much does a custom shower enclosure cost?",
    answer:
      "Pricing varies based on size and hardware finish. Every project is different, so we provide free, no-obligation quotes tailored to your exact requirements — get in touch and we'll turn your enquiry around quickly.",
  },
  {
    question: "Do you supply only or do you install as well?",
    answer:
      "We are supply-only. We produce fully bespoke enclosures with detailed technical drawings and installation guides so your own fitter can install with confidence. We provide full technical support to your installer throughout the process.",
  },
  {
    question: "What areas do you cover?",
    answer:
      "We supply nationwide across the UK. Our survey team covers London and surrounding areas. For projects outside London, we can work from your measurements or recommend trusted local surveyors.",
  },
  {
    question: "How long does it take from order to delivery?",
    answer:
      "Lead times vary by order complexity, but most bespoke enclosures are ready within 2–4 weeks from survey sign-off. We'll give you a clear timeline when you book your survey.",
  },
  {
    question: "What glass do you use?",
    answer:
      "All our frameless enclosures are made with 10mm toughened safety glass — the premium choice for frameless installations. It's heavier, more rigid, and gives a much more substantial feel than thinner alternatives, while being fully compliant with BS EN 12150. We offer a range of hardware finishes including chrome, brushed nickel, matte black, brushed brass and gold.",
  },
  {
    question: "Can you work with awkward spaces like loft conversions or sloped ceilings?",
    answer:
      "Absolutely — bespoke is what we do. We regularly work with challenging spaces including loft conversions, sloped ceilings, alcoves, and non-standard layouts. Our online designer asks for the measurements an awkward space needs — how far a wall leans, where a ceiling drops — and checks them against each other before anything is made.",
  },
  {
    question: "Do you offer a warranty on your products?",
    answer:
      "Yes. All our enclosures come with a manufacturer's warranty covering glass and hardware. Full warranty terms are provided with every order.",
  },
  {
    question: "What is the difference between frameless and semi-frameless?",
    answer:
      "Frameless enclosures use thick toughened glass with minimal or concealed hardware — giving a clean, open look with no visible frame around the glass. Semi-frameless designs use thinner glass with a partial frame for structural support. Frameless is generally considered more premium and easier to clean.",
  },
];
