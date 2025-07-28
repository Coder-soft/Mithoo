"use client";

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useSession } from '@/contexts/SessionContext';
import { Loader2, Bot, ListChecks } from 'lucide-react';

export function AgenticChat() {
  const { user } = useSession();
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [plan, setPlan] = useState<string[] | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || !user) return;

    setIsLoading(true);
    setPlan(null);
    setResult(null);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('ai-agent', {
        body: { prompt, userId: user.id },
      });

      if (functionError) throw functionError;
      if (data.error) throw new Error(data.error);

      setPlan(data.plan);
      setResult(data.finalResult);
    } catch (err: any) {
      console.error("Error invoking function:", err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl">Agentic Chat</CardTitle>
        <CardDescription>Give the AI a goal, and it will create and execute a plan to achieve it.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="flex w-full items-center space-x-2">
            <Input
              type="text"
              placeholder="e.g., Research and write a blog post about the future of AI."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isLoading}
              className="text-base"
            />
            <Button type="submit" disabled={isLoading || !prompt.trim()} size="lg">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isLoading ? 'Working...' : 'Start Agent'}
            </Button>
          </div>
        </form>
        {error && (
          <div className="mt-4 text-red-600 bg-red-50 p-3 rounded-md">
            <p><strong>Error:</strong> {error}</p>
          </div>
        )}
      </CardContent>
      {(isLoading || plan || result) && (
        <CardFooter className="flex flex-col items-start gap-6 pt-4">
          {isLoading && !plan && (
             <div className="flex items-center text-gray-500"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Thinking...</div>
          )}
          {plan && (
            <div className="w-full">
              <h3 className="font-semibold mb-2 flex items-center text-lg"><ListChecks className="mr-2 h-5 w-5 text-blue-500" /> Plan</h3>
              <ul className="list-decimal list-inside bg-gray-50 p-4 rounded-md border space-y-2">
                {plan.map((step, index) => (
                  <li key={index} className="text-gray-700">{step}</li>
                ))}
              </ul>
            </div>
          )}
          {result && (
            <div className="w-full">
              <h3 className="font-semibold mb-2 flex items-center text-lg"><Bot className="mr-2 h-5 w-5 text-green-500" /> Result</h3>
              <div className="prose prose-sm max-w-none p-4 bg-gray-50 rounded-md border whitespace-pre-wrap text-gray-800">
                {result}
              </div>
            </div>
          )}
        </CardFooter>
      )}
    </Card>
  );
}