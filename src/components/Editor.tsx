import { useEffect, forwardRef, useImperativeHandle } from "react";
import { useCreateBlockNote } from "@blocknote/react";
import { Block, BlockNoteEditor } from "@blocknote/core";
import { BlockNoteView } from "@blocknote/shadcn";
import { FileText } from "lucide-react";
import { Article } from "@/hooks/useArticle";

interface EditorProps {
  currentArticle?: Article | null;
  onArticleUpdate: (article: Article) => void;
  onMarkdownChange?: (markdown: string, wordCount: number, charCount: number) => void;
}

export interface EditorRef {
  convertMarkdownToBlocksJSON: (markdown: string) => Promise<string>;
  getEditorContentAsJSON: () => Promise<string>;
  getEditorContentAsMarkdown: () => Promise<string>;
  setEditorContentFromMarkdown: (markdown: string) => Promise<void>;
}

export const Editor = forwardRef<EditorRef, EditorProps>(({ currentArticle, onArticleUpdate, onMarkdownChange }, ref) => {
  const editor: BlockNoteEditor | null = useCreateBlockNote();

  useImperativeHandle(ref, () => ({
    async convertMarkdownToBlocksJSON(markdown: string) {
      if (!editor) return '[]';
      const blocks = await editor.tryParseMarkdownToBlocks(markdown);
      return JSON.stringify(blocks);
    },
    async getEditorContentAsJSON() {
      if (!editor) return '[]';
      return JSON.stringify(editor.topLevelBlocks);
    },
    async getEditorContentAsMarkdown() {
      if (!editor) return '';
      return editor.blocksToMarkdownLossy(editor.topLevelBlocks);
    },
    async setEditorContentFromMarkdown(markdown: string) {
      if (!editor) return;
      const blocks = await editor.tryParseMarkdownToBlocks(markdown);
      editor.replaceBlocks(editor.topLevelBlocks, blocks);
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
        const { words, characters } = getWordAndCharCount(markdown);
        if (onMarkdownChange) onMarkdownChange(markdown, words, characters);
      } else {
        editor.replaceBlocks(editor.topLevelBlocks, []);
        if (onMarkdownChange) onMarkdownChange("", 0, 0);
      }
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [currentArticle, editor, onMarkdownChange]);

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
      <BlockNoteView editor={editor} theme="dark" className="p-6" onChange={async () => {
        if (editor && onMarkdownChange) {
          const text = await editor.blocksToMarkdownLossy(editor.topLevelBlocks);
          const { words, characters } = getWordAndCharCount(text);
          onMarkdownChange(text, words, characters);
        }
      }} />
    </div>
  );
});