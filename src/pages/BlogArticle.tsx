import { useParams, Link } from "react-router-dom";
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";
import { blogArticles } from "../data/blogArticles";
import { Button } from "../components/ui/button";
import { useState } from "react";
import QuoteModal from "../components/QuoteModal";

// Minimal markdown-like renderer for the article content
// Handles: ## headings, **bold**, paragraphs, and blank-line separation
function renderContent(content: string) {
  const blocks = content.split(/\n\n+/);
  return blocks.map((block, i) => {
    if (block.startsWith("## ")) {
      return (
        <h2 key={i} className="text-2xl font-bold mt-10 mb-4">
          {block.replace(/^## /, "")}
        </h2>
      );
    }
    if (block.startsWith("**") && block.endsWith("**")) {
      return (
        <p key={i} className="font-semibold leading-relaxed mb-4">
          {block.replace(/\*\*/g, "")}
        </p>
      );
    }
    // Inline bold within paragraph
    const parts = block.split(/(\*\*[^*]+\*\*)/g);
    return (
      <p key={i} className="leading-relaxed mb-4 text-foreground/90">
        {parts.map((part, j) =>
          part.startsWith("**") && part.endsWith("**") ? (
            <strong key={j}>{part.replace(/\*\*/g, "")}</strong>
          ) : (
            part
          )
        )}
      </p>
    );
  });
}

const BlogArticle = () => {
  const { slug } = useParams<{ slug: string }>();
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);

  const article = blogArticles.find((a) => a.slug === slug);

  if (!article) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation onOpenQuote={() => setQuoteModalOpen(true)} />
        <main className="flex-grow container mx-auto px-6 py-32 text-center">
          <h1 className="text-3xl font-bold mb-4">Article Not Found</h1>
          <p className="text-muted-foreground mb-8">This article doesn't exist or may have moved.</p>
          <Button asChild>
            <Link to="/blog">Back to Blog</Link>
          </Button>
        </main>
        <Footer />
        <QuoteModal open={quoteModalOpen} onOpenChange={setQuoteModalOpen} />
      </div>
    );
  }

  const otherArticles = blogArticles.filter((a) => a.slug !== slug).slice(0, 3);

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation onOpenQuote={() => setQuoteModalOpen(true)} />

      {/* Article Header */}
      <section className="bg-primary text-primary-foreground pt-32 pb-14 px-6">
        <div className="container mx-auto max-w-3xl">
          <Link
            to="/blog"
            className="text-primary-foreground/60 hover:text-primary-foreground text-sm mb-6 inline-block transition-colors"
          >
            ← Back to Blog
          </Link>
          <div className="flex flex-wrap items-center gap-3 mb-4 text-sm text-primary-foreground/70">
            <span>{article.category}</span>
            <span>·</span>
            <span>{article.date}</span>
            <span>·</span>
            <span>{article.readTime}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black leading-tight">{article.title}</h1>
        </div>
      </section>

      {/* Article Body */}
      <main className="flex-grow py-16 px-6">
        <div className="container mx-auto max-w-3xl">
          <div className="prose prose-gray max-w-none">{renderContent(article.content)}</div>

          {/* CTA */}
          <div className="mt-16 p-8 bg-muted/50 rounded-2xl text-center border border-border">
            <h3 className="text-xl font-bold mb-3">Have a project in mind?</h3>
            <p className="text-muted-foreground mb-6">
              Get in touch for a quote — supply only nationwide or supply and fit across London.
            </p>
            <Button onClick={() => setQuoteModalOpen(true)}>Get A Quote</Button>
          </div>

          {/* Other Articles */}
          {otherArticles.length > 0 && (
            <div className="mt-20">
              <h2 className="text-2xl font-bold mb-8">More Articles</h2>
              <div className="grid sm:grid-cols-2 gap-6">
                {otherArticles.map((a) => (
                  <Link
                    key={a.slug}
                    to={`/blog/${a.slug}`}
                    className="block p-6 border border-border rounded-xl hover:border-primary/40 hover:shadow-sm transition-all duration-200"
                  >
                    <span className="text-xs text-muted-foreground font-medium">{a.category}</span>
                    <h3 className="font-semibold mt-2 mb-2 leading-snug hover:text-primary transition-colors">
                      {a.title}
                    </h3>
                    <span className="text-sm text-muted-foreground">{a.readTime}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
      <QuoteModal open={quoteModalOpen} onOpenChange={setQuoteModalOpen} />
    </div>
  );
};

export default BlogArticle;
