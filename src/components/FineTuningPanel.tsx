import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Sparkles, Upload, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useAI } from "@/hooks/useAI";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export const FineTuningPanel = () => {
  const { fineTuneModel, loading } = useAI();
  const [showDialog, setShowDialog] = useState(false);
  const [trainingData, setTrainingData] = useState("");
  const modelName = "gemini-2.5-flash";
  const [fineTuningStatus, setFineTuningStatus] = useState<'idle' | 'training' | 'completed' | 'error'>('idle');

  const handleFineTuning = async () => {
    if (!trainingData.trim()) {
      toast.error('Please provide training data');
      return;
    }

    setFineTuningStatus('training');
    try {
      const response = await fineTuneModel(trainingData, modelName);
      if (response) {
        setFineTuningStatus('completed');
        setShowDialog(false);
        setTrainingData("");
        toast.success('Fine-tuning completed! The AI will now use your custom writing style.');
      }
    } catch (error) {
      setFineTuningStatus('error');
      toast.error('Fine-tuning failed. Please try again.');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/plain') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setTrainingData(content);
        toast.success('File uploaded successfully');
      };
      reader.readAsText(file);
    } else {
      toast.error('Please upload a text file (.txt)');
    }
  };

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Sparkles className="w-5 h-5" />
              <span className="sr-only">Fine-tune AI</span>
              {fineTuningStatus === 'completed' && (
                <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
              )}
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>Fine-tune AI</p>
        </TooltipContent>
      </Tooltip>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Fine-tune AI Model</DialogTitle>
          <DialogDescription>
            Fine-tuning customizes the powerful gemini-2.5-flash model to match your unique writing style. 
            Provide examples of your best writing, and the AI will learn to emulate your tone, 
            structure, and approach for more personalized content generation.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 pt-4">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Model Name</label>
              <Input
                value="gemini-2.5-flash"
                disabled
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Training Data</label>
              <div className="mt-1 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept=".txt"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload">
                    <Button variant="outline" size="sm" asChild>
                      <span>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Text File
                      </span>
                    </Button>
                  </label>
                  <span className="text-xs text-muted-foreground">
                    Or paste your content below
                  </span>
                </div>
                
                <Textarea
                  value={trainingData}
                  onChange={(e) => setTrainingData(e.target.value)}
                  placeholder="Paste examples of your writing style here. Include multiple articles or content pieces that represent how you want the AI to write..."
                  className="min-h-[200px]"
                />
                
                <p className="text-xs text-muted-foreground">
                  Tip: Provide 3-5 examples of your best writing (1000+ words total) for optimal results.
                </p>
              </div>
            </div>
          </div>

          {fineTuningStatus !== 'idle' && (
            <Card className="p-4">
              <div className="flex items-center space-x-2">
                {fineTuningStatus === 'training' && (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Training in progress...</span>
                  </>
                )}
                {fineTuningStatus === 'completed' && (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-green-700">Fine-tuning completed successfully!</span>
                  </>
                )}
                {fineTuningStatus === 'error' && (
                  <>
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span className="text-sm text-red-700">Fine-tuning failed. Please try again.</span>
                  </>
                )}
              </div>
            </Card>
          )}

          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              onClick={() => setShowDialog(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleFineTuning}
              disabled={!trainingData.trim() || loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Training...
                </>
              ) : (
                'Start Fine-tuning'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};