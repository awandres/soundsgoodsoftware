import { FileText, Download, Eye, Calendar } from "lucide-react";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@soundsgood/ui";

// Mock documents for now (dd- prefix indicates dummy data)
const MOCK_DOCUMENTS = [
  {
    id: "dd-1",
    name: "dd-Service Agreement",
    type: "contract",
    uploadedAt: "2024-11-15",
    fileSize: "dd-245 KB",
  },
  {
    id: "dd-2",
    name: "dd-Project Roadmap",
    type: "roadmap",
    uploadedAt: "2024-11-20",
    fileSize: "dd-1.2 MB",
  },
  {
    id: "dd-3",
    name: "dd-Brand Guidelines",
    type: "other",
    uploadedAt: "2024-11-22",
    fileSize: "dd-3.8 MB",
  },
];

const TYPE_ICONS: Record<string, string> = {
  contract: "📄",
  roadmap: "🗺️",
  invoice: "💰",
  proposal: "📋",
  other: "📎",
};

const TYPE_COLORS: Record<string, string> = {
  contract: "bg-blue-100 text-blue-700",
  roadmap: "bg-purple-100 text-purple-700",
  invoice: "bg-green-100 text-green-700",
  proposal: "bg-orange-100 text-orange-700",
  other: "bg-gray-100 text-gray-700",
};

export default function DocumentsPage() {
  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
        <p className="mt-2 text-muted-foreground">
          Access your project documents, contracts, and more.
        </p>
      </div>

      {/* Documents list */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Your Documents ({MOCK_DOCUMENTS.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {MOCK_DOCUMENTS.length === 0 ? (
            <div className="py-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">
                No documents available yet.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {MOCK_DOCUMENTS.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center gap-4 py-4 first:pt-0 last:pb-0"
                >
                  {/* Icon */}
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted text-2xl">
                    {TYPE_ICONS[doc.type] || "📎"}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{doc.name}</h3>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${TYPE_COLORS[doc.type]}`}
                      >
                        {doc.type}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(doc.uploadedAt).toLocaleDateString()}
                      </span>
                      <span>{doc.fileSize}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info card */}
      <Card className="mt-6">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">Need a document?</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                If you need access to a specific document or have questions about 
                any of the files above, please contact us and we&apos;ll help you out.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

