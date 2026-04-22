import { useState } from "react";
import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Process from "@/components/Process";
import Services from "@/components/Services";
import Gallery from "@/components/Gallery";
import BalustradesSection from "@/components/BalustradesSection";
import FAQ from "@/components/FAQ";
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
      <Process />
      <Services />
      <Gallery />
      <BalustradesSection />
      <FAQ />
      <Contact />
      <Footer />
      <QuoteModal open={quoteModalOpen} onOpenChange={setQuoteModalOpen} />
    </div>
  );
};

export default Index;
