import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "./useAuth";

export const useAI = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const getConversation = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('messages')
        .eq('id', conversationId)
        .single();
      
      if (error) throw error;
      return data?.messages || [];
    } catch (error) {
      console.error('Error fetching conversation:', error);
      return [];
    }
  };

  const chatWithAI = async (message: string, conversationId?: string, articleId?: string, articleMarkdown?: string, enableSearch?: boolean) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: { message, conversationId, articleId, userId: user?.id, articleMarkdown, enableSearch }
      });

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error in AI chat:', error);
      const errorMessage = error.context?.details || 'An unknown error occurred. Please try again.';
      toast.error(`AI Chat Error: ${errorMessage}`);
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
    } catch (error: any) {
      console.error('Error in AI research:', error);
      const errorMessage = error.context?.details || 'An unknown error occurred. Please try again.';
      toast.error(`AI Research Error: ${errorMessage}`);
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
    } catch (error: any) {
      console.error('Error generating article:', error);
      const errorMessage = error.context?.details || 'An unknown error occurred. Please try again.';
      toast.error(`Article Generation Error: ${errorMessage}`);
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
    } catch (error: any) {
      console.error('Error improving article:', error);
      const errorMessage = error.context?.details || 'An unknown error occurred. Please try again.';
      toast.error(`Article Improvement Error: ${errorMessage}`);
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
    } catch (error: any) {
      console.error('Error fine-tuning model:', error);
      const errorMessage = error.context?.details || 'An unknown error occurred. Please try again.';
      toast.error(`Fine-Tuning Error: ${errorMessage}`);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    getConversation,
    chatWithAI,
    researchTopic,
    generateArticle,
    improveArticle,
    fineTuneModel,
  };
};