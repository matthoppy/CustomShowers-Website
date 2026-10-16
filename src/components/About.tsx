import { CheckCircle } from "lucide-react";
import aboutShower1 from "@/assets/about-shower-1.jpg";
import aboutShower2 from "@/assets/about-shower-2.jpg";

const About = () => {
  const features = [
    "Expert craftsmanship and design",
    "London based and operated",
    "Premium quality glass and materials",
    "Professional survey and technical support",
  ];

  return (
    <section id="about" className="py-14 bg-primary">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Text Content */}
          <div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 uppercase">
              About Custom Showers
            </h2>
            <p className="text-base text-gray-300 mb-3 leading-relaxed">
              At Custom Showers, we specialise in the design and supply of premium frameless shower enclosures across the UK.
            </p>
            <p className="text-base text-gray-300 mb-3 leading-relaxed">
              We work closely with homeowners, interior designers, and contractors to create stunning bespoke glass solutions tailored to your exact specifications. From frameless shower screens to walk-in wet rooms, every product is crafted to the highest standards using premium quality materials.
            </p>
            <p className="text-base text-gray-300 mb-5 leading-relaxed">
              We offer nationwide supply with detailed technical drawings and installation guides. Your own fitter installs with confidence, while we provide ongoing technical support throughout the process.
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
          <div className="grid grid-cols-2 gap-3">
            <img
              src={aboutShower1}
              alt="Bespoke frameless glass shower enclosure with gold trim and geometric tile flooring"
              className="w-full h-[220px] object-cover shadow-2xl"
            />
            <img
              src={aboutShower2}
              alt="Custom frameless shower installation with hexagonal tile design and black frame"
              className="w-full h-[220px] object-cover shadow-2xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
