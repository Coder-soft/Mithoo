import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface Article {
  id: string;
  title: string;
  content: string | null;
  status: string;
  word_count: number | null;
  research_data?: any;
  created_at: string;
  updated_at: string;
}

export const useArticle = () => {
  const { user } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchArticles();
    }
  }, [user]);

  const fetchArticles = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setArticles(data || []);
    } catch (error) {
      console.error('Error fetching articles:', error);
      toast.error('Failed to load articles');
    } finally {
      setLoading(false);
    }
  };

  const createArticle = async (title: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('articles')
        .insert({
          title,
          content: '',
          user_id: user.id,
          status: 'draft'
        })
        .select()
        .single();

      if (error) throw error;
      
      setArticles(prev => [data, ...prev]);
      toast.success('Article created successfully');
      return data;
    } catch (error) {
      console.error('Error creating article:', error);
      toast.error('Failed to create article');
    }
  };

  const updateArticle = async (id: string, updates: Partial<Article>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('articles')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setArticles(prev => prev.map(article => 
        article.id === id ? { ...article, ...data } : article
      ));
      
      return data;
    } catch (error) {
      console.error('Error updating article:', error);
      toast.error('Failed to update article');
    }
  };

  const deleteArticle = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('articles')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setArticles(prev => prev.filter(article => article.id !== id));
      
      toast.success('Article deleted successfully');
    } catch (error) {
      console.error('Error deleting article:', error);
      toast.error('Failed to delete article');
    }
  };

  return {
    articles,
    loading,
    createArticle,
    updateArticle,
    deleteArticle,
    fetchArticles,
  };
};