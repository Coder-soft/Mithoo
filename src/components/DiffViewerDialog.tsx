import React from 'react';
import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer-continued';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface DiffViewerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  oldContent: string;
  newContent: string;
  onAccept: () => void;
}

export const DiffViewerDialog = ({ isOpen, onClose, oldContent, newContent, onAccept }: DiffViewerDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col bg-background/80 backdrop-blur-lg border-border">
        <DialogHeader>
          <DialogTitle>AI Suggested Changes</DialogTitle>
          <DialogDescription>
            Review the changes suggested by the AI. Green indicates additions, and red indicates removals. You can accept or reject these changes.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow overflow-y-auto">
          <ReactDiffViewer
            oldValue={oldContent}
            newValue={newContent}
            splitView={true}
            compareMethod={DiffMethod.WORDS}
            useDarkTheme={true}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Reject</Button>
          <Button onClick={onAccept}>Accept Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};