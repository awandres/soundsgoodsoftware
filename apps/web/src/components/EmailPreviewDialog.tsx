"use client";

import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Button,
  Badge,
  Spinner,
} from "@soundsgood/ui";
import {
  Monitor,
  Smartphone,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Send,
  X,
  RefreshCw,
} from "lucide-react";

interface ContrastWarning {
  type: "error" | "warning";
  location: string;
  message: string;
  currentRatio: number;
  requiredRatio: number;
  suggestion?: string;
}

interface EmailPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  emailHtml: string;
  warnings: ContrastWarning[];
  isLoading?: boolean;
  onSend: () => void;
  onRefresh?: () => void;
  isSending?: boolean;
}

export function EmailPreviewDialog({
  open,
  onOpenChange,
  emailHtml,
  warnings,
  isLoading = false,
  onSend,
  onRefresh,
  isSending = false,
}: EmailPreviewDialogProps) {
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Update iframe content when HTML changes
  useEffect(() => {
    if (iframeRef.current && emailHtml) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(emailHtml);
        doc.close();
      }
    }
  }, [emailHtml]);

  const errorCount = warnings.filter(w => w.type === "error").length;
  const warningCount = warnings.filter(w => w.type === "warning").length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[95vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            Email Preview
            {!isLoading && warnings.length === 0 && (
              <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                <CheckCircle className="h-3 w-3 mr-1" />
                Looks good!
              </Badge>
            )}
            {errorCount > 0 && (
              <Badge variant="destructive">
                <AlertCircle className="h-3 w-3 mr-1" />
                {errorCount} {errorCount === 1 ? "issue" : "issues"}
              </Badge>
            )}
            {warningCount > 0 && errorCount === 0 && (
              <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {warningCount} {warningCount === 1 ? "warning" : "warnings"}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Preview how the invitation email will appear to your client
          </DialogDescription>
        </DialogHeader>

        {/* View Mode Toggle */}
        <div className="flex items-center justify-between py-2 border-b flex-shrink-0">
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            <button
              onClick={() => setViewMode("desktop")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === "desktop"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Monitor className="h-4 w-4" />
              Desktop
            </button>
            <button
              onClick={() => setViewMode("mobile")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === "mobile"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Smartphone className="h-4 w-4" />
              Mobile
            </button>
          </div>
          {onRefresh && (
            <Button variant="ghost" size="sm" onClick={onRefresh} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          )}
        </div>

        {/* Preview Container */}
        <div className="flex-1 overflow-auto min-h-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-96">
              <Spinner size="lg" />
            </div>
          ) : (
            <div className="flex justify-center py-4">
              <div
                className={`bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden shadow-lg transition-all duration-300 ${
                  viewMode === "desktop" ? "w-full max-w-[640px]" : "w-[375px]"
                }`}
              >
                <div className="bg-gray-200 dark:bg-gray-800 px-3 py-2 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <div className="flex-1 bg-white dark:bg-gray-700 rounded px-3 py-1 text-xs text-muted-foreground">
                    Email Preview
                  </div>
                </div>
                <iframe
                  ref={iframeRef}
                  title="Email Preview"
                  className="w-full bg-white"
                  style={{
                    height: viewMode === "desktop" ? "600px" : "700px",
                    border: "none",
                  }}
                  sandbox="allow-same-origin"
                />
              </div>
            </div>
          )}
        </div>

        {/* Warnings Panel */}
        {warnings.length > 0 && (
          <div className="border-t pt-4 flex-shrink-0 max-h-48 overflow-y-auto">
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Accessibility Notes
            </h4>
            <div className="space-y-2">
              {warnings.map((warning, index) => (
                <div
                  key={index}
                  className={`text-sm p-3 rounded-lg ${
                    warning.type === "error"
                      ? "bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800"
                      : "bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {warning.type === "error" ? (
                      <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className={warning.type === "error" ? "text-red-800 dark:text-red-300" : "text-amber-800 dark:text-amber-300"}>
                        <span className="font-medium">{warning.location}:</span> {warning.message}
                      </p>
                      <p className="text-xs mt-1 text-muted-foreground">
                        Contrast ratio: {warning.currentRatio}:1 (required: {warning.requiredRatio}:1)
                      </p>
                      {warning.suggestion && (
                        <p className="text-xs mt-1 text-muted-foreground italic">
                          💡 {warning.suggestion}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t flex-shrink-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSending}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={onSend}
            disabled={isSending || isLoading}
          >
            {isSending ? (
              <>
                <Spinner size="sm" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Invitation
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

