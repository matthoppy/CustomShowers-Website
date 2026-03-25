import { CheckCircle } from "lucide-react";
import aboutShower1 from "@/assets/about-shower-1.jpg";
import aboutShower2 from "@/assets/about-shower-2.jpg";

const About = () => {
  const features = [
    "Expert craftsmanship and design",
    "London based and operated",
    "Premium quality glass and materials",
    "Professional installation team",
  ];

  return (
    <section id="about" className="py-16 bg-primary">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Text Content */}
          <div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 uppercase">
              About Custom Showers
            </h2>
            <p className="text-base text-gray-300 mb-3 leading-relaxed">
              At Custom Showers, we design and supply premium frameless shower enclosures across the UK, with expert installation available throughout London.
            </p>
            <p className="text-base text-gray-300 mb-3 leading-relaxed">
              We work with homeowners, interior designers, and contractors to create bespoke glass solutions tailored to your exact space. From frameless shower screens to walk-in wet rooms, every piece is made to order using high-quality materials and precise fabrication.
            </p>
            <p className="text-base text-gray-300 mb-5 leading-relaxed">
              Whether you're looking for supply only or a full supply and install service in London, we offer a flexible approach to suit your project. You can use our online configurator to design your shower, or work with our team to bring your ideas to life.
            </p>
            
            {/* Features List */}
            <div className="grid sm:grid-cols-2 gap-3">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-white flex-shrink-0" />
                  <span className="text-white font-medium">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Images */}
          <div className="relative space-y-4">
            <img
              src={aboutShower1}
              alt="Bespoke frameless glass shower enclosure with gold trim and geometric tile flooring"
              className="w-full h-[400px] object-cover shadow-2xl"
            />
            <img
              src={aboutShower2}
              alt="Custom frameless shower installation with hexagonal tile design and black frame"
              className="w-full h-[400px] object-cover shadow-2xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
