import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "./useAuth";

const SUPABASE_URL = "https://xnpvixeywrkcnpkqgkjh.supabase.co";

export const useAI = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const streamChatWithAI = async (
    message: string,
    conversationId: string | null,
    articleId: string | null,
    articleMarkdown: string | undefined,
    onChunk: (chunk: string) => void,
    onComplete: (fullMessage: string, newConversationId: string) => void,
    onError: () => void
  ) => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ message, conversationId, articleId, userId: user?.id, articleMarkdown }),
      });

      if (!response.ok || !response.body) {
        const errorBody = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorBody}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullMessage = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          try {
            let assistantMessageToSave = fullMessage;
            const jsonMatch = fullMessage.match(/```json\s*([\s\S]*?)\s*```/);
            const jsonString = jsonMatch ? jsonMatch[1] : fullMessage;
            
            try {
              const parsed = JSON.parse(jsonString);
              if (parsed.explanation) {
                assistantMessageToSave = parsed.explanation;
              }
            } catch (e) {
              // Not a JSON response
            }

            const { data: saveData, error: saveError } = await supabase.functions.invoke('save-chat-message', {
              body: { conversationId, userMessage: message, assistantMessage: assistantMessageToSave, articleId }
            });

            if (saveError) throw saveError;
            
            onComplete(fullMessage, saveData.conversationId);

          } catch (saveError) {
            console.error("Error saving conversation:", saveError);
            toast.error("Could not save conversation history.");
            onError();
          }
          break;
        }
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const json = JSON.parse(line.substring(6));
              if (json.candidates && json.candidates[0].content.parts[0].text) {
                const textChunk = json.candidates[0].content.parts[0].text;
                fullMessage += textChunk;
                onChunk(textChunk);
              }
            } catch (e: unknown) {
              // Incomplete JSON, ignore
            }
          }
        }
      }
    } catch (e: unknown) {
      const error = e instanceof Error ? e : new Error('An unknown error occurred');
      setError(error);
      console.error(e);
      toast.error(error.message);
      onError();
    } finally {
      setLoading(false);
    }
  };

  const generateArticle = async (title: string, outline?: string, researchData?: any, articleId?: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-generate-article', {
        body: { title, outline, researchData, articleId, userId: user?.id }
      });

      if (error) throw error;
      toast.success('Article generated successfully');
      return data;
    } catch (error) {
      console.error('Error generating article:', error);
      toast.error('Failed to generate article');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const researchTopic = async (topic: string, keywords: string[], articleId?: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-research', {
        body: { topic, keywords, articleId, userId: user?.id }
      });

      if (error) throw error;
      toast.success('Research completed successfully');
      return data;
    } catch (error) {
      console.error('Error researching topic:', error);
      toast.error('Failed to research topic');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const fineTuneModel = async (trainingData: string, modelName: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-fine-tune', {
        body: { trainingData, modelName, userId: user?.id }
      });

      if (error) throw error;
      toast.success('Fine-tuning started successfully');
      return data;
    } catch (error) {
      console.error('Error fine-tuning model:', error);
      toast.error('Failed to fine-tune model');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    streamChatWithAI,
    researchTopic,
    generateArticle,
    fineTuneModel,
  };
};