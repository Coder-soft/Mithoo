import { Link } from "react-router-dom";
import { PenTool } from "lucide-react";
import { Button } from "@/components/ui/button";

export const LandingHeader = () => {
  return (
    <header className="absolute top-0 left-0 right-0 z-50 py-4 px-6 md:px-10">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <PenTool className="w-4 h-4 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Mithoo</h1>
        </Link>
        <div className="flex items-center space-x-4">
          <Button asChild variant="ghost">
            <Link to="/login">Log In</Link>
          </Button>
          <Button asChild>
            <Link to="/login">Get Started</Link>
          </Button>
        </div>
      </div>
    </header>
  );
};