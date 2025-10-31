import { CheckCircle } from "lucide-react";
import aboutImage from "@/assets/about-image.jpg";

const About = () => {
  const features = [
    "Over 15 years of industry experience",
    "Australian owned and operated",
    "Premium quality materials",
    "Expert installation team",
    "Competitive pricing",
    "Full warranty coverage",
  ];

  return (
    <section id="about" className="py-24 bg-secondary">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <div>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6 uppercase">
              About Balustrading Concepts
            </h2>
            <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
              We are a leading provider of premium glass balustrading solutions in Australia. Our team specializes in designing, manufacturing, and installing high-quality frameless glass systems for residential and commercial projects.
            </p>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              With a commitment to excellence and attention to detail, we deliver stunning results that enhance the aesthetic appeal and value of your property.
            </p>
            
            {/* Features List */}
            <div className="grid sm:grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-primary flex-shrink-0" />
                  <span className="text-foreground font-medium">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Image */}
          <div className="relative">
            <img
              src={aboutImage}
              alt="Quality glass balustrading craftsmanship"
              className="w-full h-[600px] object-cover shadow-2xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
