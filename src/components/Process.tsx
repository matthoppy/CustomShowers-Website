const steps = [
  {
    number: "01",
    title: "Survey & Consultation",
    description:
      "We visit your site at a time that suits you. Our surveyor takes precise measurements, discusses your vision, and advises on hardware finishes and design options.",
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
        <div className="flex justify-center max-w-6xl mx-auto">
          {steps.map((step, i) => (
            <div key={i} className="relative">
              {/* Connector line (desktop) */}
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-full w-full h-px bg-white/20 z-0" />
              )}

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

      </div>
    </section>
  );
};

export default Process;
