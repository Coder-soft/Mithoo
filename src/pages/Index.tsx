import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { ChatSidebar } from "@/components/ChatSidebar";
import { Editor } from "@/components/Editor";
import { useAuth } from "@/hooks/useAuth";
import { useArticle, Article } from "@/hooks/useArticle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, FileText } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const { articles, currentArticle, setCurrentArticle, createArticle, loading: articlesLoading } = useArticle();
  const [showNewArticleDialog, setShowNewArticleDialog] = useState(false);
  const [newArticleTitle, setNewArticleTitle] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!user && !authLoading) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  const handleCreateArticle = async () => {
    if (!newArticleTitle.trim()) return;
    
    const article = await createArticle(newArticleTitle.trim());
    if (article) {
      setCurrentArticle(article);
      setNewArticleTitle("");
      setShowNewArticleDialog(false);
    }
  };

  const handleResearchUpdate = (researchData: any) => {
    if (researchData && currentArticle) {
      toast.success('Research data updated for the article');
    }
  };

  const handleContentGenerated = (content: string) => {
    if (content && currentArticle) {
      toast.success('Article content generated successfully');
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-2">Loading...</h2>
          <p className="text-muted-foreground">Please wait while we check your session.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="h-[calc(100vh-4rem)] flex">
        {/* Sidebar for articles */}
        <div className="w-64 border-r border-border bg-muted/30 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Articles</h3>
            <Dialog open={showNewArticleDialog} onOpenChange={setShowNewArticleDialog}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Article</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Enter article title..."
                    value={newArticleTitle}
                    onChange={(e) => setNewArticleTitle(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleCreateArticle()}
                  />
                  <Button 
                    onClick={handleCreateArticle}
                    disabled={!newArticleTitle.trim() || articlesLoading}
                  >
                    Create Article
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="space-y-2">
            {articles.map((article) => (
              <Card
                key={article.id}
                className={`p-3 cursor-pointer transition-colors hover:bg-accent ${
                  currentArticle?.id === article.id ? 'bg-accent' : ''
                }`}
                onClick={() => setCurrentArticle(article)}
              >
                <div className="flex items-start space-x-2">
                  <FileText className="w-4 h-4 mt-0.5 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{article.title}</h4>
                    <p className="text-xs text-muted-foreground">
                      {article.word_count || 0} words
                    </p>
                  </div>
                </div>
              </Card>
            ))}
            {articles.length === 0 && !articlesLoading && (
              <p className="text-muted-foreground text-sm text-center py-8">
                No articles yet. Create your first article to get started!
              </p>
            )}
          </div>
        </div>

        <ChatSidebar 
          currentArticle={currentArticle}
          onResearch={handleResearchUpdate}
          onGenerate={handleContentGenerated}
        />
        <Editor 
          currentArticle={currentArticle}
          onArticleChange={setCurrentArticle}
        />
      </div>
    </div>
  );
};

export default Index;