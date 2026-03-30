import { useState } from "react";
import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Stats from "@/components/Stats";
import Process from "@/components/Process";
import Services from "@/components/Services";
import Gallery from "@/components/Gallery";
import Testimonials from "@/components/Testimonials";
import FAQ from "@/components/FAQ";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import QuoteModal from "@/components/QuoteModal";
import WhatsAppButton from "@/components/WhatsAppButton";

const Index = () => {
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <Navigation onOpenQuote={() => setQuoteModalOpen(true)} />
      <Hero onOpenQuote={() => setQuoteModalOpen(true)} />
      <About />
      <Stats />
      <Process />
      <Services />
      <Gallery />
      <Testimonials />
      <FAQ />
      <Contact />
      <Footer />
      <QuoteModal open={quoteModalOpen} onOpenChange={setQuoteModalOpen} />
      <WhatsAppButton />
    </div>
  );
};

export default Index;
