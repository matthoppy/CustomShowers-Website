const steps = [
  {
    number: "01",
    title: "Survey & Consultation",
    description:
      "We visit your site at a time that suits you. Our surveyor takes precise measurements, discusses your vision, and advises on hardware finishes and design options.",
  },
  {
    number: "02",
    title: "Design & Quote",
    description:
      "We produce detailed technical drawings and a clear, itemised quote same day. No hidden costs — everything is specified upfront before you commit.",
  },
  {
    number: "03",
    title: "Bespoke Manufacture",
    description:
      "Your enclosure is precision-cut and manufactured to your exact specifications using 10mm toughened safety glass. Lead time is typically 2–4 weeks.",
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
    <section id="process" className="py-14 bg-primary">
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
            <div key={i} className="relative z-10">
              <div className="text-5xl font-bold text-white/20 mb-4 leading-none">
                {step.number}
              </div>
              <h3 className="text-lg font-bold text-white mb-3">{step.title}</h3>
              <p className="text-white/70 leading-relaxed text-sm">{step.description}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default Process;
