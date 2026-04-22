const Star = () => (
  <svg className="w-5 h-5 fill-yellow-400 text-yellow-400" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

const testimonials = [
  {
    name: "James T.",
    location: "Islington, London",
    text: "Absolutely thrilled with our new frameless shower enclosure. The team was professional throughout — from the survey to installation. The glass quality is exceptional and it's completely transformed our bathroom.",
    project: "Frameless Walk-In Enclosure",
  },
  {
    name: "Sarah M.",
    location: "Chelsea, London",
    text: "We went supply-only and the technical drawings and installation instructions were so detailed that our fitter had no issues at all. The finished result looks incredible. Would highly recommend Custom Showers.",
    project: "Supply Only — Hinged Door Panel",
  },
  {
    name: "David & Rachel K.",
    location: "Wimbledon, London",
    text: "From the first call to the finished shower, the whole experience was seamless. They worked within our awkward loft space and the bespoke enclosure fits perfectly. Brilliant craftsmanship.",
    project: "Bespoke Corner Enclosure",
  },
  {
    name: "Priya N.",
    location: "Hampstead, London",
    text: "Competitive pricing compared to other London glaziers and the quality is far superior. The gold hardware finish we chose looks stunning. Very happy we went with Custom Showers.",
    project: "Frameless Screen with Brass Fixtures",
  },
  {
    name: "Tom W.",
    location: "Battersea, London",
    text: "Quick turnaround, great communication and the installation team left the bathroom spotless. Our walk-in shower is now the centrepiece of the whole bathroom. 10/10.",
    project: "Walk-In Frameless Screen",
  },
  {
    name: "Charlotte B.",
    location: "Fulham, London",
    text: "We've used Custom Showers twice now — once for our master bathroom and again after we renovated a second bathroom. Consistently excellent quality and service every time.",
    project: "Two Separate Installations",
  },
];

const Testimonials = () => {
  return (
    <section id="testimonials" className="py-24 bg-background">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 uppercase">
            What Our Clients Say
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Trusted by homeowners, interior designers and contractors across London
          </p>
          <div className="flex items-center justify-center gap-2 mt-6">
            {[...Array(5)].map((_, i) => <Star key={i} />)}
            <span className="text-muted-foreground text-sm ml-2">5.0 · Google Reviews</span>
          </div>
        </div>

        {/* Testimonial Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="bg-card border border-border p-7 flex flex-col gap-4"
            >
              {/* Stars */}
              <div className="flex gap-1">
                {[...Array(5)].map((_, s) => <Star key={s} />)}
              </div>

              {/* Quote */}
              <p className="text-muted-foreground leading-relaxed flex-1">
                "{t.text}"
              </p>

              {/* Author */}
              <div className="border-t border-border pt-4">
                <p className="font-semibold text-foreground">{t.name}</p>
                <p className="text-sm text-muted-foreground">{t.location}</p>
                <p className="text-xs text-primary font-medium mt-1 uppercase tracking-wide">
                  {t.project}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
