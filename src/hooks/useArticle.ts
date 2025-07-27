import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface Article {
  id: string;
  title: string;
  content: string | null;
  status: string;
  word_count: number | null;
  research_data?: unknown;
  created_at: string;
  updated_at: string;
  user_id: string;
}

// --- LocalStorage Helper Functions ---

const getPendingUpdate = (articleId: string): Partial<Article> | null => {
  const pendingUpdateJson = localStorage.getItem(`pending-article-update-${articleId}`);
  return pendingUpdateJson ? JSON.parse(pendingUpdateJson) : null;
};

const setPendingUpdate = (articleId: string, updates: Partial<Article>) => {
  const existingUpdates = getPendingUpdate(articleId) || {};
  localStorage.setItem(`pending-article-update-${articleId}`, JSON.stringify({ ...existingUpdates, ...updates }));
};

const clearPendingUpdate = (articleId: string) => {
  localStorage.removeItem(`pending-article-update-${articleId}`);
};

const markForDeletion = (articleId: string) => {
  localStorage.setItem(`pending-article-delete-${articleId}`, 'true');
};

const unmarkForDeletion = (articleId: string) => {
  localStorage.removeItem(`pending-article-delete-${articleId}`);
};

const isMarkedForDeletion = (articleId: string): boolean => {
  return localStorage.getItem(`pending-article-delete-${articleId}`) === 'true';
};


export const useArticle = () => {
  const { user } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchArticles = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      
      const fetchedArticles = data || [];

      // Filter out articles marked for deletion and apply pending updates
      const processedArticles = fetchedArticles
        .filter(article => !isMarkedForDeletion(article.id))
        .map(article => {
          const pendingUpdate = getPendingUpdate(article.id);
          return pendingUpdate ? { ...article, ...pendingUpdate } : article;
        });

      setArticles(processedArticles);
    } catch (error) {
      console.error('Error fetching articles:', error);
      toast.error('Failed to load articles');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const updateArticle = useCallback(async (id: string, updates: Partial<Article>, isSyncing = false): Promise<Article | undefined> => {
    if (!user) return undefined;

    const articleToUpdate = articles.find(a => a.id === id);
    // If article is not in state, it might be a new article that failed to create.
    // We proceed to create a pending update for it.
    
    const optimisticallyUpdatedArticle: Article = { 
        ...(articleToUpdate || { id, user_id: user.id, created_at: new Date().toISOString() }), 
        ...updates, 
        updated_at: new Date().toISOString() 
    } as Article;

    if (!isSyncing) {
      setArticles(prev => {
        const existing = prev.find(a => a.id === id);
        if (existing) {
          return prev.map(a => a.id === id ? optimisticallyUpdatedArticle : a);
        }
        // It's a new article that was not yet saved.
        return [optimisticallyUpdatedArticle, ...prev];
      });
    }

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
        article.id === id ? data : article
      ));
      
      if (!isSyncing) {
        toast.success('Article updated.');
      }
      
      clearPendingUpdate(id);
      return data;
    } catch (error) {
      if (!isSyncing) {
        console.error('Error updating article, caching:', error);
        toast.warning('Offline. Changes saved locally.');
        setPendingUpdate(id, updates);
        return optimisticallyUpdatedArticle;
      }
      console.error('Error syncing article update:', error);
      return undefined;
    }
  }, [user, articles]);

  const deleteArticle = useCallback(async (id: string, isSyncing = false): Promise<boolean> => {
    if (!user) return false;

    if (!isSyncing) {
      setArticles(prev => prev.filter(article => article.id !== id));
    }

    try {
      const { error } = await supabase
        .from('articles')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      if (!isSyncing) {
        toast.success('Article deleted successfully');
      }
      unmarkForDeletion(id);
      return true;
    } catch (error) {
      if (!isSyncing) {
        console.error('Error deleting article, caching:', error);
        toast.warning('Offline. Deletion will sync later.');
        markForDeletion(id);
        return true; // Optimistically deleted
      }
      console.error('Error syncing article deletion:', error);
      return false;
    }
  }, [user]);

  const syncPendingUpdates = useCallback(async () => {
    if (!user) return;

    let hadUpdates = false;
    const promises = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('pending-article-update-')) {
        hadUpdates = true;
        const articleId = key.replace('pending-article-update-', '');
        const pendingUpdate = getPendingUpdate(articleId);
        if (pendingUpdate) {
          promises.push(updateArticle(articleId, pendingUpdate, true));
        }
      } else if (key?.startsWith('pending-article-delete-')) {
        hadUpdates = true;
        const articleId = key.replace('pending-article-delete-', '');
        promises.push(deleteArticle(articleId, true));
      }
    }
    
    if (hadUpdates) {
      toast.info('Syncing pending changes...');
      await Promise.all(promises);
      await fetchArticles();
      toast.success('Sync complete!');
    }
  }, [user, fetchArticles, updateArticle, deleteArticle]);

  useEffect(() => {
    if (user) {
      fetchArticles();
      window.addEventListener('online', syncPendingUpdates);
      syncPendingUpdates(); 
    }
    return () => {
      window.removeEventListener('online', syncPendingUpdates);
    }
  }, [user, fetchArticles, syncPendingUpdates]);

  const createArticle = useCallback(async (title: string): Promise<Article | undefined> => {
    if (!user) return;

    const tempId = `temp-${Date.now()}`;
    const newArticle: Article = {
      id: tempId,
      title,
      content: '',
      user_id: user.id,
      status: 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      word_count: 0,
      research_data: {}
    };

    setArticles(prev => [newArticle, ...prev]);

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
      
      setArticles(prev => prev.map(a => a.id === tempId ? data : a));
      toast.success('Article created successfully');
      return data;
    } catch (error) {
      console.error('Error creating article:', error);
      toast.warning('Failed to create article. Saved locally.');
      setPendingUpdate(tempId, newArticle);
      return newArticle;
    }
  }, [user]);

  return {
    articles,
    loading,
    createArticle,
    updateArticle,
    deleteArticle,
    fetchArticles,
  };
};
