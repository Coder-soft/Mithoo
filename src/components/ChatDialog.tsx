import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Bot,
  User,
  Send,
  Search,
  Loader2,
  Globe,
  Undo,
  RotateCw
} from "lucide-react";
import { useAI } from "@/hooks/useAI";
import { useAuth } from "@/hooks/useAuth";
import { Article } from "@/hooks/useArticle";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface StoredMessage {
  role: 'user' | 'assistant';
  content: string;
  type?: 'edit' | 'generate' | 'research' | 'chat';
}

interface ResearchData {
  sources: Array<{
    title: string;
    url: string;
    summary: string;
  }>;
  keyPoints: string[];
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string | React.ReactNode;
  timestamp: Date;
  type?: 'edit' | 'generate' | 'research' | 'chat';
}

interface ChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentArticle?: Article | null;
  onResearchComplete?: (data: ResearchData) => void;
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
  const [editHistory, setEditHistory] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadHistory = async () => {
      if (conversationId) {
        const historyResponse = await getConversation(conversationId);
        let history: StoredMessage[] = [];
        
        if (Array.isArray(historyResponse)) {
          history = historyResponse.filter(item =>
            item !== null &&
            typeof item === 'object' &&
            (item.role === 'user' || item.role === 'assistant') &&
            typeof item.content === 'string'
          ) as StoredMessage[];
        }
        
        const formattedHistory: Message[] = history.map((msg, index) => ({
          id: `${conversationId}-${index}`,
          role: msg.role,
          content: msg.content,
          timestamp: new Date(),
          type: msg.type
        }));
        setMessages(formattedHistory.length > 0 ? formattedHistory : [{ id: '1', role: 'assistant', content: "Hello! How can I help with this article?", timestamp: new Date() }]);
      } else {
        setMessages([{ id: '1', role: 'assistant', content: "Hello! How can I help with this article?", timestamp: new Date() }]);
      }
    };
    if (isOpen) {
      loadHistory();
      // Initialize edit history with current content
      if (articleMarkdown) {
        setEditHistory([articleMarkdown]);
      }
    }
  }, [conversationId, isOpen, articleMarkdown]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (messageContent: string) => {
    if (!messageContent.trim() || loading || !user) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageContent,
      timestamp: new Date()
    };

    const tempAiMessage: Message = {
      id: `temp-ai-${Date.now()}`,
      role: 'assistant',
      content: <AiLoadingIndicator />,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage, tempAiMessage]);

    try {
      const response = await chatWithAI(
        messageContent,
        conversationId || undefined,
        currentArticle?.id,
        articleMarkdown,
        enableSearch
      );

      if (response) {
        if (articleMarkdown) {
          setEditHistory(prev => [...prev, articleMarkdown]);
        }

        // Handle different response structures more robustly
        let messageToStream = '';
        if (response.type === 'edit') {
          messageToStream = response.explanation || response.content || 'I have made the requested edits.';
        } else {
          messageToStream = response.content || 'I have completed your request.';
        }

        if (messageToStream) {
          let streamedContent = "";
          const tokens = messageToStream.split(" ");
          for (let i = 0; i < tokens.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 50));
            streamedContent += tokens[i] + " ";
            setMessages(prev =>
              prev.map(msg =>
                msg.id === tempAiMessage.id
                  ? {
                      ...msg,
                      content: (
                        <>
                          {streamedContent}
                          <span className="inline-block w-2 h-4 bg-current animate-pulse align-middle ml-1"></span>
                        </>
                      ),
                    }
                  : msg
              )
            );
          }
        }

        const aiMessage: Message = {
          id: tempAiMessage.id,
          role: 'assistant',
          content: messageToStream,
          timestamp: new Date(),
          type: response.type
        };

        setMessages(prev => prev.map(msg =>
          msg.id === tempAiMessage.id ? aiMessage : msg
        ));

        setConversationId(response.conversationId);

        if (response.type === 'edit' && onEdit) {
          onEdit(response.newContent);
        }
      } else {
        throw new Error("No response from AI");
      }
    } catch (error) {
      const err = error as Error;
      const errorMessage: Message = {
        id: tempAiMessage.id,
        role: 'assistant',
        content: (
          <div>
            <p>Sorry, I encountered an error: {err.message || 'Unknown error'}</p>
            <Button
              size="sm"
              variant="outline"
              className="mt-2"
              onClick={() => handleSendMessage(messageContent)}
            >
              <RotateCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        ),
        timestamp: new Date()
      };
      setMessages(prev => prev.map(msg => msg.id === tempAiMessage.id ? errorMessage : msg));
    }
  };

  const submitInput = () => {
    if (!inputValue.trim()) return;
    handleSendMessage(inputValue);
    setInputValue("");
  };

  const handleQuickAction = async (action: 'research' | 'generate') => {
    if (!currentArticle || !user || loading) {
      toast.error("Please open an article first.");
      return;
    }

    const actionMessage: Message = {
      id: `action-${Date.now()}`,
      role: 'assistant',
      content: (
        <div className="flex items-center">
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
          {action === 'research'
            ? `Researching "${currentArticle.title}"...`
            : `Generating article for "${currentArticle.title}"...`}
        </div>
      ),
      timestamp: new Date(),
      type: action
    };
    setMessages(prev => [...prev, actionMessage]);

    try {
      if (action === 'research') {
        const researchData: ResearchData = await researchTopic(currentArticle.title, []);
        if (onResearchComplete) onResearchComplete(researchData);
        
        setMessages(prev => prev.map(msg =>
          msg.id === actionMessage.id
            ? { ...msg, content: `✅ Research complete for "${currentArticle.title}". Findings saved.` }
            : msg
        ));
      }

      if (action === 'generate') {
        if (!currentArticle.research_data) {
          toast.error("Please complete research before generating an article.");
          setMessages(prev => prev.map(msg =>
            msg.id === actionMessage.id
              ? { ...msg, content: "❌ Please complete research before generating." }
              : msg
          ));
          return;
        }
        
        const result = await generateArticle(
          currentArticle.title,
          undefined,
          JSON.stringify(currentArticle.research_data)
        );
        
        if (onGenerateComplete && result.content) {
          if (articleMarkdown) {
            setEditHistory(prev => [...prev, articleMarkdown]);
          }
          
          onGenerateComplete(result.content);
          
          setMessages(prev => prev.map(msg =>
            msg.id === actionMessage.id
              ? { ...msg, content: "✅ Article generated and updated!" }
              : msg
          ));
        }
      }
    } catch (error) {
      const err = error as Error;
      setMessages(prev => prev.map(msg =>
        msg.id === actionMessage.id
          ? {
              ...msg,
              content: (
                <div>
                  <p>❌ {action === 'research' ? 'Research' : 'Generation'} failed: {err.message || 'Unknown error'}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2"
                    onClick={() => handleQuickAction(action)}
                  >
                    <RotateCw className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                </div>
              )
            }
          : msg
      ));
    }
  };

  const handleUndo = () => {
    if (editHistory.length > 1) {
      const previousContent = editHistory[editHistory.length - 2];
      setEditHistory(prev => prev.slice(0, -1));
      if (onEdit && previousContent) {
        onEdit(previousContent);
      }
      toast.success("Last edit undone");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 border-b">
          <div className="flex justify-between items-center">
            <div>
              <DialogTitle>AI Assistant</DialogTitle>
              <DialogDescription>Your AI command center. Research, write, and edit your article.</DialogDescription>
            </div>
            {editHistory.length > 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleUndo}
                disabled={loading}
              >
                <Undo className="w-4 h-4 mr-2" />
                Undo Edit
              </Button>
            )}
          </div>
        </DialogHeader>
        <div className="h-full bg-transparent flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction('research')}
                disabled={loading || !currentArticle}
              >
                {loading && messages.some(m => m.type === 'research') ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Search className="w-4 h-4 mr-2" />
                )}
                Research Topic
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction('generate')}
                disabled={loading || !currentArticle || !currentArticle.research_data}
              >
                {loading && messages.some(m => m.type === 'generate') ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Bot className="w-4 h-4 mr-2" />
                )}
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
                    <div className="text-sm leading-relaxed break-words">
                      {message.content}
                    </div>
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
                disabled={loading}
              />
              <Label htmlFor="enable-search" className="flex items-center space-x-2 text-sm">
                <Globe className="w-4 h-4" />
                <span>Enable web search</span>
              </Label>
            </div>
            <div className="flex space-x-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask for edits or brainstorm ideas..."
                className="flex-1 bg-background"
                onKeyPress={(e) => e.key === 'Enter' && submitInput()}
                disabled={loading}
              />
              <Button
                size="sm"
                onClick={submitInput}
                disabled={!inputValue.trim() || loading}
                className="px-3"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};