"use client";

import { useState, useCallback, useEffect, KeyboardEvent } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, ImageIcon, Trash2, X, Tag, Info, Save, Clock } from "lucide-react";
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

// Staged file with preview
interface StagedFile {
  file: File;
  preview: string;
  id: string;
}

const CATEGORIES = [
  { value: "uncategorized", label: "Uncategorized" },
  { value: "trainer", label: "Trainer Photos" },
  { value: "facility", label: "Facility" },
  { value: "event", label: "Events" },
  { value: "marketing", label: "Marketing" },
  { value: "team", label: "Team" },
  { value: "other", label: "Other" },
];

// Industry-specific suggested tags for personal trainers
const SUGGESTED_TAGS = [
  // Training types
  "personal training",
  "one-on-one training",
  "group fitness",
  "strength training",
  "cardio workout",
  "HIIT",
  "functional training",
  "weight loss",
  "muscle building",
  // Recovery & wellness
  "recovery",
  "stretching",
  "mobility",
  "flexibility",
  "massage therapy",
  "foam rolling",
  "cool down",
  "warm up",
  // Equipment & facility
  "gym equipment",
  "free weights",
  "dumbbells",
  "kettlebells",
  "resistance bands",
  "treadmill",
  "gym facility",
  "training studio",
  // People & action
  "fitness trainer",
  "certified trainer",
  "client workout",
  "exercise demonstration",
  "proper form",
  "fitness motivation",
  // Specialty
  "senior fitness",
  "athletic training",
  "sports performance",
  "nutrition coaching",
  "body transformation",
  "before and after",
];

interface Photo {
  id: string;
  fileName: string;
  fileUrl: string;
  category: string;
  fileSize?: number;
  createdAt?: string;
  notes?: string;
  tags?: string[];
  altText?: string;
}

export default function PhotosPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("uncategorized");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);

  // Filter suggestions based on input and already selected tags
  const filteredSuggestions = SUGGESTED_TAGS.filter(
    (suggestion) =>
      !tags.includes(suggestion) &&
      suggestion.toLowerCase().includes(tagInput.toLowerCase())
  ).slice(0, 12); // Show max 12 suggestions when filtering

  // Fetch existing photos
  useEffect(() => {
    fetchPhotos();
  }, []);

  // Cleanup preview URLs when component unmounts or files change
  useEffect(() => {
    return () => {
      stagedFiles.forEach((sf) => URL.revokeObjectURL(sf.preview));
    };
  }, [stagedFiles]);

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

  // Tag management functions
  const addTag = (tag: string) => {
    const trimmedTag = tag.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
    }
  };

  const addMultipleTags = (input: string) => {
    // Split by comma and add each tag
    const newTags = input
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t && !tags.includes(t));
    
    if (newTags.length > 0) {
      setTags([...tags, ...newTags]);
    }
    setTagInput("");
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addMultipleTags(tagInput);
    } else if (e.key === "Backspace" && !tagInput && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  // Stage files when dropped (don't upload yet)
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newStagedFiles = acceptedFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      id: `${file.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    }));
    setStagedFiles((prev) => [...prev, ...newStagedFiles]);
  }, []);

  // Remove a staged file
  const removeStagedFile = (id: string) => {
    setStagedFiles((prev) => {
      const fileToRemove = prev.find((sf) => sf.id === id);
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter((sf) => sf.id !== id);
    });
  };

  // Clear all staged files
  const clearStagedFiles = () => {
    stagedFiles.forEach((sf) => URL.revokeObjectURL(sf.preview));
    setStagedFiles([]);
  };

  // Actually upload the staged files
  const handleUpload = async () => {
    if (stagedFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress(stagedFiles.map((sf) => sf.file.name));

    for (const stagedFile of stagedFiles) {
      const file = stagedFile.file;
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

        // Step 3: Save metadata to our database (with notes and tags)
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
            notes: notes || null,
            tags: tags.length > 0 ? tags : [],
            altText: tags.length > 0 ? tags.join(", ") : null,
          }),
        });

        if (!saveResponse.ok) {
          throw new Error("Failed to save photo metadata");
        }

        const { photo } = await saveResponse.json();
        setPhotos((prev) => [photo, ...prev]);

        // Remove from staged after successful upload
        URL.revokeObjectURL(stagedFile.preview);
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error);
        alert(`Failed to upload ${file.name}. Please try again.`);
      }
    }

    setIsUploading(false);
    setUploadProgress([]);
    setStagedFiles([]);
    // Reset notes and tags after upload
    setNotes("");
    setTags([]);
  };

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
            <Label className="mb-2 block">Category</Label>
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
          </div>

          {/* Staged Files Preview */}
          {stagedFiles.length > 0 && (
            <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50/50 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <span className="font-medium text-amber-900">
                    {stagedFiles.length} photo{stagedFiles.length > 1 ? "s" : ""} ready to upload
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
              
              {/* Staged file previews */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {stagedFiles.map((sf) => (
                  <div key={sf.id} className="relative group">
                    <div className="aspect-square rounded-lg overflow-hidden border-2 border-amber-200 bg-white">
                      <img
                        src={sf.preview}
                        alt={sf.file.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeStagedFile(sf.id)}
                      disabled={isUploading}
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                    <p className="mt-1 text-[10px] text-amber-700 truncate">
                      {sf.file.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Two-column layout: Notes/Tags on left (8 cols), SEO Info on right (4 cols) */}
          <div className="mt-6 grid gap-6 lg:grid-cols-12">
            {/* Left column: Notes and Tags (8/12) */}
            <div className="space-y-4 lg:col-span-8">
              {/* Notes input */}
              <div>
                <Label htmlFor="notes" className="mb-2 block">
                  Notes <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Input
                  id="notes"
                  placeholder="Add any notes about this photo..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={isUploading}
                />
              </div>

              {/* Tags input with suggestions */}
              <div>
                <Label htmlFor="tags" className="mb-2 block">
                  <span className="flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5" />
                    SEO Tags <span className="text-muted-foreground font-normal">(optional)</span>
                  </span>
                </Label>
                
                {/* Tag input field */}
                <div className="rounded-md border p-2 focus-within:ring-2 focus-within:ring-ring">
                  <input
                    id="tags"
                    type="text"
                    placeholder="Type tags separated by commas, then press Enter..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    onBlur={() => {
                      if (tagInput) addMultipleTags(tagInput);
                    }}
                    disabled={isUploading}
                    className="w-full bg-transparent outline-none text-sm placeholder:text-muted-foreground"
                  />
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Type multiple tags separated by commas, then press Enter to add them all.
                </p>

                {/* Selected tags - displayed below input */}
                {tags.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Selected tags:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {tags.map((tag) => (
                        <Badge key={tag} className="gap-1 bg-primary text-primary-foreground hover:bg-primary/90">
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-1 rounded-full hover:bg-primary-foreground/20"
                            disabled={isUploading}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggested tags - always visible */}
                <div className="mt-3">
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    {tagInput ? "Matching suggestions:" : "Suggested tags:"}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {(tagInput ? filteredSuggestions : SUGGESTED_TAGS.filter(t => !tags.includes(t)).slice(0, 12)).map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => addTag(suggestion)}
                        disabled={isUploading}
                        className="rounded-full border border-muted-foreground/30 bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
                      >
                        + {suggestion}
                      </button>
                    ))}
                    {!tagInput && SUGGESTED_TAGS.filter(t => !tags.includes(t)).length > 12 && (
                      <span className="px-2 py-1 text-xs text-muted-foreground/60">
                        Type to see more...
                      </span>
                    )}
                    {tagInput && filteredSuggestions.length === 0 && (
                      <span className="px-2 py-1 text-xs text-muted-foreground/60">
                        No matches — press Enter to add &quot;{tagInput}&quot;
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right column: SEO Info (4/12) */}
            <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4 lg:col-span-4">
              <div className="flex gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100">
                  <Info className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900 text-sm">Why categorize and tag your photos?</h3>
                  <div className="mt-2 space-y-2 text-sm text-blue-800">
                    <p>
                      <strong>Better SEO:</strong> Tags become alt-text that search engines use to understand your images, 
                      helping your photos appear in Google Image searches.
                    </p>
                    <p>
                      <strong>Organized content:</strong> Categories help us quickly find the right photos when building 
                      your website pages.
                    </p>
                    <p>
                      <strong>Accessibility:</strong> Alt-text ensures your website is accessible to users with 
                      screen readers.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Save Upload button - shown when files are staged */}
          {stagedFiles.length > 0 && (
            <div className="mt-6 grid gap-6 lg:grid-cols-12">
              <div className="lg:col-span-8 flex justify-end">
                <div className="w-full max-w-[230px]">
                  <Button
                    onClick={handleUpload}
                    disabled={isUploading}
                    className="w-full"
                    size="lg"
                  >
                    {isUploading ? (
                      <>
                        <Spinner size="sm" className="mr-2" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Upload{stagedFiles.length > 1 ? "s" : ""} ({stagedFiles.length})
                      </>
                    )}
                  </Button>
                  
                  {isUploading && (
                    <div className="mt-2 text-xs text-center text-muted-foreground">
                      {uploadProgress.map((name, i) => (
                        <div key={i} className="truncate">Uploading: {name}</div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
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
                  <div className="absolute inset-0 flex flex-col justify-between bg-gradient-to-t from-black/80 via-black/20 to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
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
                    <div className="space-y-1">
                      <p className="truncate text-sm font-medium text-white">
                        {photo.fileName}
                      </p>
                      <p className="text-xs text-white/70 capitalize">
                        {photo.category}
                      </p>
                      {photo.tags && photo.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {photo.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="rounded bg-white/20 px-1.5 py-0.5 text-[10px] text-white"
                            >
                              {tag}
                            </span>
                          ))}
                          {photo.tags.length > 3 && (
                            <span className="text-[10px] text-white/70">
                              +{photo.tags.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
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
