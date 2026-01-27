'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';
import { Loader2, Check, X, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Change {
  type: string;
  action: string;
  data: any;
}

interface ProposalData {
  action: string;
  summary: string;
  changes: Change[];
}

interface AIProposalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  proposal: ProposalData | null;
  onConfirm: () => Promise<void>;
}

export function AIProposalDialog({
  isOpen,
  onClose,
  proposal,
  onConfirm,
}: AIProposalDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  if (!proposal) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-indigo-500">AI Proposal</span>
          </DialogTitle>
          <DialogDescription>{proposal.summary}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 p-4 border rounded-md bg-muted/50 overflow-y-auto max-h-96">
          <div className="space-y-4">
            {proposal.changes.map((change, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 bg-background rounded-lg border"
              >
                <div
                  className={cn(
                    'p-2 rounded-full',
                    change.action === 'create'
                      ? 'bg-green-500/10 text-green-500'
                      : change.action === 'update'
                        ? 'bg-blue-500/10 text-blue-500'
                        : change.action === 'delete'
                          ? 'bg-red-500/10 text-red-500'
                          : 'bg-gray-500/10 text-gray-500'
                  )}
                >
                  {change.action === 'create' ? (
                    <Check className="h-4 w-4" />
                  ) : change.action === 'delete' ? (
                    <X className="h-4 w-4" />
                  ) : (
                    <ArrowRight className="h-4 w-4" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium capitalize">
                    {change.action} {change.type}
                  </p>
                  <pre className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">
                    {JSON.stringify(change.data, null, 2)}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isProcessing}
            className="bg-gradient-to-r from-indigo-500 to-violet-500 text-white"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Executing...
              </>
            ) : (
              'Confirm & Execute'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
