import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { LandingHeader } from "@/components/LandingHeader";
import { LandingFooter } from "@/components/LandingFooter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Rabbit, Carrot, Sparkles } from "lucide-react";

const BunnyLanding = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/app");
    }
  }, [user, navigate]);

  if (loading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-100 to-blue-200">
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-2 text-gray-700">Hopping in...</h2>
          <p className="text-muted-foreground">Just a moment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-pink-100 to-blue-200 text-gray-800 font-sans">
      <LandingHeader />
      <main>
        {/* Hero Section */}
        <section className="relative h-screen flex items-center justify-center text-center overflow-hidden">
          <div className="absolute inset-0 bg-grid-pink-200/30 [mask-image:linear-gradient(to_bottom,white_0%,transparent_100%)]"></div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="z-10 container mx-auto px-6"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 260, damping: 20 }}
            >
              <span className="text-6xl md:text-8xl" role="img" aria-label="bunny">🐰</span>
            </motion.div>
            <h1 className="text-5xl md:text-7xl font-bold mt-4 bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-blue-500">
              Hop into Awesome!
            </h1>
            <p className="mt-6 text-lg md:text-xl max-w-3xl mx-auto text-gray-600">
              Our AI-powered bunny assistant will help you create amazing things. It's like magic, but with more fluff.
            </p>
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.9 }}
              className="mt-8"
            >
              <Button asChild size="lg" className="bg-pink-500 hover:bg-pink-600 text-white rounded-full px-8 py-4 text-lg font-semibold shadow-lg transition-transform transform hover:-translate-y-1">
                <Link to="/login">
                  Let's Go!
                  <Carrot className="ml-2 h-6 w-6" />
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </section>

        {/* Features Section */}
        <section className="py-20 md:py-32 bg-white/50">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800">What's Hoppening?</h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Here's a sneak peek at our bunny's amazing tricks.
            </p>
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
              <motion.div whileHover={{ y: -10 }}>
                <Card className="bg-white/80 border-2 border-pink-200 rounded-2xl shadow-lg hover:shadow-2xl transition-shadow">
                  <CardHeader>
                    <div className="mx-auto w-16 h-16 rounded-full bg-pink-200/50 flex items-center justify-center">
                      <Rabbit className="w-8 h-8 text-pink-500" />
                    </div>
                    <CardTitle className="mt-4 text-2xl font-bold text-gray-800">Speedy Research</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">
                      Our bunny hops around the web to find you the best info in a flash.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div whileHover={{ y: -10 }}>
                <Card className="bg-white/80 border-2 border-blue-200 rounded-2xl shadow-lg hover:shadow-2xl transition-shadow">
                  <CardHeader>
                    <div className="mx-auto w-16 h-16 rounded-full bg-blue-200/50 flex items-center justify-center">
                      <Sparkles className="w-8 h-8 text-blue-500" />
                    </div>
                    <CardTitle className="mt-4 text-2xl font-bold text-gray-800">Creative Magic</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">
                      Watch as our bunny pulls creative ideas out of its hat (or ears!).
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div whileHover={{ y: -10 }}>
                <Card className="bg-white/80 border-2 border-yellow-200 rounded-2xl shadow-lg hover:shadow-2xl transition-shadow">
                  <CardHeader>
                    <div className="mx-auto w-16 h-16 rounded-full bg-yellow-200/50 flex items-center justify-center">
                      <Carrot className="w-8 h-8 text-yellow-500" />
                    </div>
                    <CardTitle className="mt-4 text-2xl font-bold text-gray-800">Personalized Touch</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">
                      Our bunny learns your style and adds a personal touch to everything.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-20 md:py-32">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-blue-500">Ready to Hop In?</h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Join the fun and let our bunny assistant make your life easier.
            </p>
            <motion.div
              whileHover={{ scale: 1.1, rotate: -5 }}
              whileTap={{ scale: 0.9 }}
              className="mt-8"
            >
              <Button asChild size="lg" className="bg-blue-500 hover:bg-blue-600 text-white rounded-full px-8 py-4 text-lg font-semibold shadow-lg transition-transform transform hover:-translate-y-1">
                <Link to="/login">
                  Get Started for Free
                  <Sparkles className="ml-2 h-6 w-6" />
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

export default BunnyLanding;