import { useState } from 'react';
import { useAI } from '@/hooks/useAI';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Search, Loader, FileText, Link as LinkIcon } from 'lucide-react';

export const LiveSearchDemo = () => {
  const [topic, setTopic] = useState('');
  const { researchTopic, loading } = useAI();
  const [result, setResult] = useState<{ summary: string; sources: { title: string; url: string }[] } | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    setResult(null);
    try {
      const researchResult = await researchTopic(topic, []);
      // The actual result structure might be different.
      // Assuming it returns an object with summary and sources based on the hook
      if (researchResult && researchResult.summary) {
        setResult(researchResult);
      } else {
        // Handle cases where the result is not as expected
        console.warn("Research result format is unexpected:", researchResult);
        // You might want to set a default or error message here
      }
    } catch (error) {
      console.error("Failed to perform research:", error);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-2xl bg-gray-900/80 backdrop-blur-sm border-gray-700">
      <CardHeader>
        <CardTitle className="text-center text-2xl font-bold text-gray-100">Live AI-Powered Research</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSearch} className="flex w-full items-center space-x-2 mb-6">
          <Input
            type="text"
            placeholder="Enter a research topic to see it in action..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="bg-gray-800 border-gray-600 text-gray-200 placeholder:text-gray-500 ring-offset-gray-900 focus-visible:ring-blue-500"
          />
          <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
            {loading ? <Loader className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </form>

        {loading && (
          <div className="flex flex-col items-center justify-center p-8 text-gray-400">
            <Loader className="h-10 w-10 animate-spin mb-4 text-blue-500" />
            <p className="text-lg">Researching topic...</p>
            <p className="text-sm">Please wait while we gather information.</p>
          </div>
        )}

        {result && (
          <div className="space-y-6 text-gray-200 animate-fade-in">
            <div>
              <h3 className="text-xl font-semibold mb-2 flex items-center text-blue-400">
                <FileText className="h-5 w-5 mr-2" />
                Research Summary
              </h3>
              <p className="text-gray-300 leading-relaxed">{result.summary}</p>
            </div>
            {result.sources && result.sources.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold mb-2 flex items-center text-blue-400">
                  <LinkIcon className="h-5 w-5 mr-2" />
                  Sources
                </h3>
                <ul className="space-y-2 list-disc list-inside">
                  {result.sources.map((source, index) => (
                    <li key={index}>
                      <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                        {source.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
