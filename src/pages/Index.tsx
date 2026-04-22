import { useState } from "react";
import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Services from "@/components/Services";
import Gallery from "@/components/Gallery";
import BalustradesSection from "@/components/BalustradesSection";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import QuoteModal from "@/components/QuoteModal";

const Index = () => {
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <Navigation onOpenQuote={() => setQuoteModalOpen(true)} />
      <Hero onOpenQuote={() => setQuoteModalOpen(true)} />
      <About />
      <Services />
      <Gallery />
      <BalustradesSection />
      <Contact />
      <Footer />
      <QuoteModal open={quoteModalOpen} onOpenChange={setQuoteModalOpen} />
    </div>
  );
};

export default Index;
