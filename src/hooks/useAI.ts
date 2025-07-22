import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "./useAuth";

export const useAI = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const chatWithAI = async (message: string, conversationId?: string, articleId?: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: { message, conversationId, articleId, userId: user?.id }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error in AI chat:', error);
      toast.error('Failed to get AI response');
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
      console.error('Error in AI research:', error);
      toast.error('Failed to complete research');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const generateArticle = async (title: string, outline?: string, researchData?: string, articleId?: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-generate-article', {
        body: { title, outline, researchData, articleId, action: 'generate', userId: user?.id }
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

  const improveArticle = async (title: string, content: string, articleId?: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-generate-article', {
        body: { title, outline: content, articleId, action: 'improve', userId: user?.id }
      });

      if (error) throw error;
      toast.success('Article improved successfully');
      return data;
    } catch (error) {
      console.error('Error improving article:', error);
      toast.error('Failed to improve article');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const fineTuneModel = async (trainingData: string, modelName?: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-fine-tune', {
        body: { trainingData, modelName, userId: user?.id }
      });

      if (error) throw error;
      toast.success('Fine-tuning completed successfully');
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
    chatWithAI,
    researchTopic,
    generateArticle,
    improveArticle,
    fineTuneModel,
  };
};