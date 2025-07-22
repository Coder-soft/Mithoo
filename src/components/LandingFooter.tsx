import { PenTool } from "lucide-react";
import { Link } from "react-router-dom";

export const LandingFooter = () => {
  return (
    <footer className="bg-muted/50 border-t border-border">
      <div className="container mx-auto py-8 px-6 md:px-10">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <PenTool className="w-4 h-4 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold text-foreground">Mithoo</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Mithoo. All rights reserved. Probably.
          </p>
          <div className="flex items-center space-x-4">
            <Link to="#" className="text-sm text-muted-foreground hover:text-foreground">
              Terms of Service
            </Link>
            <Link to="#" className="text-sm text-muted-foreground hover:text-foreground">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};