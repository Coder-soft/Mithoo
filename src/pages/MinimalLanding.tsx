import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { PenTool, ArrowRight } from "lucide-react";
import FeatureShowcase from "@/components/FeatureShowcase";

const MinimalLanding = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/app");
    }
  }, [user, navigate]);

  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-2">Loading...</h2>
          <p className="text-muted-foreground">Just a moment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="py-4 px-6 md:px-10 sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border/20">
        <div className="container mx-auto flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <PenTool className="w-4 h-4 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold text-foreground">Mithoo</h1>
          </Link>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={scrollToFeatures}>Features</Button>
            <Button asChild className="transition-all duration-300">
              <Link to="/login" className="hover:text-primary-foreground hover:no-underline">Sign In</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        <section className="flex items-center justify-center py-24 md:py-32">
          <div className="container mx-auto px-6 text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground max-w-4xl mx-auto">
              Effortless Article Creation, Powered by AI
            </h1>
            <p className="mt-6 text-lg md:text-xl max-w-2xl mx-auto text-muted-foreground">
              From research to final draft, Mithoo is your intelligent writing partner. Streamline your content creation process and publish faster.
            </p>
            <div className="mt-8">
              <Button asChild size="lg" className="transition-all duration-300">
                <Link to="/login" className="hover:text-primary-foreground hover:no-underline">
                  Sign In
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
        
        <FeatureShowcase />

      </main>

      <footer className="py-6 bg-muted/30">
        <div className="container mx-auto text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Mithoo. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default MinimalLanding;