const stats = [
  { value: "100+", label: "Projects Completed" },
  { value: "10+", label: "Years Experience" },
  { value: "5★", label: "Google Rating" },
  { value: "UK", label: "Supply Nationwide" },
];

const Stats = () => {
  return (
    <section className="bg-background border-y border-border py-12">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto text-center">
          {stats.map((stat, i) => (
            <div key={i}>
              <div className="text-4xl font-bold text-primary mb-2">{stat.value}</div>
              <div className="text-sm text-muted-foreground uppercase tracking-widest font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Stats;
