import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Bot, User, Send, Lightbulb, Search, Edit3, Loader2 } from "lucide-react";
import { useAI } from "@/hooks/useAI";
import { useAuth } from "@/hooks/useAuth";
import { Article } from "@/hooks/useArticle";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatSidebarProps {
  currentArticle?: Article | null;
  onResearch?: (data: any) => void;
  onGenerate?: (content: string) => void;
}

export const ChatSidebar = ({ currentArticle, onResearch, onGenerate }: ChatSidebarProps) => {
  const { user } = useAuth();
  const { chatWithAI, researchTopic, generateArticle, loading } = useAI();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm your AI writing assistant. I can help you plan, research, and write amazing articles. What would you like to write about today?",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || loading || !user) return;
    
    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, newMessage]);
    const messageContent = inputValue;
    setInputValue("");
    
    try {
      const response = await chatWithAI(
        messageContent, 
        conversationId || undefined, 
        currentArticle?.id
      );
      
      if (response) {
        setConversationId(response.conversationId);
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.response,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiResponse]);
      }
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleQuickAction = async (action: 'ideas' | 'research' | 'revise') => {
    if (!user || loading) return;

    let prompt = '';
    switch (action) {
      case 'ideas':
        prompt = 'Can you help me brainstorm some article ideas and topics that would be engaging and relevant?';
        break;
      case 'research':
        if (currentArticle?.title) {
          // Use dedicated research function
          try {
            const researchData = await researchTopic(
              currentArticle.title, 
              [currentArticle.title.split(' ')[0]], 
              currentArticle.id
            );
            if (onResearch) onResearch(researchData);
            return;
          } catch (error) {
            return;
          }
        } else {
          prompt = 'I need help researching a topic. What information would you like me to gather?';
        }
        break;
      case 'revise':
        if (currentArticle?.content) {
          prompt = `Please review and suggest improvements for this article content: "${currentArticle.content.substring(0, 500)}..."`;
        } else {
          prompt = 'I need help revising my article. What would you like me to help you improve?';
        }
        break;
    }

    if (prompt) {
      setInputValue(prompt);
      // Auto-send the message
      setTimeout(() => handleSendMessage(), 100);
    }
  };

  const handleGenerateFromChat = async () => {
    if (!currentArticle?.title || loading) return;
    
    try {
      const response = await generateArticle(
        currentArticle.title,
        currentArticle.content || undefined,
        currentArticle.research_data?.data,
        currentArticle.id
      );
      
      if (response && onGenerate) {
        onGenerate(response.content);
      }
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  return (
    <div className="w-80 h-full bg-chat-background border-r border-border flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground flex items-center">
          <Bot className="w-5 h-5 mr-2 text-primary" />
          AI Assistant
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Plan, research, and write together
        </p>
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-b border-border">
        <div className="grid grid-cols-3 gap-2 mb-3">
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs" 
            onClick={() => handleQuickAction('ideas')}
            disabled={loading}
          >
            <Lightbulb className="w-3 h-3 mr-1" />
            Ideas
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs" 
            onClick={() => handleQuickAction('research')}
            disabled={loading}
          >
            <Search className="w-3 h-3 mr-1" />
            Research
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs" 
            onClick={() => handleQuickAction('revise')}
            disabled={loading}
          >
            <Edit3 className="w-3 h-3 mr-1" />
            Revise
          </Button>
        </div>
        {currentArticle?.title && (
          <Button 
            variant="premium" 
            size="sm" 
            className="w-full text-xs"
            onClick={handleGenerateFromChat}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            ) : (
              <Bot className="w-3 h-3 mr-1" />
            )}
            Generate Article
          </Button>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className="flex items-start space-x-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.role === 'assistant' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-message-user text-primary-foreground'
              }`}>
                {message.role === 'assistant' ? (
                  <Bot className="w-4 h-4" />
                ) : (
                  <User className="w-4 h-4" />
                )}
              </div>
              <Card className={`p-3 max-w-[calc(100%-3rem)] ${
                message.role === 'assistant' 
                  ? 'bg-message-ai border-border' 
                  : 'bg-primary text-primary-foreground border-primary'
              }`}>
                <p className="text-sm leading-relaxed">{message.content}</p>
                <span className="text-xs opacity-70 mt-2 block">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </Card>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex space-x-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask me anything about your article..."
            className="flex-1 bg-background"
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <Button
            size="sm"
            onClick={handleSendMessage}
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
  );
};