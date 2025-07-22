import React from 'react';
import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
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
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>AI Suggested Changes</DialogTitle>
        </DialogHeader>
        <div className="flex-grow overflow-y-auto">
          <ReactDiffViewer
            oldValue={oldContent}
            newValue={newContent}
            splitView={true}
            compareMethod={DiffMethod.WORDS}
            useDarkTheme={false}
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