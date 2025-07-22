import { useState, useEffect, useRef } from "react";
import { Header } from "@/components/Header";
import { Editor, type EditorRef } from "@/components/Editor";
import { useAuth } from "@/hooks/useAuth";
import { useArticle, Article } from "@/hooks/useArticle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Plus, FileText, Book, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { ChatDialog } from "@/components/ChatDialog";
import { DiffViewerDialog } from "@/components/DiffViewerDialog";
import { cn } from "@/lib/utils";

const Home = () => {
  const { user, loading: authLoading } = useAuth();
  const { articles, currentArticle, setCurrentArticle, createArticle, updateArticle, loading: articlesLoading } = useArticle();
  const [showNewArticleDialog, setShowNewArticleDialog] = useState(false);
  const [newArticleTitle, setNewArticleTitle] = useState("");
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [markdownContent, setMarkdownContent] = useState('');
  const liveWordCount = markdownContent.trim().length
    ? markdownContent.trim().split(/\s+/).filter(Boolean).length
    : 0;
  const navigate = useNavigate();

  const editorRef = useRef<EditorRef>(null);
  const [isDiffDialogOpen, setIsDiffDialogOpen] = useState(false);
  const [diffData, setDiffData] = useState<{ old: string; new: string } | null>(null);

  const [isChatDialogOpen, setIsChatDialogOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  useEffect(() => {
    if (!user && !authLoading) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    setConversationId(null);
  }, [currentArticle]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
        e.preventDefault();
        setIsChatDialogOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleCreateArticle = async () => {
    if (!newArticleTitle.trim()) return;
    
    const article = await createArticle(newArticleTitle.trim());
    if (article) {
      setCurrentArticle(article);
      setNewArticleTitle("");
      setShowNewArticleDialog(false);
    }
  };

  const applyAiChanges = async (content: string) => {
    if (content && currentArticle && updateArticle && editorRef.current) {
      try {
        const contentJSON = await editorRef.current.convertMarkdownToBlocksJSON(content);
        const updatedArticle = await updateArticle(currentArticle.id, { content: contentJSON });
        if (updatedArticle) {
          setCurrentArticle(updatedArticle);
          toast.success('Article has been updated by the AI.');
        }
      } catch (error) {
        console.error("Failed to parse markdown from AI:", error);
        toast.error("AI returned invalid content format. Saving as plain text.");
        const updatedArticle = await updateArticle(currentArticle.id, { content });
        if (updatedArticle) {
          setCurrentArticle(updatedArticle);
        }
      }
    }
  };

  const handleAiEdit = (newContent: string) => {
    setDiffData({ old: markdownContent, new: newContent });
    setIsDiffDialogOpen(true);
  };

  const handleAcceptChanges = () => {
    if (diffData) {
      applyAiChanges(diffData.new);
    }
    setIsDiffDialogOpen(false);
    setDiffData(null);
  };

  const handleResearchUpdate = async (researchData: any) => {
    if (researchData && currentArticle && updateArticle) {
      const updatedArticle = await updateArticle(currentArticle.id, {
        research_data: {
          topic: researchData.topic,
          keywords: researchData.keywords,
          data: researchData.research,
          generated_at: new Date().toISOString()
        }
      });
      if (updatedArticle) {
        setCurrentArticle(updatedArticle);
        toast.success('Research data has been updated for the current article.');
      }
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-2">Loading...</h2>
          <p className="text-muted-foreground">Please wait while we check your session.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header onCreateArticle={() => setShowNewArticleDialog(true)} />
      <div className="flex-grow flex overflow-hidden">
        {/* Icon Navigation Rail */}
        <nav className="flex flex-col items-center gap-4 py-4 px-2 bg-muted/30 border-r border-border">
          <Button 
            variant={'secondary'} 
            size="icon" 
            aria-label="Articles"
          >
            <Book className="w-5 h-5" />
          </Button>
        </nav>

        {/* Collapsible Content Panel */}
        <aside className={cn(
          "bg-muted/50 border-r border-border transition-all duration-300 ease-in-out flex-shrink-0",
          isPanelOpen ? 'w-96' : 'w-0'
        )}>
          <div className={cn("h-full flex flex-col", isPanelOpen ? 'opacity-100' : 'opacity-0 pointer-events-none')}>
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="text-lg font-semibold capitalize">Articles</h2>
              <Dialog open={showNewArticleDialog} onOpenChange={setShowNewArticleDialog}>
                <DialogTrigger asChild>
                  <Button size="icon" variant="ghost">
                    <Plus className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Article</DialogTitle>
                    <DialogDescription>
                      Enter a title for your new article to get started.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <Input
                      placeholder="Enter article title..."
                      value={newArticleTitle}
                      onChange={(e) => setNewArticleTitle(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleCreateArticle()}
                    />
                    <Button 
                      onClick={handleCreateArticle}
                      disabled={!newArticleTitle.trim() || articlesLoading}
                      className="w-full"
                    >
                      Create Article
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            
            <div className="flex-grow overflow-y-auto">
              <div className="p-4 space-y-2">
                {articles.map((article) => (
                  <Card
                    key={article.id}
                    className={cn(
                      "p-3 cursor-pointer transition-colors hover:bg-accent/80",
                      currentArticle?.id === article.id ? 'bg-accent' : ''
                    )}
                    onClick={() => setCurrentArticle(article)}
                  >
                    <div className="flex items-start space-x-3">
                      <FileText className="w-4 h-4 mt-1 text-white" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate text-sm">{article.title}</h4>
                        <p className="text-xs text-white">
                          {article.id === currentArticle?.id ? liveWordCount : (article.word_count || 0)} words
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
                {articles.length === 0 && !articlesLoading && (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground text-sm">No articles yet.</p>
                    <Button variant="link" size="sm" onClick={() => setShowNewArticleDialog(true)}>Create your first article</Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-grow flex flex-col relative">
          <Button
            variant="outline"
            size="icon"
            className="absolute top-4 left-4 z-10 h-8 w-8"
            onClick={() => setIsPanelOpen(!isPanelOpen)}
          >
            {isPanelOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
          </Button>
          <Editor 
            ref={editorRef}
            key={currentArticle?.id || 'no-article'}
            currentArticle={currentArticle}
            onArticleChange={setCurrentArticle}
            onMarkdownChange={setMarkdownContent}
          />
        </main>
      </div>
      {diffData && (
        <DiffViewerDialog
          isOpen={isDiffDialogOpen}
          onClose={() => setIsDiffDialogOpen(false)}
          oldContent={diffData.old}
          newContent={diffData.new}
          onAccept={handleAcceptChanges}
        />
      )}
      <ChatDialog
        isOpen={isChatDialogOpen}
        onClose={() => setIsChatDialogOpen(false)}
        currentArticle={currentArticle}
        onResearch={handleResearchUpdate}
        onGenerate={applyAiChanges}
        onEdit={handleAiEdit}
        articleMarkdown={markdownContent}
        conversationId={conversationId}
        setConversationId={setConversationId}
      />
    </div>
  );
};

export default Home;