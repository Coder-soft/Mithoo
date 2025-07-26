import { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from "react";
import { useCreateBlockNote } from "@blocknote/react";
import { Block, BlockNoteEditor } from "@blocknote/core";
import { BlockNoteView } from "@blocknote/shadcn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Save, FileText, Pilcrow, Loader2, Sparkles } from "lucide-react";
import { Article, useArticle } from "@/hooks/useArticle";
import { FileUpload } from "./FileUpload";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EditorProps {
  currentArticle?: Article | null;
  onArticleUpdate: (article: Article) => void;
  onMarkdownChange?: (markdown: string) => void;
}

export interface EditorRef {
  convertMarkdownToBlocksJSON: (markdown: string) => Promise<string>;
}

export const Editor = forwardRef<EditorRef, EditorProps>(({ currentArticle, onArticleUpdate, onMarkdownChange }, ref) => {
  const { updateArticle } = useArticle();
  const [title, setTitle] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  type HumanizeMode = 'subtle' | 'balanced' | 'strong' | 'stealth';
  const [humanizing, setHumanizing] = useState(false);
  const [articleFiles, setArticleFiles] = useState<any[]>([]);

  const editor: BlockNoteEditor | null = useCreateBlockNote();

  useImperativeHandle(ref, () => ({
    async convertMarkdownToBlocksJSON(markdown: string) {
      if (!editor) return '[]';
      const blocks = await editor.tryParseMarkdownToBlocks(markdown);
      return JSON.stringify(blocks);
    }
  }));

  const loadArticleFiles = useCallback(async () => {
    if (!currentArticle) {
      setArticleFiles([]);
      return;
    }
    const { data, error } = await supabase.from('article_files').select('*').eq('article_id', currentArticle.id).order('created_at', { ascending: false });
    if (error) console.error('Error loading article files:', error);
    else setArticleFiles(data || []);
  }, [currentArticle]);

  const getWordAndCharCount = (text: string) => {
    const trimmedText = text.trim();
    if (!trimmedText) return { words: 0, characters: 0 };
    const words = trimmedText.split(/\s+/).filter(Boolean).length;
    const characters = trimmedText.length;
    return { words, characters };
  };

  useEffect(() => {
    if (currentArticle) {
      setTitle(currentArticle.title);
    } else {
      setTitle("");
    }
    loadArticleFiles();

    if (!editor) return;

    const timeoutId = setTimeout(async () => {
      if (currentArticle) {
        let markdown = "";
        try {
          const blocks = JSON.parse(currentArticle.content || '[]') as Block[];
          editor.replaceBlocks(editor.topLvlBlocks, blocks);
          markdown = await editor.blocksToMarkdownLossy(blocks);
        } catch (e) {
          markdown = currentArticle.content || "";
          const blocks = await editor.tryParseMarkdownToBlocks(markdown);
          editor.replaceBlocks(editor.topLvlBlocks, blocks);
        }
        const stats = getWordAndCharCount(markdown);
        setWordCount(stats.words);
        setCharCount(stats.characters);
        if (onMarkdownChange) onMarkdownChange(markdown);
      } else {
        editor.replaceBlocks(editor.topLvlBlocks, []);
        setWordCount(0);
        setCharCount(0);
        if (onMarkdownChange) onMarkdownChange("");
      }
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [currentArticle, editor, loadArticleFiles, onMarkdownChange]);

  const handleSave = async () => {
    if (!currentArticle || !editor) return;
    const content = JSON.stringify(editor.topLvlBlocks);
    const updated = await updateArticle(currentArticle.id, { title, content, word_count: wordCount });
    if (updated) {
      onArticleUpdate(updated);
      toast.success('Article saved successfully');
    }
  };

  const handleHumanize = async (mode: HumanizeMode) => {
    if (!editor || !currentArticle) return;
    setHumanizing(true);
    try {
      const markdown = await editor.blocksToMarkdownLossy(editor.topLvlBlocks);
      const humanizeMode = mode;
      const { data, error } = await supabase.functions.invoke('humanize-text', {
        body: { text: markdown, mode: humanizeMode }
      });
      if (error) throw error;
      const humanized = (data as any).humanizedText as string;
      const blocks = await editor.tryParseMarkdownToBlocks(humanized);
      editor.replaceBlocks(editor.topLvlBlocks, blocks);
      const stats = getWordAndCharCount(humanized);
      setWordCount(stats.words);
      setCharCount(stats.characters);
      if (onMarkdownChange) onMarkdownChange(humanized);
      toast.success(`Article humanized using ${mode} mode`);
    } catch (err: any) {
      console.error('Humanize error:', err);
      toast.error(err.message || 'Failed to humanize article');
    } finally {
      setHumanizing(false);
    }
  };

  if (!currentArticle) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/30">
        <div className="text-center">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">No article selected</h3>
          <p className="mt-1 text-sm text-muted-foreground">Select or create an article to begin.</p>
        </div>
      </div>
    );
  }

  return (
    <Tabs defaultValue="editor" className="flex-1 flex flex-col h-full bg-background text-foreground overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between gap-4 flex-shrink-0">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Article Title..."
          className="text-xl font-semibold border-none bg-transparent focus-visible:ring-0 p-0 h-auto"
        />
        <div className="flex items-center gap-4">
          <div className="text-xs text-muted-foreground flex items-center gap-4 flex-shrink-0">
            <div className="flex items-center gap-1"><Pilcrow className="w-3 h-3" /><span>{wordCount} words</span></div>
            <div className="flex items-center gap-1"><span className="font-mono text-xs">T</span><span>{charCount} characters</span></div>
          </div>

          <TabsList>
            <TabsTrigger value="editor">Editor</TabsTrigger>
            <TabsTrigger value="files">Files ({articleFiles.length})</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button size="sm" variant="outline" disabled={humanizing}>
                  {humanizing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                  Humanize
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0 w-40">
                {(['subtle', 'balanced', 'strong', 'stealth'] as HumanizeMode[]).map(m => (
                  <Button key={m} variant="ghost" className="w-full justify-start" onClick={() => handleHumanize(m)} disabled={humanizing}>
                    {m.charAt(0).toUpperCase() + m.slice(1)}
                  </Button>
                ))}
              </PopoverContent>
            </Popover>
            <Button size="sm" onClick={handleSave}><Save className="w-4 h-4 mr-2" />Save</Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <TabsContent value="editor" className="h-full mt-0">
          <BlockNoteView
            editor={editor}
            theme="dark"
            className="p-6 h-full"
            onChange={async () => {
              if (editor) {
                const text = await editor.blocksToMarkdownLossy(editor.topLvlBlocks);
                const stats = getWordAndCharCount(text);
                setWordCount(stats.words);
                setCharCount(stats.characters);
                if (onMarkdownChange) onMarkdownChange(text);
              }
            }}
          />
        </TabsContent>
        
        <TabsContent value="files" className="h-full mt-0 p-6">
          <FileUpload articleId={currentArticle.id} onFileUploaded={(file) => setArticleFiles(prev => [file, ...prev])} />
          {articleFiles.length > 0 && (
            <div className="mt-4 space-y-2">
              <h4 className="font-medium">Uploaded Files</h4>
              <div className="grid gap-2">
                {articleFiles.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center space-x-3">
                      {file.file_type.startsWith('image/') && <img src={file.file_url} alt={file.file_name} className="w-10 h-10 object-cover rounded" />}
                      <div>
                        <div className="font-medium text-sm">{file.file_name}</div>
                        <div className="text-xs text-muted-foreground">{(file.file_size / 1024 / 1024).toFixed(2)} MB</div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => window.open(file.file_url, '_blank')}>View</Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </div>
    </Tabs>
  );
});