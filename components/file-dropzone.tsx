"use client";

import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { X, type LucideIcon } from "lucide-react";

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface FileDropzoneProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  multiple?: boolean;
  // File validation
  isValidFile: (file: File) => boolean;
  // Input accept string
  accept: string;
  // Display
  icon: LucideIcon;
  fileLabel: string;       // e.g. "an image" / "images" / "a PDF" / "PDFs"
  fileTypeHint: string;    // e.g. "PNG, JPG, WEBP supported" / "PDF files only"
  ariaLabel?: string;
}

export function FileDropzone({
  files,
  onFilesChange,
  multiple = false,
  isValidFile,
  accept,
  icon: Icon,
  fileLabel,
  fileTypeHint,
  ariaLabel,
}: FileDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback(
    (incoming: File[]) => {
      const valid = incoming.filter(isValidFile);
      if (multiple) {
        onFilesChange([...files, ...valid]);
      } else {
        onFilesChange(valid.slice(0, 1));
      }
    },
    [files, multiple, isValidFile, onFilesChange]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      addFiles(Array.from(e.dataTransfer.files));
    },
    [addFiles]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      addFiles(Array.from(e.target.files ?? []));
      e.target.value = "";
    },
    [addFiles]
  );

  const handleRemove = useCallback(
    (index: number) => {
      onFilesChange(files.filter((_, i) => i !== index));
    },
    [files, onFilesChange]
  );

  const isEmpty = files.length === 0;

  return (
    <div className="flex flex-col gap-3">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => isEmpty && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && isEmpty) {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        aria-label={ariaLabel ?? `Drop zone for ${fileLabel}`}
        className={[
          "relative flex min-h-[180px] flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-8 transition-all",
          isDragOver
            ? "border-primary bg-primary/5 cursor-copy"
            : isEmpty
              ? "border-muted-foreground/25 hover:border-muted-foreground/40 hover:bg-muted/30 cursor-pointer"
              : "border-primary/30 bg-muted/30 cursor-default",
        ].join(" ")}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleInputChange}
          className="sr-only"
          aria-label={`Select ${fileLabel}`}
        />

        {isEmpty ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex size-14 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <Icon className="size-6" />
            </div>
            <div className="flex flex-col gap-1.5">
              <p className="text-sm text-foreground">
                <span className="font-medium text-primary">
                  Click to select {fileLabel}
                </span>{" "}
                or drag and drop
              </p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {fileTypeHint}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex w-full flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">
                {files.length} file{files.length !== 1 ? "s" : ""} selected
              </p>
              <div className="flex items-center gap-1">
                {multiple && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      inputRef.current?.click();
                    }}
                  >
                    Add more
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onFilesChange([]);
                  }}
                >
                  Clear
                </Button>
              </div>
            </div>

            <div className="flex max-h-[240px] flex-col gap-1.5 overflow-y-auto">
              {files.map((file, i) => (
                <div
                  key={`${file.name}-${i}`}
                  className="flex items-center gap-3 rounded-lg bg-muted/60 px-3 py-2.5"
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Icon className="size-4" />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <p className="truncate text-sm font-medium text-foreground">
                      {file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(i);
                    }}
                    aria-label={`Remove ${file.name}`}
                  >
                    <X className="size-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
