import { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from "react";
import { useCreateBlockNote } from "@blocknote/react";
import { Block, BlockNoteEditor } from "@blocknote/core";
import { BlockNoteView } from "@blocknote/shadcn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, FileText, Pilcrow, Upload, Search, Bot, Loader2, Link as LinkIcon } from "lucide-react";
import { Article, useArticle } from "@/hooks/useArticle";
import { useAI } from "@/hooks/useAI";
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
  const { researchTopic, generateArticle, loading: aiLoading } = useAI();
  const [title, setTitle] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [articleFiles, setArticleFiles] = useState<any[]>([]);
  const [researchQuery, setResearchQuery] = useState("");

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
      setResearchQuery(currentArticle.title);
    } else {
      setTitle("");
      setResearchQuery("");
    }
    loadArticleFiles();

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
  }, [currentArticle, editor, loadArticleFiles, onMarkdownChange]);

  const handleSave = async () => {
    if (!currentArticle || !editor) return;
    const content = JSON.stringify(editor.topLevelBlocks);
    const updated = await updateArticle(currentArticle.id, { title, content, word_count: wordCount });
    if (updated) {
      onArticleUpdate(updated);
      toast.success('Article saved successfully');
    }
  };

  const handleResearch = async () => {
    if (!currentArticle || !researchQuery) return;
    const researchResult = await researchTopic(researchQuery, [], currentArticle.id);
    if (researchResult) {
      const updated = await updateArticle(currentArticle.id, { research_data: researchResult });
      if (updated) onArticleUpdate(updated);
    }
  };

  const handleGenerate = async () => {
    if (!currentArticle) return;
    const researchData = currentArticle.research_data?.research;
    if (!researchData) {
      toast.error("Please conduct research before generating an article.");
      return;
    }
    const generationResult = await generateArticle(currentArticle.title, undefined, researchData, currentArticle.id);
    if (generationResult?.content) {
      const blocks = await editor.tryParseMarkdownToBlocks(generationResult.content);
      editor.replaceBlocks(editor.topLevelBlocks, blocks);
      toast.success("Article generated based on your research!");
      handleSave();
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
    <div className="flex-1 flex flex-col h-full bg-background text-foreground overflow-hidden">
      <div className="p-4 pl-14 border-b border-border flex items-center justify-between gap-4 flex-shrink-0">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Article Title..." className="text-xl font-semibold border-none bg-transparent focus-visible:ring-0 p-0 h-auto" />
        <Button size="sm" onClick={handleSave}><Save className="w-4 h-4 mr-2" />Save</Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <Tabs defaultValue="editor" className="h-full flex flex-col">
          <TabsList className="mx-6 mt-4">
            <TabsTrigger value="editor">Editor</TabsTrigger>
            <TabsTrigger value="research">Research</TabsTrigger>
            <TabsTrigger value="files">Files ({articleFiles.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="editor" className="flex-1 mt-0">
            <BlockNoteView editor={editor} theme="light" className="p-6" onChange={async () => {
              if (editor) {
                const text = await editor.blocksToMarkdownLossy(editor.topLevelBlocks);
                const stats = getWordAndCharCount(text);
                setWordCount(stats.words);
                setCharCount(stats.characters);
                if (onMarkdownChange) onMarkdownChange(text);
              }
            }} />
          </TabsContent>

          <TabsContent value="research" className="flex-1 mt-0 p-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="research-query">Research Topic</Label>
              <div className="flex gap-2">
                <Input id="research-query" value={researchQuery} onChange={(e) => setResearchQuery(e.target.value)} placeholder="Enter a topic to research..." />
                <Button onClick={handleResearch} disabled={aiLoading}>
                  {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Research Summary</Label>
              <Textarea value={currentArticle.research_data?.research || "No research conducted yet."} readOnly className="h-64 bg-muted/50" />
            </div>
            {currentArticle.research_data?.sources?.length > 0 && (
              <div className="space-y-2">
                <Label>Sources Found</Label>
                <div className="p-4 border rounded-md bg-muted/50 space-y-2">
                  {currentArticle.research_data.sources.map((source: any, index: number) => (
                    <a key={index} href={source.uri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
                      <LinkIcon className="w-4 h-4" />
                      <span>{source.title}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
            <Button onClick={handleGenerate} disabled={aiLoading || !currentArticle.research_data?.research}>
              {aiLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Bot className="w-4 h-4 mr-2" />}
              Generate Article from Research
            </Button>
          </TabsContent>
          
          <TabsContent value="files" className="flex-1 mt-0 p-6">
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
        </Tabs>
      </div>

      <div className="p-2 border-t border-border text-xs text-muted-foreground flex items-center justify-end gap-4 flex-shrink-0">
        <div className="flex items-center gap-1"><Pilcrow className="w-3 h-3" /><span>{wordCount} words</span></div>
        <div className="flex items-center gap-1"><span className="font-mono text-xs">T</span><span>{charCount} characters</span></div>
      </div>
    </div>
  );
});