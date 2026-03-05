import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import QuoteForm from "./QuoteForm";

interface QuoteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const QuoteModal = ({ open, onOpenChange }: QuoteModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-primary">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary-foreground">
            Request A Quote
          </DialogTitle>
        </DialogHeader>
        <QuoteForm />
      </DialogContent>
    </Dialog>
  );
};

export default QuoteModal;
