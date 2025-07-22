import { useState, useEffect, useCallback } from "react";
import { useCreateBlockNote } from "@blocknote/react";
import { Block, BlockNoteEditor } from "@blocknote/core";
import { BlockNoteView } from "@blocknote/shadcn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, FileText, Pilcrow, Upload } from "lucide-react";
import { Article, useArticle } from "@/hooks/useArticle";
import { FileUpload } from "./FileUpload";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { schema } from "@/lib/editor-schema";

interface EditorProps {
  currentArticle?: Article | null;
  onArticleChange?: (article: Article) => void;
}

export const Editor = ({ currentArticle, onArticleChange }: EditorProps) => {
  const { updateArticle } = useArticle();
  const [title, setTitle] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [articleFiles, setArticleFiles] = useState<any[]>([]);

  const editor: BlockNoteEditor | null = useCreateBlockNote({
    schema,
  });

  const loadArticleFiles = useCallback(async () => {
    if (!currentArticle) {
      setArticleFiles([]);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('article_files')
        .select('*')
        .eq('article_id', currentArticle.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setArticleFiles(data || []);
    } catch (error) {
      console.error('Error loading article files:', error);
    }
  }, [currentArticle]);

  useEffect(() => {
    if (currentArticle) {
      setTitle(currentArticle.title);
    } else {
      setTitle("");
    }
    loadArticleFiles();

    if (!editor) {
      return;
    }

    // Using setTimeout to defer the update to the next event loop tick.
    // This helps prevent a race condition with React's Strict Mode in development
    // that can cause errors when rapidly replacing content.
    const timeoutId = setTimeout(() => {
      if (currentArticle) {
        try {
          const blocks = JSON.parse(currentArticle.content || '[]') as Block[];
          editor.replaceBlocks(editor.topLevelBlocks, blocks);
        } catch (e) {
          // If content is not valid JSON, treat it as plain text
          editor.replaceBlocks(editor.topLevelBlocks, [{
            type: "paragraph",
            content: currentArticle.content || ""
          }]);
        }
      } else {
        editor.replaceBlocks(editor.topLevelBlocks, []);
      }
    }, 0);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [currentArticle, editor, loadArticleFiles]);

  const handleFileUploaded = (file: any) => {
    setArticleFiles(prev => [file, ...prev]);
  };

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
            size="sm" 
            onClick={handleSave}
          >
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <Tabs defaultValue="editor" className="h-full flex flex-col">
          <TabsList className="mx-6 mt-4">
            <TabsTrigger value="editor">Editor</TabsTrigger>
            <TabsTrigger value="files">
              <Upload className="w-4 h-4 mr-2" />
              Files ({articleFiles.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="editor" className="flex-1 mt-0">
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
          </TabsContent>
          
          <TabsContent value="files" className="flex-1 mt-0 p-6">
            <div className="space-y-4">
              <FileUpload 
                articleId={currentArticle.id} 
                onFileUploaded={handleFileUploaded}
              />
              
              {articleFiles.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Uploaded Files</h4>
                  <div className="grid gap-2">
                    {articleFiles.map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex items-center space-x-3">
                          {file.file_type.startsWith('image/') && (
                            <img 
                              src={file.file_url} 
                              alt={file.file_name}
                              className="w-10 h-10 object-cover rounded"
                            />
                          )}
                          <div>
                            <div className="font-medium text-sm">{file.file_name}</div>
                            <div className="text-xs text-muted-foreground">
                              {(file.file_size / 1024 / 1024).toFixed(2)} MB
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(file.file_url, '_blank')}
                        >
                          View
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
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