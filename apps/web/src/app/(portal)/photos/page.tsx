"use client";

import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, ImageIcon, Trash2 } from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Spinner,
} from "@soundsgood/ui";

const CATEGORIES = [
  { value: "trainer", label: "Trainer Photos" },
  { value: "facility", label: "Facility" },
  { value: "event", label: "Events" },
  { value: "marketing", label: "Marketing" },
  { value: "team", label: "Team" },
  { value: "other", label: "Other" },
];

interface Photo {
  id: string;
  fileName: string;
  fileUrl: string;
  category: string;
  fileSize?: number;
  createdAt?: string;
}

export default function PhotosPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("trainer");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch existing photos
  useEffect(() => {
    fetchPhotos();
  }, []);

  const fetchPhotos = async () => {
    try {
      const response = await fetch("/api/photos");
      if (response.ok) {
        const data = await response.json();
        setPhotos(data.photos);
      }
    } catch (error) {
      console.error("Failed to fetch photos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setIsUploading(true);
      setUploadProgress(acceptedFiles.map((f) => f.name));

      for (const file of acceptedFiles) {
        try {
          // Step 1: Get presigned URL from our server
          const presignResponse = await fetch(
            `/api/upload?fileName=${encodeURIComponent(file.name)}&fileType=${encodeURIComponent(file.type)}&category=${selectedCategory}`
          );

          if (!presignResponse.ok) {
            throw new Error("Failed to get upload URL");
          }

          const { uploadUrl, publicUrl, fileKey } = await presignResponse.json();

          // Step 2: Upload directly to R2 using presigned URL
          const uploadResponse = await fetch(uploadUrl, {
            method: "PUT",
            body: file,
            headers: {
              "Content-Type": file.type,
            },
          });

          if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            console.error("R2 upload error:", errorText);
            throw new Error("Failed to upload to storage");
          }

          // Step 3: Save metadata to our database
          const saveResponse = await fetch("/api/upload", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              fileKey,
              fileName: file.name,
              fileUrl: publicUrl,
              fileSize: file.size,
              mimeType: file.type,
              category: selectedCategory,
            }),
          });

          if (!saveResponse.ok) {
            throw new Error("Failed to save photo metadata");
          }

          const { photo } = await saveResponse.json();
          setPhotos((prev) => [photo, ...prev]);
        } catch (error) {
          console.error(`Failed to upload ${file.name}:`, error);
          alert(`Failed to upload ${file.name}. Please try again.`);
        }
      }

      setIsUploading(false);
      setUploadProgress([]);
    },
    [selectedCategory]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".webp"],
    },
    disabled: isUploading,
  });

  const deletePhoto = async (id: string) => {
    if (!confirm("Are you sure you want to delete this photo?")) return;

    try {
      const response = await fetch(`/api/photos?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setPhotos((prev) => prev.filter((p) => p.id !== id));
      } else {
        throw new Error("Failed to delete photo");
      }
    } catch (error) {
      console.error("Failed to delete photo:", error);
      alert("Failed to delete photo. Please try again.");
    }
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Photos</h1>
        <p className="mt-2 text-muted-foreground">
          Upload and manage photos for your website.
        </p>
      </div>

      {/* Upload area */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Upload Photos</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Category selector */}
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium">Category</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <Button
                  key={cat.value}
                  variant={selectedCategory === cat.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(cat.value)}
                  disabled={isUploading}
                >
                  {cat.label}
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
            {isUploading ? (
              <div className="flex flex-col items-center gap-3">
                <Spinner size="lg" />
                <p className="text-sm text-muted-foreground">
                  Uploading {uploadProgress.length} file(s)...
                </p>
                <div className="max-w-md text-xs text-muted-foreground">
                  {uploadProgress.map((name, i) => (
                    <div key={i}>• {name}</div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium">
                    {isDragActive ? "Drop files here" : "Drag & drop photos here"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    or click to browse (PNG, JPG, WebP)
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Photo gallery */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Your Photos ({photos.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : photos.length === 0 ? (
            <div className="py-12 text-center">
              <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">
                No photos uploaded yet. Upload your first photo above!
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="group relative aspect-square overflow-hidden rounded-lg border bg-muted"
                >
                  {/* Actual image */}
                  <img
                    src={photo.fileUrl}
                    alt={photo.fileName}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      // Fallback if image fails to load
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                      const parent = target.parentElement;
                      if (parent) {
                        const fallback = parent.querySelector('.fallback-icon');
                        if (fallback) {
                          (fallback as HTMLElement).style.display = 'flex';
                        }
                      }
                    }}
                  />

                  {/* Fallback icon if image doesn't load */}
                  <div className="fallback-icon absolute inset-0 hidden items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                    <ImageIcon className="h-8 w-8 text-slate-400" />
                  </div>

                  {/* Overlay */}
                  <div className="absolute inset-0 flex flex-col justify-between bg-gradient-to-t from-black/60 via-transparent to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
                    <div className="flex justify-end">
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => deletePhoto(photo.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div>
                      <p className="truncate text-sm font-medium text-white">
                        {photo.fileName}
                      </p>
                      <p className="text-xs text-white/70 capitalize">
                        {photo.category}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
