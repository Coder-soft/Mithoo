"use client";

import { AgenticChat } from "@/components/AgenticChat";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/contexts/SessionContext";
import { useNavigate } from "react-router-dom";

function IndexPage() {
  const { user }. = useSession();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto py-3 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">Gemini Agent</h1>
          {user && (
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 hidden sm:inline">{user.email}</span>
              <Button variant="outline" onClick={handleSignOut}>Sign Out</Button>
            </div>
          )}
        </div>
      </header>
      <main className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AgenticChat />
        </div>
      </main>
    </div>
  );
}

export default IndexPage;