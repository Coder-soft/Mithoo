import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Bot, User, Send, Lightbulb, Search, Edit3, Loader2 } from "lucide-react";
import { useAI } from "@/hooks/useAI";
import { useAuth } from "@/hooks/useAuth";
import { Article } from "@/hooks/useArticle";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

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
  onEdit?: (markdown: string) => void;
  articleMarkdown?: string;
  conversationId: string | null;
  setConversationId: (id: string | null) => void;
}

const AiLoadingIndicator = () => (
  <div className="flex items-center space-x-1 p-2">
    <span className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></span>
    <span className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></span>
    <span className="w-2 h-2 bg-current rounded-full animate-bounce"></span>
  </div>
);

export const ChatDialog = ({ 
  isOpen, 
  onClose, 
  currentArticle, 
  onEdit, 
  articleMarkdown,
  conversationId,
  setConversationId
}: ChatDialogProps) => {
  const { user } = useAuth();
  const { chatWithAI, loading, getConversation } = useAI();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
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
      const response = await chatWithAI(messageContent, conversationId || undefined, currentArticle?.id, articleMarkdown);
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle>AI Assistant</DialogTitle>
          <DialogDescription>Chat with your AI assistant. Press Ctrl+L to open/close.</DialogDescription>
        </DialogHeader>
        <div className="h-full bg-transparent flex flex-col overflow-hidden">
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
            <div className="flex space-x-2">
              <Input value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="Ask me anything..." className="flex-1 bg-background" onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} />
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