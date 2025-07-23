import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bot, User, Send, Lightbulb, Search, Edit3, Loader2, Globe } from "lucide-react";
import { useAI } from "@/hooks/useAI";
import { useAuth } from "@/hooks/useAuth";
import { Article } from "@/hooks/useArticle";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string | React.ReactNode;
  timestamp: Date;
}

interface ChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentArticle?: Article | null;
  onResearchComplete?: (data: any) => void;
  onGenerateComplete?: (content: string) => void;
  onEdit?: (markdown: string) => void;
  articleMarkdown?: string;
  conversationId: string | null;
  setConversationId: (id: string | null) => void;
}

const AiLoadingIndicator = () => (
  <div className="flex items-center space-x-2 p-2 text-sm text-muted-foreground">
    <Loader2 className="w-4 h-4 animate-spin" />
    <span>Mithoo is thinking...</span>
  </div>
);

export const ChatDialog = ({ 
  isOpen, 
  onClose, 
  currentArticle, 
  onResearchComplete, 
  onGenerateComplete, 
  onEdit, 
  articleMarkdown,
  conversationId,
  setConversationId
}: ChatDialogProps) => {
  const { user } = useAuth();
  const { chatWithAI, researchTopic, generateArticle, loading, getConversation } = useAI();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [enableSearch, setEnableSearch] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadHistory = async () => {
      if (conversationId) {
        const history = await getConversation(conversationId) as any[];
        const formattedHistory: Message[] = history.map((msg: any, index: number) => ({
          id: `${conversationId}-${index}`,
          role: msg.role,
          content: msg.content,
          timestamp: new Date()
        }));
        setMessages(formattedHistory.length > 0 ? formattedHistory : [{ id: '1', role: 'assistant', content: "Hello! How can I help with this article?", timestamp: new Date() }]);
      } else {
        setMessages([{ id: '1', role: 'assistant', content: "Hello! How can I help with this article?", timestamp: new Date() }]);
      }
    };
    if (isOpen) loadHistory();
  }, [conversationId, isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || loading || !user) return;
    
    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: inputValue, timestamp: new Date() };
    const messageContent = inputValue;
    setInputValue("");
    
    const tempAiMessage: Message = { id: `temp-ai-${Date.now()}`, role: 'assistant', content: <AiLoadingIndicator />, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage, tempAiMessage]);
    
    try {
      const response = await chatWithAI(messageContent, conversationId || undefined, currentArticle?.id, articleMarkdown, enableSearch);
      if (response) {
        let aiMessage: Message;
        if (response.type === 'edit' && onEdit) {
          onEdit(response.newContent);
          aiMessage = { id: (Date.now() + 1).toString(), role: 'assistant', content: response.explanation, timestamp: new Date() };
        } else {
          aiMessage = { id: (Date.now() + 1).toString(), role: 'assistant', content: response.content, timestamp: new Date() };
        }
        setMessages(prev => prev.map(msg => msg.id === tempAiMessage.id ? aiMessage : msg));
        setConversationId(response.conversationId);
      } else {
        throw new Error("No response from AI");
      }
    } catch (error) {
      const errorMessage: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: "Sorry, I couldn't get a response. Please try again.", timestamp: new Date() };
      setMessages(prev => prev.map(msg => msg.id === tempAiMessage.id ? errorMessage : msg));
    }
  };

  const handleQuickAction = async (action: 'research' | 'generate') => {
    if (!currentArticle || !user || loading) {
      toast.error("Please open an article first.");
      return;
    }

    if (action === 'research') {
      toast.info("Starting research on: " + currentArticle.title);
      try {
        const researchData = await researchTopic(currentArticle.title, []);
        if (onResearchComplete) onResearchComplete(researchData);
        toast.success("Research complete!");
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: `I've finished researching "${currentArticle.title}". The findings have been saved. You can now ask me to generate the article.`, timestamp: new Date() }]);
      } catch (error) {
        toast.error("Research failed. Please try again.");
      }
    }

    if (action === 'generate') {
      if (!currentArticle.research_data) {
        toast.error("Please complete research before generating an article.");
        return;
      }
      toast.info("Generating article based on research...");
      try {
        const result = await generateArticle(currentArticle.title, undefined, JSON.stringify(currentArticle.research_data));
        if (onGenerateComplete && result.content) {
          onGenerateComplete(result.content);
          toast.success("Article generated and updated!");
          setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: "I've generated the article based on your research and updated the editor.", timestamp: new Date() }]);
        }
      } catch (error) {
        toast.error("Article generation failed.");
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle>AI Assistant</DialogTitle>
          <DialogDescription>Your AI command center. Research, write, and edit your article.</DialogDescription>
        </DialogHeader>
        <div className="h-full bg-transparent flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border">
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" onClick={() => handleQuickAction('research')} disabled={loading || !currentArticle}>
                <Search className="w-4 h-4 mr-2" />
                Research Topic
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleQuickAction('generate')} disabled={loading || !currentArticle || !currentArticle.research_data}>
                <Bot className="w-4 h-4 mr-2" />
                Generate Article
              </Button>
            </div>
          </div>
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4 pr-4">
              {messages.map((message) => (
                <div key={message.id} className="flex items-start space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${message.role === 'assistant' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
                    {message.role === 'assistant' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>
                  <Card className={cn("p-3 max-w-[calc(100%-3rem)]", message.role === 'assistant' ? 'bg-ai-message border-border' : 'bg-secondary user-prompt')}>
                    <div className="text-sm leading-relaxed break-words">{message.content}</div>
                    <span className="text-xs opacity-70 mt-2 block">{message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </Card>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
          <div className="p-4 border-t border-border">
            <div className="flex items-center space-x-2 mb-3">
              <Switch 
                id="enable-search" 
                checked={enableSearch} 
                onCheckedChange={setEnableSearch}
              />
              <Label htmlFor="enable-search" className="flex items-center space-x-2 text-sm">
                <Globe className="w-4 h-4" />
                <span>Enable web search</span>
              </Label>
            </div>
            <div className="flex space-x-2">
              <Input value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="Ask for edits or brainstorm ideas..." className="flex-1 bg-background" onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} />
              <Button size="sm" onClick={handleSendMessage} disabled={!inputValue.trim() || loading} className="px-3">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};