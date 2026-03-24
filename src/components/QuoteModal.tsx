import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import QuoteForm from "./QuoteForm";

interface QuoteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const QuoteModal = ({ open, onOpenChange }: QuoteModalProps) => {
  const [submitted, setSubmitted] = useState(false);

  const handleOpenChange = (newOpen: boolean) => {
    // Keep the modal open after successful submission so the
    // success panel stays visible; only close on explicit user action.
    if (!newOpen && submitted) return;
    if (!newOpen) setSubmitted(false);
    onOpenChange(newOpen);
  };

  const handleClose = () => {
    setSubmitted(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-primary">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary-foreground">
            Request A Quote
          </DialogTitle>
        </DialogHeader>
        <QuoteForm
          onSubmitSuccess={() => setSubmitted(true)}
          onClose={handleClose}
        />
      </DialogContent>
    </Dialog>
  );
};

export default QuoteModal;
