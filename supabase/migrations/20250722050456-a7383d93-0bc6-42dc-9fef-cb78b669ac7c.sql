-- Create storage bucket for article files
INSERT INTO storage.buckets (id, name, public) VALUES ('article-files', 'article-files', true);

-- Create policies for article files storage
CREATE POLICY "Anyone can view article files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'article-files');

CREATE POLICY "Users can upload article files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'article-files');

CREATE POLICY "Users can update article files" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'article-files');

CREATE POLICY "Users can delete article files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'article-files');

-- Add file attachments table for articles
CREATE TABLE public.article_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on article_files
ALTER TABLE public.article_files ENABLE ROW LEVEL SECURITY;

-- Create policies for article_files
CREATE POLICY "Users can view their article files" 
ON public.article_files 
FOR SELECT 
USING (article_id IN (SELECT id FROM public.articles WHERE user_id = auth.uid()));

CREATE POLICY "Users can create their article files" 
ON public.article_files 
FOR INSERT 
WITH CHECK (article_id IN (SELECT id FROM public.articles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their article files" 
ON public.article_files 
FOR UPDATE 
USING (article_id IN (SELECT id FROM public.articles WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their article files" 
ON public.article_files 
FOR DELETE 
USING (article_id IN (SELECT id FROM public.articles WHERE user_id = auth.uid()));

-- Add user preferences table for API keys
CREATE TABLE public.user_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  custom_gemini_key TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on user_preferences
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies for user_preferences
CREATE POLICY "Users can view their own preferences" 
ON public.user_preferences 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own preferences" 
ON public.user_preferences 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" 
ON public.user_preferences 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Add trigger for user_preferences updated_at
CREATE TRIGGER update_user_preferences_updated_at
BEFORE UPDATE ON public.user_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();