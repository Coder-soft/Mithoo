import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { useCreateBlockNote } from "@blocknote/react";
import { Block, BlockNoteEditor } from "@blocknote/core";
import { BlockNoteView } from "@blocknote/shadcn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Save, FileText, Pilcrow, Loader2, Sparkles } from "lucide-react";
import { Article, useArticle } from "@/hooks/useArticle";
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

  const editor: BlockNoteEditor | null = useCreateBlockNote();

  useImperativeHandle(ref, () => ({
    async convertMarkdownToBlocksJSON(markdown: string) {
      if (!editor) return '[]';
      const blocks = await editor.tryParseMarkdownToBlocks(markdown);
      return JSON.stringify(blocks);
    }
  }));

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

    if (!editor) return;

    const timeoutId = setTimeout(async () => {
      if (currentArticle) {
        let markdown = "";
        try {
          const blocks = JSON.parse(currentArticle.content || '[]') as Block[];
          editor.replaceBlocks(editor.topLevelBlocks, blocks);
          markdown = await editor.blocksToMarkdownLossy(blocks);
        } catch (e) {
          markdown = currentArticle.content || "";
          const blocks = await editor.tryParseMarkdownToBlocks(markdown);
          editor.replaceBlocks(editor.topLevelBlocks, blocks);
        }
        const stats = getWordAndCharCount(markdown);
        setWordCount(stats.words);
        setCharCount(stats.characters);
        if (onMarkdownChange) onMarkdownChange(markdown);
      } else {
        editor.replaceBlocks(editor.topLevelBlocks, []);
        setWordCount(0);
        setCharCount(0);
        if (onMarkdownChange) onMarkdownChange("");
      }
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [currentArticle, editor, onMarkdownChange]);

  const handleSave = async () => {
    if (!currentArticle || !editor) return;
    const content = JSON.stringify(editor.topLevelBlocks);
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
      const markdown = await editor.blocksToMarkdownLossy(editor.topLevelBlocks);
      const humanizeMode = mode;
      const { data, error } = await supabase.functions.invoke('humanize-text', {
        body: { text: markdown, mode: humanizeMode }
      });
      if (error) throw error;
      const humanized = (data as any).humanizedText as string;
      const blocks = await editor.tryParseMarkdownToBlocks(humanized);
      editor.replaceBlocks(editor.topLevelBlocks, blocks);
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
    <div className="flex-1 bg-background text-foreground">
      <div className="p-4 border-b border-border flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Article Title..." className="text-xl font-semibold border-none bg-transparent focus-visible:ring-0 p-0 h-auto w-full" />
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-shrink-0">
          <div className="flex items-center gap-1 whitespace-nowrap">
            <Pilcrow className="w-4 h-4" />
            <span>{wordCount} words</span>
          </div>
          <div className="flex items-center gap-1 whitespace-nowrap">
            <span className="font-mono text-sm">T</span>
            <span>{charCount} characters</span>
          </div>
          
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

      <BlockNoteView editor={editor} theme="dark" className="p-6" onChange={async () => {
        if (editor) {
          const text = await editor.blocksToMarkdownLossy(editor.topLevelBlocks);
          const stats = getWordAndCharCount(text);
          setWordCount(stats.words);
          setCharCount(stats.characters);
          if (onMarkdownChange) onMarkdownChange(text);
        }
      }} />
    </div>
  );
});
