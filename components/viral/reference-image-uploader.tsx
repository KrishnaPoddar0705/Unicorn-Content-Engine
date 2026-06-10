"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ReferenceImage, StyleProfile } from "@/lib/supabase/types";

export function ReferenceImageUploader({
  images,
  styleProfiles,
  selectedImageId,
  selectedProfileId,
  onSelectImage,
  onSelectProfile,
  onImageUploaded,
  onProfileExtracted,
}: {
  images: ReferenceImage[];
  styleProfiles: StyleProfile[];
  selectedImageId: string | null;
  selectedProfileId: string | null;
  onSelectImage: (id: string | null) => void;
  onSelectProfile: (id: string | null) => void;
  onImageUploaded: (image: ReferenceImage) => void;
  onProfileExtracted: (profile: StyleProfile) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/viral/reference-images", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Upload failed");
      onImageUploaded(json.image);
      onSelectImage(json.image.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const extractStyle = async () => {
    if (!selectedImageId) return;
    setExtracting(true);
    setError(null);
    try {
      const res = await fetch("/api/viral/style-extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference_image_id: selectedImageId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Style extraction failed");
      onProfileExtracted(json.profile);
      onSelectProfile(json.profile.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Style extraction failed");
    } finally {
      setExtracting(false);
    }
  };

  const existingProfileForImage = styleProfiles.find(
    (p) => p.reference_image_id === selectedImageId
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {images.map((img) => (
          <button
            key={img.id}
            type="button"
            onClick={() => {
              onSelectImage(img.id === selectedImageId ? null : img.id);
              const profile = styleProfiles.find((p) => p.reference_image_id === img.id);
              onSelectProfile(profile?.id ?? null);
            }}
            className={cn(
              "relative h-24 w-24 overflow-hidden rounded-xl border-2 transition-colors",
              img.id === selectedImageId ? "border-primary" : "border-border hover:border-primary/50"
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.public_url} alt={img.filename} className="h-full w-full object-cover" />
          </button>
        ))}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
        >
          {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
          <span className="text-[10px]">Upload</span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) upload(file);
            e.target.value = "";
          }}
        />
      </div>

      {selectedImageId && (
        <div className="flex items-center gap-3">
          {existingProfileForImage || selectedProfileId ? (
            <span className="text-sm text-muted-foreground">
              Style profile ready:{" "}
              <span className="text-foreground">
                {styleProfiles.find((p) => p.id === selectedProfileId)?.name ||
                  existingProfileForImage?.name ||
                  "Extracted style"}
              </span>
            </span>
          ) : (
            <Button type="button" variant="outline" size="sm" onClick={extractStyle} disabled={extracting}>
              {extracting ? (
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              ) : (
                <Wand2 className="mr-1 h-3 w-3" />
              )}
              {extracting ? "Extracting style…" : "Extract style from image"}
            </Button>
          )}
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
