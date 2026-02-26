"use client";

import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { FileDropzone } from "./file-dropzone";
import { FileText, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { ResultsTable } from "./results-table";
import type { ApplicationResult } from "@/lib/types";

type ApiResult = {
  status: "success" | "error";
  filename: string;
  data?: Record<string, unknown>;
  error?: string;
  brandNameMatch?: boolean;
  alcoholContentMatch?: boolean;
};

type ApiResponse = {
  results: ApiResult[];
  summary: { total: number; successful: number; failed: number };
};

function isPdf(f: File) {
  return f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf");
}

/**
 * Transform API response data into display-ready ApplicationResult objects
 * 
 * Handles two scenarios:
 * 1. Error results: When PDF processing failed (invalid file, API error, etc.)
 * 2. Success results: When data was successfully extracted from the PDF
 * 
 * @param apiResults - Raw results from the /api/parse endpoint
 * @param files - Original File objects (used to create blob URLs for PDF preview)
 * @returns Array of ApplicationResult objects ready for display in ResultsTable
 * 
 * Key transformations:
 * - Creates object URLs for PDF preview functionality
 * - Converts confidence scores from 0-1 to 0-100 percentage
 * - Determines pass/fail status based on compliance rules
 * - Provides fallback values for missing/error data
 */
function mapResults(apiResults: ApiResult[], files: File[]): ApplicationResult[] {
  return apiResults.map((result, index) => {
    const matchingFile = files.find((f) => f.name === result.filename);
    // Create object URL for in-browser PDF preview
    const pdfUrl = matchingFile ? URL.createObjectURL(matchingFile) : undefined;
    
    if (result.status === "error") {
      return {
        id: `error-${index}-${Date.now()}`,
        filename: result.filename,
        pdfUrl,
        brandName: "Error",
        brandNameConfidence: 0,
        classType: result.error || "Processing failed",
        alcoholContent: "-",
        netContent: "-",
        producer: "-",
        sourceOfProduct: "-",
        governmentWarning: { capital: false, bold: false, spelling: false },
        status: "fail" as const,
        verification: {
          brandName: false,
          alcoholContent: false,
        },
      };
    }

    const data = result.data as Record<
      string,
      { raw_text?: string; confidence?: number; capitalLetters?: boolean; bold?: boolean; spelledCorrectly?: boolean }
    >;

    return {
      id: `result-${index}-${Date.now()}`,
      filename: result.filename,
      pdfUrl,
      brandName: data.brandName?.raw_text || "Unknown",
      brandNameConfidence: Math.round((data.brandName?.confidence || 0) * 100),
      classType: data.classType?.raw_text || "Unknown",
      alcoholContent: data.alcoholContent?.raw_text || "Not found",
      netContent: data.netContent?.raw_text || "Not found",
      producer: data.producer?.raw_text || "Unknown",
      sourceOfProduct: data.sourceOfProduct?.raw_text || "Unknown",
      governmentWarning: {
        capital: data.governmentWarning?.capitalLetters || false,
        bold: data.governmentWarning?.bold || false,
        spelling: data.governmentWarning?.spelledCorrectly || false,
      },
      // Pass criteria: brand name matches + ABV matches + government warning capitalization correct
      status: (result.brandNameMatch && result.alcoholContentMatch && data.governmentWarning.capitalLetters) ? "pass" as const : "fail" as const,
      verification: {
        brandName: result.brandNameMatch ?? false,
        alcoholContent: result.alcoholContentMatch ?? false,
      },
    };
  });
}

export function UploadForm() {
  const [mode, setMode] = useState<"single" | "batch">("single");
  const [singleFile, setSingleFile] = useState<File[]>([]);
  const [batchFiles, setBatchFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState<ApplicationResult[] | null>(null);

  const activeFiles = mode === "single" ? singleFile : batchFiles;
  const canSubmit = !isSubmitting && activeFiles.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setResults(null);

    try {
      const formData = new FormData();
      formData.append("mode", mode);
      formData.append("count", String(activeFiles.length));
      activeFiles.forEach((f) => formData.append("file", f, f.name));

      const response = await axios.post<ApiResponse>("/api/parse", formData);
      const { results: apiResults, summary } = response.data;

      setResults(mapResults(apiResults, activeFiles));

      if (summary.failed > 0) {
        toast.warning(
          `Processed ${summary.successful}/${summary.total} application${summary.total > 1 ? "s" : ""}`,
          { description: `${summary.failed} failed to process` }
        );
      } else {
        toast.success(
          `Successfully processed ${summary.total} application${summary.total > 1 ? "s" : ""}`
        );
      }
    } catch (err) {
      const status = axios.isAxiosError(err) ? err.response?.status : null;
      if (status === 413) {
        toast.error("File too large", {
          description: "Try compressing the PDF before uploading.",
        });
      } else if (status === 429) {
        toast.error("Rate limit exceeded", {
          description: "Too many requests. Please try again in a moment.",
        });
      } else {
        toast.error("Upload failed", {
          description: axios.isAxiosError(err)
            ? (err.response?.data as { error?: string })?.error ?? err.message
            : "Something went wrong. Please try again.",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setResults(null);
    setSingleFile([]);
    setBatchFiles([]);
  };

  if (results) {
    return (
      <div className="flex flex-col gap-6">
        <ResultsTable results={results} />
        <div className="flex justify-center">
          <Button variant="outline" onClick={handleReset} className="gap-2">
            <Upload className="size-4" />
            Process more applications
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-6">
      <Tabs
        value={mode}
        onValueChange={(v) => {
          setMode(v as "single" | "batch");
          setResults(null);
        }}
      >
        <TabsList className="w-full">
          <TabsTrigger value="single" className="flex-1 gap-1.5">
            <FileText className="size-3.5" />
            Single Application
          </TabsTrigger>
          <TabsTrigger value="batch" className="flex-1 gap-1.5">
            <Upload className="size-3.5" />
            Batch Applications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="single">
          <Card className="border-dashed">
            <CardContent className="pt-6">
              <FileDropzone
                files={singleFile}
                onFilesChange={(f) => setSingleFile(f.slice(0, 1))}
                multiple={false}
                isValidFile={isPdf}
                accept="application/pdf,.pdf"
                icon={FileText}
                fileLabel="a PDF"
                fileTypeHint="PDF files only"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="batch">
          <Card className="border-dashed">
            <CardContent className="pt-6">
              <FileDropzone
                files={batchFiles}
                onFilesChange={setBatchFiles}
                multiple={true}
                isValidFile={isPdf}
                accept="application/pdf,.pdf"
                icon={FileText}
                fileLabel="PDFs"
                fileTypeHint="PDF files only"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Button type="submit" disabled={!canSubmit} size="lg" className="w-full gap-2">
        {isSubmitting ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Upload className="size-4" />
            {mode === "single"
              ? "Process Application"
              : `Process ${batchFiles.length} Application${batchFiles.length !== 1 ? "s" : ""}`}
          </>
        )}
      </Button>
    </form>
  );
}
