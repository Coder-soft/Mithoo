import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { LandingHeader } from "@/components/LandingHeader";
import { LandingFooter } from "@/components/LandingFooter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { ArrowRight, BrainCircuit, Feather, Zap } from "lucide-react";

const Landing = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/app");
    }
  }, [user, navigate]);

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
    <div className="bg-background text-foreground">
      <LandingHeader />
      <main>
        {/* Hero Section */}
        <section className="relative h-screen flex items-center justify-center text-center overflow-hidden">
          <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(to_bottom,white_0%,transparent_100%)]"></div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="z-10 container mx-auto px-6"
          >
            <h1 className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400 bg-opacity-50">
              Your AI buddy who's... trying its best.
            </h1>
            <p className="mt-6 text-lg md:text-xl max-w-3xl mx-auto text-muted-foreground">
              Mithoo turns your chaotic brain-dumps into coherent articles. It's like having a writing partner who's had one too many espressos.
            </p>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="mt-8"
            >
              <Button asChild size="lg">
                <Link to="/login">
                  Start Writing (No Credit Card, We Promise)
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </section>

        {/* Features Section */}
        <section className="py-20 md:py-32 bg-muted/30">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold">What does this thing even do?</h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Good question. Here's the gist of it.
            </p>
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card>
                <CardHeader>
                  <div className="mx-auto w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <BrainCircuit className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="mt-4">Researches Like a Maniac</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Unleash Mithoo on the internet. It'll come back with facts, figures, and probably a few cat videos. We're filtering those out. Mostly.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <div className="mx-auto w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Feather className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="mt-4">Writes Like a Poet</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    ...a very confused poet. But it gets the job done! It crafts articles that sound surprisingly human, for a bunch of code.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <div className="mx-auto w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Zap className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="mt-4">Learns Your Vibe</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Feed it your writing, and it'll start to mimic your style. Yes, even your questionable use of semicolons. It's a fast learner.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* How it works Section */}
        <section className="py-20 md:py-32">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold">The Super Complicated Process</h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              It's so simple, it's almost suspicious.
            </p>
            <div className="mt-12 max-w-4xl mx-auto relative">
              <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-border -translate-x-1/2 hidden md:block"></div>
              <div className="space-y-16">
                <div className="md:flex items-center gap-8">
                  <div className="md:w-1/2 md:text-right">
                    <h3 className="text-2xl font-semibold">1. Dump Your Brain</h3>
                    <p className="mt-2 text-muted-foreground">
                      Got a title? A vague idea? A single keyword? Perfect. That's all Mithoo needs to get started. Low standards are our specialty.
                    </p>
                  </div>
                  <div className="hidden md:block w-8 h-8 rounded-full bg-primary text-primary-foreground flex-shrink-0 flex items-center justify-center">1</div>
                  <div className="md:w-1/2"></div>
                </div>
                <div className="md:flex items-center gap-8">
                  <div className="md:w-1/2"></div>
                  <div className="hidden md:block w-8 h-8 rounded-full bg-primary text-primary-foreground flex-shrink-0 flex items-center justify-center">2</div>
                  <div className="md:w-1/2 md:text-left">
                    <h3 className="text-2xl font-semibold">2. Press The "Magic" Button</h3>
                    <p className="mt-2 text-muted-foreground">
                      Okay, it says "Generate," but "Magic" sounds better. Watch as Mithoo frantically writes, deletes, and rewrites your article.
                    </p>
                  </div>
                </div>
                <div className="md:flex items-center gap-8">
                  <div className="md:w-1/2 md:text-right">
                    <h3 className="text-2xl font-semibold">3. Take All The Credit</h3>
                    <p className="mt-2 text-muted-foreground">
                      Voilà! A beautiful article appears. Edit it, publish it, and tell everyone you wrote it yourself. We won't tell. Our lips are sealed. We don't have lips.
                    </p>
                  </div>
                  <div className="hidden md:block w-8 h-8 rounded-full bg-primary text-primary-foreground flex-shrink-0 flex items-center justify-center">3</div>
                  <div className="md:w-1/2"></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-20 md:py-32 bg-muted/30">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold">Ready to Procrastinate Productively?</h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Stop staring at a blank page. Let our slightly-unhinged AI do it for you.
            </p>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="mt-8"
            >
              <Button asChild size="lg">
                <Link to="/login">
                  Get Started for Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </motion.div>
          </div>
        </section>
      </main>
      <LandingFooter />
    </div>
  );
};

export default Landing;