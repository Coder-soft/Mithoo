import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LiveSearchDemo } from "@/components/LiveSearchDemo";

const SimpleLanding = () => {
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
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-900 text-white">
      <header className="py-4 px-6 md:px-10 sticky top-0 z-50 bg-gray-900/80 backdrop-blur-sm border-b border-gray-700/50">
        <div className="container mx-auto flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-xl">🦜</span>
            </div>
            <h1 className="text-2xl font-bold">Mithoo</h1>
          </Link>
          <Button asChild variant="outline" className="border-gray-600 hover:bg-gray-800 hover:text-white">
            <Link to="/login">Sign In</Link>
          </Button>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center py-16 md:py-24">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-6xl font-bold max-w-4xl mx-auto bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            AI-Powered Research, Simplified.
          </h1>
          <p className="mt-6 text-lg md:text-xl max-w-2xl mx-auto text-gray-400">
            Enter a topic below to see our AI in action. Get a concise summary and a list of sources instantly.
          </p>
          <div className="mt-12">
            <LiveSearchDemo />
          </div>
        </div>
      </main>

      <footer className="py-6">
        <div className="container mx-auto text-center">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} Mithoo. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default SimpleLanding;
