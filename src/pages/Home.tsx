import { useState, useEffect, useRef } from "react";
import { Header } from "@/components/Header";
import { Editor, type EditorRef } from "@/components/Editor";
import { useAuth } from "@/hooks/useAuth";
import { useArticle, Article } from "@/hooks/useArticle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Plus, FileText, Book, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { ChatDialog } from "@/components/ChatDialog";
import { DiffViewerDialog } from "@/components/DiffViewerDialog";
import { cn } from "@/lib/utils";

const Home = () => {
  const { user, loading: authLoading } = useAuth();
  const { articles, createArticle, updateArticle, loading: articlesLoading } = useArticle();
  const [showNewArticleDialog, setShowNewArticleDialog] = useState(false);
  const [newArticleTitle, setNewArticleTitle] = useState("");
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [markdownContent, setMarkdownContent] = useState('');
  
  const [openArticles, setOpenArticles] = useState<Article[]>([]);
  const [activeArticleId, setActiveArticleId] = useState<string | null>(null);
  
  const currentArticle = openArticles.find(a => a.id === activeArticleId) || null;
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
  }, [activeArticleId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrlOrMeta = e.ctrlKey || e.metaKey;

      if (isCtrlOrMeta && e.key === 'l') {
        e.preventDefault();
        setIsChatDialogOpen(prev => !prev);
      }

      if (isCtrlOrMeta && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
        e.preventDefault();
        if (openArticles.length > 1 && activeArticleId) {
          const currentIndex = openArticles.findIndex(a => a.id === activeArticleId);
          if (currentIndex !== -1) {
            let nextIndex;
            if (e.key === 'ArrowRight') {
              nextIndex = (currentIndex + 1) % openArticles.length;
            } else { // ArrowLeft
              nextIndex = (currentIndex - 1 + openArticles.length) % openArticles.length;
            }
            setActiveArticleId(openArticles[nextIndex].id);
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeArticleId, openArticles]);

  const handleSelectArticle = (article: Article) => {
    if (!openArticles.some(a => a.id === article.id)) {
      setOpenArticles(prev => [...prev, article]);
    }
    setActiveArticleId(article.id);
  };

  const handleCloseTab = (e: React.MouseEvent, articleIdToClose: string) => {
    e.stopPropagation();
    const newOpenArticles = openArticles.filter(a => a.id !== articleIdToClose);
    setOpenArticles(newOpenArticles);

    if (activeArticleId === articleIdToClose) {
      if (newOpenArticles.length > 0) {
        setActiveArticleId(newOpenArticles[newOpenArticles.length - 1].id);
      } else {
        setActiveArticleId(null);
      }
    }
  };

  const handleCreateArticle = async () => {
    if (!newArticleTitle.trim()) return;
    
    const article = await createArticle(newArticleTitle.trim());
    if (article) {
      handleSelectArticle(article);
      setNewArticleTitle("");
      setShowNewArticleDialog(false);
    }
  };

  const onArticleUpdate = (updatedArticle: Article) => {
    setOpenArticles(prev => prev.map(a => a.id === updatedArticle.id ? updatedArticle : a));
  };

  const handleAiEdit = (newContent: string) => {
    setDiffData({ old: markdownContent, new: newContent });
    setIsDiffDialogOpen(true);
  };

  const handleAcceptChanges = async () => {
    if (diffData && currentArticle && editorRef.current) {
      await handleGenerateComplete(diffData.new);
    }
    setIsDiffDialogOpen(false);
    setDiffData(null);
  };

  const handleResearchComplete = async (researchData: any) => {
    if (researchData && currentArticle) {
      const updatedArticle = await updateArticle(currentArticle.id, { research_data: researchData });
      if (updatedArticle) {
        onArticleUpdate(updatedArticle);
      }
    }
  };

  const handleGenerateComplete = async (content: string) => {
    if (content && currentArticle && editorRef.current) {
      const contentJSON = await editorRef.current.convertMarkdownToBlocksJSON(content);
      const updatedArticle = await updateArticle(currentArticle.id, { content: contentJSON });
      if (updatedArticle) {
        onArticleUpdate(updatedArticle);
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
    <div className="h-screen bg-background flex flex-col">
      <Header onCreateArticle={() => setShowNewArticleDialog(true)} />
      <div className="flex-grow flex overflow-hidden">
        <nav className="flex flex-col items-center gap-4 py-4 px-2 bg-background/30 backdrop-blur-md border-r border-border flex-shrink-0">
          <Button variant={'secondary'} size="icon" aria-label="Articles"><Book className="w-5 h-5" /></Button>
        </nav>

        <aside className={cn("bg-background/50 backdrop-blur-md border-r border-border transition-all duration-300 ease-in-out flex-shrink-0", isPanelOpen ? 'w-96' : 'w-0')}>
          <div className={cn("h-full flex flex-col", isPanelOpen ? 'opacity-100' : 'opacity-0 pointer-events-none')}>
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="text-lg font-semibold capitalize">Articles</h2>
              <Dialog open={showNewArticleDialog} onOpenChange={setShowNewArticleDialog}>
                <DialogTrigger asChild><Button size="icon" variant="ghost"><Plus className="w-4 h-4" /></Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Create New Article</DialogTitle><DialogDescription>Give your new article a title to get started.</DialogDescription></DialogHeader>
                  <div className="space-y-4 py-4">
                    <Input placeholder="Enter article title..." value={newArticleTitle} onChange={(e) => setNewArticleTitle(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleCreateArticle()} />
                    <Button onClick={handleCreateArticle} disabled={!newArticleTitle.trim() || articlesLoading} className="w-full">Create Article</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div className="flex-grow overflow-y-auto">
              <div className="p-4 space-y-2">
                {articles.map((article) => (
                  <Card key={article.id} className={cn("p-3 cursor-pointer transition-colors hover:bg-accent/80 bg-card/50 backdrop-blur-sm", activeArticleId === article.id ? 'bg-accent' : '')} onClick={() => handleSelectArticle(article)}>
                    <div className="flex items-start space-x-3">
                      <FileText className="w-4 h-4 mt-1 text-foreground" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate text-sm">{article.title}</h4>
                        <p className="text-xs text-muted-foreground">{article.id === currentArticle?.id ? liveWordCount : (article.word_count || 0)} words</p>
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

        <main className="flex-grow flex flex-col overflow-y-auto">
          <div className="flex-shrink-0 border-b border-border bg-background flex items-center px-2">
            <Button variant="outline" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => setIsPanelOpen(!isPanelOpen)}>
              {isPanelOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
            </Button>
            <div className="flex items-center space-x-1 p-1 overflow-x-auto">
              {openArticles.map(article => (
                <button key={article.id} onClick={() => setActiveArticleId(article.id)} className={cn("flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors flex-shrink-0", activeArticleId === article.id ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50")}>
                  <span>{article.title}</span>
                  <X className="w-3 h-3 rounded-full hover:bg-destructive/20" onClick={(e) => handleCloseTab(e, article.id)} />
                </button>
              ))}
            </div>
          </div>
          <Editor ref={editorRef} key={currentArticle?.id || 'no-article'} currentArticle={currentArticle} onArticleUpdate={onArticleUpdate} onMarkdownChange={setMarkdownContent} />
        </main>
      </div>
      {diffData && <DiffViewerDialog isOpen={isDiffDialogOpen} onClose={() => setIsDiffDialogOpen(false)} oldContent={diffData.old} newContent={diffData.new} onAccept={handleAcceptChanges} />}
      <ChatDialog 
        isOpen={isChatDialogOpen} 
        onClose={() => setIsChatDialogOpen(false)} 
        currentArticle={currentArticle} 
        onEdit={handleAiEdit} 
        articleMarkdown={markdownContent} 
        conversationId={conversationId} 
        setConversationId={setConversationId}
        onResearchComplete={handleResearchComplete}
        onGenerateComplete={handleGenerateComplete}
      />
    </div>
  );
};

export default Home;