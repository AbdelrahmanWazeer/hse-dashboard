"use client";

import * as React from "react";
import { Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type ImageUploaderProps = {
  value: string[];
  onChange: (urls: string[]) => void;
  max?: number;
  hint?: string;
};

export function ImageUploader({ value, onChange, max = 5, hint }: ImageUploaderProps) {
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const full = value.length >= max;

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    const images = [...files].filter((f) => f.type.startsWith("image/"));
    if (images.length === 0) {
      setError("Only image files can be uploaded.");
      return;
    }
    const slots = Math.max(0, max - value.length);
    const selected = images.slice(0, slots);
    if (selected.length < images.length) {
      setError(slots === 0 ? `A maximum of ${max} photo(s) is allowed.` : `Only ${slots} more photo(s) can be added.`);
    }

    setUploading(true);
    const uploaded: string[] = [];
    try {
      for (const file of selected) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.url) {
          setError(data?.error ?? "Upload failed. Please try again.");
          continue;
        }
        uploaded.push(data.url);
      }
      if (uploaded.length > 0) onChange([...value, ...uploaded]);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      {value.length > 0 && (
        <div className="mb-2 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {value.map((url, i) => (
            <div key={`${url}-${i}`} className="group relative aspect-video overflow-hidden rounded-lg border bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Upload ${i + 1}`} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => onChange(value.filter((_, j) => j !== i))}
                className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition group-hover:opacity-100"
                aria-label={`Remove photo ${i + 1}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
      {!full && (
        <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => inputRef.current?.click()}>
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {uploading ? "Uploading…" : value.length > 0 ? "Add photos" : "Upload photos"}
        </Button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
      {hint && !error && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}