import { Link } from "react-router-dom";
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";
import { blogArticles } from "../data/blogArticles";
import { useState } from "react";
import QuoteModal from "../components/QuoteModal";

const categoryColours: Record<string, string> = {
  "Buying Guide": "bg-blue-100 text-blue-800",
  "How-To": "bg-green-100 text-green-800",
  Materials: "bg-purple-100 text-purple-800",
  Maintenance: "bg-amber-100 text-amber-800",
};

const Blog = () => {
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation onOpenQuote={() => setQuoteModalOpen(true)} />

      {/* Header */}
      <section className="bg-primary text-primary-foreground pt-32 pb-16 px-6">
        <div className="container mx-auto max-w-4xl text-center">
          <p className="text-secondary uppercase tracking-widest text-sm font-semibold mb-4">
            Guides &amp; Advice
          </p>
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-wider mb-4">
            The Custom Showers Blog
          </h1>
          <p className="text-primary-foreground/80 text-lg max-w-xl mx-auto">
            Practical guides on frameless shower enclosures — from choosing glass to keeping it clean.
          </p>
        </div>
      </section>

      {/* Article List */}
      <section className="py-20 px-6 bg-background flex-grow">
        <div className="container mx-auto max-w-4xl">
          <div className="divide-y divide-border">
            {blogArticles.map((article) => (
              <article key={article.slug} className="py-10 first:pt-0">
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      categoryColours[article.category] ?? "bg-muted text-muted-foreground"
                    }`}
                  >
                    {article.category}
                  </span>
                  <span className="text-sm text-muted-foreground">{article.date}</span>
                  <span className="text-muted-foreground/40 hidden sm:block">·</span>
                  <span className="text-sm text-muted-foreground">{article.readTime}</span>
                </div>
                <Link to={`/blog/${article.slug}`} className="group">
                  <h2 className="text-xl md:text-2xl font-bold mb-3 group-hover:text-primary transition-colors duration-200">
                    {article.title}
                  </h2>
                </Link>
                <p className="text-muted-foreground leading-relaxed mb-4">{article.excerpt}</p>
                <Link
                  to={`/blog/${article.slug}`}
                  className="text-primary font-medium hover:underline text-sm"
                >
                  Read article →
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <Footer />
      <QuoteModal open={quoteModalOpen} onOpenChange={setQuoteModalOpen} />
    </div>
  );
};

export default Blog;
