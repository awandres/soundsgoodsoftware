"use client";

import { useState, useCallback, useEffect, KeyboardEvent } from "react";
import { useDropzone } from "react-dropzone";
import {
  FileText,
  Download,
  Eye,
  Calendar,
  Upload,
  Trash2,
  X,
  Clock,
  Save,
  ExternalLink,
} from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Spinner,
  Input,
  Label,
  Badge,
} from "@soundsgood/ui";

const DOCUMENT_TYPES = [
  { value: "contract", label: "Contract", icon: "📄", color: "bg-blue-100 text-blue-700" },
  { value: "roadmap", label: "Roadmap", icon: "🗺️", color: "bg-purple-100 text-purple-700" },
  { value: "invoice", label: "Invoice", icon: "💰", color: "bg-green-100 text-green-700" },
  { value: "proposal", label: "Proposal", icon: "📋", color: "bg-orange-100 text-orange-700" },
  { value: "other", label: "Other", icon: "📎", color: "bg-gray-100 text-gray-700" },
];

interface Document {
  id: string;
  name: string;
  description?: string;
  type: string;
  fileUrl: string;
  fileKey: string;
  fileSize?: number;
  mimeType?: string;
  createdAt?: string;
}

interface StagedFile {
  file: File;
  id: string;
}

// Format file size for display
function formatFileSize(bytes?: number): string {
  if (!bytes) return "Unknown size";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string[]>([]);
  
  // Upload form state
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [selectedType, setSelectedType] = useState("other");
  const [description, setDescription] = useState("");

  // Fetch existing documents
  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await fetch("/api/documents");
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents);
      }
    } catch (error) {
      console.error("Failed to fetch documents:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Stage files when dropped
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newStagedFiles = acceptedFiles.map((file) => ({
      file,
      id: `${file.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    }));
    setStagedFiles((prev) => [...prev, ...newStagedFiles]);
  }, []);

  // Remove a staged file
  const removeStagedFile = (id: string) => {
    setStagedFiles((prev) => prev.filter((sf) => sf.id !== id));
  };

  // Clear all staged files
  const clearStagedFiles = () => {
    setStagedFiles([]);
  };

  // Upload staged files
  const handleUpload = async () => {
    if (stagedFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress(stagedFiles.map((sf) => sf.file.name));

    for (const stagedFile of stagedFiles) {
      const file = stagedFile.file;
      try {
        // Step 1: Get presigned URL
        const presignResponse = await fetch(
          `/api/documents?fileName=${encodeURIComponent(file.name)}&fileType=${encodeURIComponent(file.type)}&type=${selectedType}`
        );

        if (!presignResponse.ok) {
          throw new Error("Failed to get upload URL");
        }

        const { uploadUrl, publicUrl, fileKey } = await presignResponse.json();

        // Step 2: Upload directly to R2
        const uploadResponse = await fetch(uploadUrl, {
          method: "PUT",
          body: file,
          headers: {
            "Content-Type": file.type,
          },
        });

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload to storage");
        }

        // Step 3: Save metadata to database
        const saveResponse = await fetch("/api/documents", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fileKey,
            name: file.name,
            fileUrl: publicUrl,
            fileSize: file.size,
            mimeType: file.type,
            type: selectedType,
            description: description || null,
          }),
        });

        if (!saveResponse.ok) {
          throw new Error("Failed to save document metadata");
        }

        const { document } = await saveResponse.json();
        setDocuments((prev) => [document, ...prev]);
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error);
        alert(`Failed to upload ${file.name}. Please try again.`);
      }
    }

    setIsUploading(false);
    setUploadProgress([]);
    setStagedFiles([]);
    setDescription("");
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "text/plain": [".txt"],
      "image/*": [".png", ".jpg", ".jpeg", ".webp"],
    },
    disabled: isUploading,
  });

  const deleteDocument = async (id: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    try {
      const response = await fetch(`/api/documents?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setDocuments((prev) => prev.filter((d) => d.id !== id));
      } else {
        throw new Error("Failed to delete document");
      }
    } catch (error) {
      console.error("Failed to delete document:", error);
      alert("Failed to delete document. Please try again.");
    }
  };

  const getTypeConfig = (type: string) => {
    return DOCUMENT_TYPES.find((t) => t.value === type) || DOCUMENT_TYPES[4]; // Default to "other"
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
        <p className="mt-2 text-muted-foreground">
          Upload and manage your project documents, contracts, and more.
        </p>
      </div>

      {/* Upload area */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Upload Documents</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Document type selector */}
          <div className="mb-4">
            <Label className="mb-2 block">Document Type</Label>
            <div className="flex flex-wrap gap-2">
              {DOCUMENT_TYPES.map((type) => (
                <Button
                  key={type.value}
                  variant={selectedType === type.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedType(type.value)}
                  disabled={isUploading}
                >
                  <span className="mr-1.5">{type.icon}</span>
                  {type.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
              isDragActive
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50"
            } ${isUploading ? "cursor-not-allowed opacity-50" : ""}`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-medium">
                  {isDragActive ? "Drop files here" : "Drag & drop documents here"}
                </p>
                <p className="text-sm text-muted-foreground">
                  or click to browse (PDF, DOC, DOCX, XLS, XLSX, TXT, Images)
                </p>
              </div>
            </div>
          </div>

          {/* Staged Files Preview */}
          {stagedFiles.length > 0 && (
            <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50/50 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <span className="font-medium text-amber-900">
                    {stagedFiles.length} document{stagedFiles.length > 1 ? "s" : ""} ready to upload
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearStagedFiles}
                  disabled={isUploading}
                  className="text-amber-700 hover:text-amber-900 hover:bg-amber-100"
                >
                  Clear all
                </Button>
              </div>
              
              {/* Staged file list */}
              <div className="space-y-2 mb-4">
                {stagedFiles.map((sf) => (
                  <div
                    key={sf.id}
                    className="flex items-center justify-between rounded-md bg-white p-2 border border-amber-200"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-lg">{getTypeConfig(selectedType).icon}</span>
                      <span className="text-sm truncate">{sf.file.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({formatFileSize(sf.file.size)})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeStagedFile(sf.id)}
                      disabled={isUploading}
                      className="p-1 rounded hover:bg-red-100 text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Description input */}
              <div className="mb-4">
                <Label htmlFor="description" className="mb-2 block text-amber-900">
                  Description <span className="text-amber-700 font-normal">(optional)</span>
                </Label>
                <Input
                  id="description"
                  placeholder="Add a description for these documents..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isUploading}
                  className="bg-white"
                />
              </div>

              {/* Upload button */}
              <Button
                onClick={handleUpload}
                disabled={isUploading}
                className="w-full"
                size="lg"
              >
                {isUploading ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Uploading {uploadProgress.length} file{uploadProgress.length > 1 ? "s" : ""}...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Upload{stagedFiles.length > 1 ? "s" : ""} ({stagedFiles.length} file{stagedFiles.length > 1 ? "s" : ""})
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documents list */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Your Documents ({documents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : documents.length === 0 ? (
            <div className="py-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">
                No documents uploaded yet. Upload your first document above!
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {documents.map((doc) => {
                const typeConfig = getTypeConfig(doc.type);
                return (
                  <div
                    key={doc.id}
                    className="flex items-center gap-4 py-4 first:pt-0 last:pb-0"
                  >
                    {/* Icon */}
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted text-2xl">
                      {typeConfig.icon}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{doc.name}</h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${typeConfig.color}`}
                        >
                          {doc.type}
                        </span>
                        {doc.createdAt && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(doc.createdAt).toLocaleDateString()}
                          </span>
                        )}
                        <span>{formatFileSize(doc.fileSize)}</span>
                      </div>
                      {doc.description && (
                        <p className="mt-1 text-sm text-muted-foreground truncate">
                          {doc.description}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(doc.fileUrl, "_blank")}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <a href={doc.fileUrl} download={doc.name}>
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </a>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteDocument(doc.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info card */}
      <Card className="mt-6 border-blue-200 bg-blue-50/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900">About your documents</h3>
              <p className="mt-1 text-sm text-blue-800">
                Documents you upload here are securely stored and accessible only to you and your team.
                Use document types to keep things organized — contracts, proposals, invoices, and more.
              </p>
              <p className="mt-2 text-sm text-blue-800">
                Need help with a specific document or have questions? Feel free to reach out and we&apos;ll 
                assist you.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
