import { Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface LegalModalProps {
  trigger: React.ReactNode;
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
  downloadFilename: string;
  downloadContent: string;
}

const LegalModal = ({
  trigger,
  title,
  lastUpdated,
  children,
  downloadFilename,
  downloadContent,
}: LegalModalProps) => {
  const handleDownload = () => {
    const blob = new Blob([downloadContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = downloadFilename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-3xl w-full max-h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
          <div className="flex items-start justify-between pr-8">
            <div>
              <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Custom Showers &mdash; Last updated: {lastUpdated}
              </p>
            </div>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mt-0.5"
            >
              <Download className="h-4 w-4" />
              Download
            </button>
          </div>
        </DialogHeader>
        <div className="overflow-y-auto flex-1 px-6 py-6">
          <div className="prose prose-gray max-w-none space-y-6 text-sm leading-relaxed">
            {children}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LegalModal;
