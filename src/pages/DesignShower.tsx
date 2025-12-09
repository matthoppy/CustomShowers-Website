import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const DesignShower = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 uppercase text-center">
              Design Your Shower
            </h1>
            <p className="text-xl text-muted-foreground text-center mb-12">
              Work with our experts to create your perfect bespoke frameless shower enclosure
            </p>
            
            <div className="bg-card border border-border p-8 md:p-12">
              <h2 className="text-2xl font-bold text-card-foreground mb-4">
                Our Design Process
              </h2>
              <div className="space-y-6 text-muted-foreground">
                <p>
                  At Bespoke Frameless Showers, we work closely with you to design the perfect shower enclosure for your space. Our experienced team will guide you through every step of the process.
                </p>
                <ul className="list-disc list-inside space-y-2">
                  <li>Initial consultation to understand your requirements</li>
                  <li>Professional on-site survey and measurements</li>
                  <li>Custom design tailored to your bathroom layout</li>
                  <li>Selection of glass thickness, finishes and hardware</li>
                  <li>Detailed quotation with no hidden costs</li>
                </ul>
                <p>
                  Contact us today to begin designing your dream shower enclosure.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default DesignShower;
