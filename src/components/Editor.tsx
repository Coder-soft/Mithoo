import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Bold, Italic, List, Quote, Undo, Redo, Save, Eye, BookOpen } from "lucide-react";

export const Editor = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [wordCount, setWordCount] = useState(0);

  const handleContentChange = (value: string) => {
    setContent(value);
    setWordCount(value.trim().split(/\s+/).filter(word => word.length > 0).length);
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Editor Header */}
      <div className="p-6 border-b border-border bg-editor-background">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Badge variant="secondary" className="text-xs">
              Draft
            </Badge>
            <span className="text-sm text-muted-foreground">
              {wordCount} words
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm">
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
            <Button variant="ghost" size="sm">
              <BookOpen className="w-4 h-4 mr-2" />
              Research
            </Button>
            <Button variant="premium" size="sm" className="shadow-subtle">
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          </div>
        </div>
        
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter your article title..."
          className="text-2xl font-bold border-none bg-transparent text-editor-foreground placeholder:text-muted-foreground px-0 focus-visible:ring-0"
        />
      </div>

      {/* Toolbar */}
      <div className="p-4 border-b border-border bg-editor-background">
        <div className="flex items-center space-x-1">
          <Button variant="ghost" size="sm" className="px-2">
            <Bold className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="px-2">
            <Italic className="w-4 h-4" />
          </Button>
          <div className="w-px h-6 bg-border mx-2" />
          <Button variant="ghost" size="sm" className="px-2">
            <List className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="px-2">
            <Quote className="w-4 h-4" />
          </Button>
          <div className="w-px h-6 bg-border mx-2" />
          <Button variant="ghost" size="sm" className="px-2">
            <Undo className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="px-2">
            <Redo className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 bg-editor-background">
        <div className="max-w-4xl mx-auto p-8">
          <Card className="min-h-[600px] p-8 border-none shadow-none bg-transparent">
            <Textarea
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="Start writing your article... 

You can ask the AI for help with research, outlines, or content suggestions at any time."
              className="min-h-[500px] border-none resize-none text-base leading-relaxed bg-transparent focus-visible:ring-0 text-editor-foreground placeholder:text-muted-foreground"
            />
          </Card>
        </div>
      </div>

      {/* AI Suggestions Panel */}
      {content.length > 50 && (
        <div className="p-4 border-t border-border bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-sm font-medium text-foreground mb-2 flex items-center">
              <BookOpen className="w-4 h-4 mr-2 text-primary" />
              AI Suggestions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Card className="p-3 hover:shadow-subtle transition-all cursor-pointer">
                <p className="text-xs text-muted-foreground mb-1">Research</p>
                <p className="text-sm font-medium">Add supporting statistics</p>
              </Card>
              <Card className="p-3 hover:shadow-subtle transition-all cursor-pointer">
                <p className="text-xs text-muted-foreground mb-1">Structure</p>
                <p className="text-sm font-medium">Improve paragraph flow</p>
              </Card>
              <Card className="p-3 hover:shadow-subtle transition-all cursor-pointer">
                <p className="text-xs text-muted-foreground mb-1">Style</p>
                <p className="text-sm font-medium">Enhance readability</p>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};