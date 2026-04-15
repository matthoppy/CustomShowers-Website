const steps = [
  {
    number: "01",
    title: "Free Survey & Consultation",
    description:
      "We visit your site at a time that suits you. Our surveyor takes precise measurements, discusses your vision, and advises on glass thickness, hardware finishes, and design options.",
  },
  {
    number: "02",
    title: "Design & Quote",
    description:
      "We produce detailed technical drawings and a clear, itemised quote within 48 hours. No hidden costs — everything is specified upfront before you commit.",
  },
  {
    number: "03",
    title: "Bespoke Manufacture",
    description:
      "Your enclosure is precision-cut and manufactured to your exact specifications using 10mm toughened safety glass. Lead time is typically 3–5 weeks.",
  },
  {
    number: "04",
    title: "Professional Installation",
    description:
      "Our experienced team installs your enclosure to the highest standard. We leave your bathroom spotless and walk you through everything before we go.",
  },
];

const Process = () => {
  return (
    <section id="process" className="py-24 bg-primary">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 uppercase">
            How It Works
          </h2>
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            From first contact to finished installation — a simple, stress-free process
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {steps.map((step, i) => (
            <div key={i} className="relative">

              <div className="relative z-10">
                {/* Number */}
                <div className="text-5xl font-bold text-white/20 mb-4 leading-none">
                  {step.number}
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-white mb-3">{step.title}</h3>

                {/* Description */}
                <p className="text-white/70 leading-relaxed text-sm">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <a
            href="#contact"
            className="inline-block bg-white text-primary px-10 py-4 font-bold uppercase tracking-widest text-sm hover:bg-white/90 transition-colors"
          >
            Book Your Free Survey
          </a>
        </div>
      </div>
    </section>
  );
};

export default Process;
