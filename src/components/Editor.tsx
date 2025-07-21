import { useState, useEffect } from "react";
import { useCreateBlockNote } from "@blocknote/react";
import { Block, BlockNoteEditor, BlockNoteSchema } from "@blocknote/core";
import { BlockNoteView } from "@blocknote/shadcn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Save, Loader2, Sparkles, FileText, Pilcrow } from "lucide-react";
import { Article, useArticle } from "@/hooks/useArticle";
import { useAI } from "@/hooks/useAI";
import { toast } from "sonner";

interface EditorProps {
  currentArticle?: Article | null;
  onArticleChange?: (article: Article) => void;
}

const schema = BlockNoteSchema.create({});

export const Editor = ({ currentArticle, onArticleChange }: EditorProps) => {
  const { updateArticle } = useArticle();
  const { improveArticle, loading: aiLoading } = useAI();
  const [title, setTitle] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

  const editor: BlockNoteEditor | null = useCreateBlockNote({
    schema,
  });

  useEffect(() => {
    if (currentArticle) {
      setTitle(currentArticle.title);
      if (editor) {
        // Using setTimeout to defer the update to the next event loop tick.
        // This helps prevent a race condition with React's Strict Mode in development
        // that can cause errors when rapidly replacing content.
        setTimeout(() => {
          if (!editor.isMounted) return;
          try {
            const blocks = JSON.parse(currentArticle.content || '[]') as Block[];
            editor.replaceBlocks(editor.topLevelBlocks, blocks);
          } catch (e) {
            // If content is not valid JSON, treat it as plain text
            editor.replaceBlocks(editor.topLevelBlocks, [{ type: "paragraph", content: currentArticle.content || ""}]);
          }
        }, 0);
      }
    } else {
      setTitle("");
      if(editor) {
        setTimeout(() => {
          if (!editor.isMounted) return;
          editor.replaceBlocks(editor.topLevelBlocks, []);
        }, 0);
      }
    }
  }, [currentArticle, editor]);

  const getWordAndCharCount = (text: string) => {
    const trimmedText = text.trim();
    if (!trimmedText) return { words: 0, characters: 0 };
    const words = trimmedText.split(/\s+/).filter(Boolean).length;
    const characters = trimmedText.length;
    return { words, characters };
  };

  const handleSave = async () => {
    if (!currentArticle || !editor) return;

    const content = JSON.stringify(editor.topLevelBlocks);

    try {
      const updatedArticle = await updateArticle(currentArticle.id, {
        title,
        content,
        word_count: wordCount,
      });
      
      if (updatedArticle && onArticleChange) {
        onArticleChange(updatedArticle);
      }
      toast.success('Article saved successfully');
    } catch (error) {
      // Error handling is in the hook
    }
  };

  const handleImprove = async () => {
    if (!currentArticle || !editor) return;
    const content = await editor.blocksToMarkdownLossy(editor.topLevelBlocks);
    if (!content.trim()) return;

    try {
      const response = await improveArticle(title, content, currentArticle.id);
      if (response && response.content) {
        // Assuming response.content is markdown, convert it to blocks
        const blocks = await editor.tryParseMarkdownToBlocks(response.content);
        editor.replaceBlocks(editor.topLevelBlocks, blocks);
        toast.success('AI has improved the article!');
      }
    } catch (error) {
      // Error handled in hook
    }
  };

  if (!currentArticle) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/30">
        <div className="text-center">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">No article selected</h3>
          <p className="mt-1 text-sm text-muted-foreground">Select an article from the sidebar or create a new one to start writing.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-background text-foreground">
      <div className="p-4 border-b border-border flex items-center justify-between gap-4">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Article Title..."
          className="text-xl font-semibold border-none bg-transparent focus-visible:ring-0 p-0 h-auto"
        />
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleImprove}
            disabled={aiLoading || wordCount === 0}
          >
            {aiLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            Improve with AI
          </Button>
          <Button 
            size="sm" 
            onClick={handleSave}
            disabled={aiLoading}
          >
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <BlockNoteView
          editor={editor}
          theme="light"
          className="p-6"
          onChange={async () => {
            if (editor) {
              const text = await editor.blocksToMarkdownLossy(editor.topLevelBlocks);
              const stats = getWordAndCharCount(text);
              setWordCount(stats.words);
              setCharCount(stats.characters);
            }
          }}
        />
      </div>

      <div className="p-2 border-t border-border text-xs text-muted-foreground flex items-center justify-end gap-4">
        <div className="flex items-center gap-1">
          <Pilcrow className="w-3 h-3" />
          <span>{wordCount} words</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="font-mono text-xs">T</span>
          <span>{charCount} characters</span>
        </div>
      </div>
    </div>
  );
};