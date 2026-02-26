"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Check,
  X,
  AlertTriangle,
  Filter,
  Download,
  ChevronDown,
  FileSearch,
  Info,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ApplicationResult, ApplicationStatus } from "@/lib/types";

interface PdfViewerModalProps {
  url: string;
  filename: string;
  onClose: () => void;
}

function PdfViewerModal({ url, filename, onClose }: PdfViewerModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg border bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <span className="truncate text-sm font-medium text-foreground">{filename}</span>
          <Button variant="ghost" size="icon" className="size-8 shrink-0" onClick={onClose} aria-label="Close PDF viewer">
            <X className="size-4" />
          </Button>
        </div>
        <iframe
          src={url}
          title={filename}
          className="flex-1 w-full"
        />
      </div>
    </div>
  );
}

interface ResultsTableProps {
  results: ApplicationResult[];
}

const STATUS_CONFIG: Record<
  ApplicationStatus,
  { label: string; variant: "success" | "warning" | "destructive"; icon: typeof Check }
> = {
  pass: { label: "Pass", variant: "success", icon: Check },
  review: { label: "Review", variant: "warning", icon: AlertTriangle },
  fail: { label: "Fail", variant: "destructive", icon: X },
};

function GovWarningCell({ capital, bold, spelling }: { capital: boolean; bold: boolean; spelling: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex items-center gap-1 text-xs">
        <span className="font-medium text-muted-foreground">CAP</span>
        {capital ? (
          <Check className="size-3.5 text-success" />
        ) : (
          <X className="size-3.5 text-destructive" />
        )}
      </span>
      <span className="flex items-center gap-1 text-xs">
        <span className="font-medium text-muted-foreground">BLD</span>
        {bold ? (
          <Check className="size-3.5 text-success" />
        ) : (
          <X className="size-3.5 text-destructive" />
        )}
      </span>
      <span className="flex items-center gap-1 text-xs">
        <span className="font-medium text-muted-foreground">SPL</span>
        {spelling ? (
          <Check className="size-3.5 text-success" />
        ) : (
          <X className="size-3.5 text-destructive" />
        )}
      </span>
    </div>
  );
}

function VerificationCell({ match }: { match?: boolean }) {
  if (match === undefined) return <span className="text-xs text-muted-foreground">-</span>;

  if (match) {
    return (
      <div className="flex items-center gap-1.5">
        <Check className="size-3.5 text-success" />
        <span className="text-xs text-muted-foreground">Match</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <X className="size-3.5 text-destructive" />
      <span className="text-xs text-destructive">Mismatch</span>
    </div>
  );
}

function exportToCSV(results: ApplicationResult[]) {
  const headers = [
    "Filename",
    "Brand Name",
    "Brand Confidence",
    "Class Type",
    "Alcohol Content",
    "Net Content",
    "Producer",
    "Source of Product",
    "Gov Warning - Capital",
    "Gov Warning - Bold",
    "Gov Warning - Spelling",
    "Status",
  ];

  const rows = results.map((r) => [
    r.filename,
    r.brandName,
    `${r.brandNameConfidence}%`,
    r.classType,
    r.alcoholContent,
    r.netContent,
    r.producer,
    r.sourceOfProduct,
    r.governmentWarning.capital ? "Pass" : "Fail",
    r.governmentWarning.bold ? "Pass" : "Fail",
    r.governmentWarning.spelling ? "Pass" : "Fail",
    r.status.charAt(0).toUpperCase() + r.status.slice(1),
  ]);

  const csvContent = [headers, ...rows]
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    )
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `label-results-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function exportToJSON(results: ApplicationResult[]) {
  const jsonContent = JSON.stringify(results, null, 2);
  const blob = new Blob([jsonContent], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `label-results-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export function ResultsTable({ results }: ResultsTableProps) {
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "all">("all");
  const [viewingPdf, setViewingPdf] = useState<{ url: string; filename: string } | null>(null);

  const filteredResults = useMemo(() => {
    if (statusFilter === "all") return results;
    return results.filter((r) => r.status === statusFilter);
  }, [results, statusFilter]);

  const counts = useMemo(() => {
    return {
      all: results.length,
      pass: results.filter((r) => r.status === "pass").length,
      review: results.filter((r) => r.status === "review").length,
      fail: results.filter((r) => r.status === "fail").length,
    };
  }, [results]);

  const handleExportCSV = useCallback(() => exportToCSV(filteredResults), [filteredResults]);
  const handleExportJSON = useCallback(() => exportToJSON(filteredResults), [filteredResults]);

  return (
    <>
    {viewingPdf && (
      <PdfViewerModal
        url={viewingPdf.url}
        filename={viewingPdf.filename}
        onClose={() => setViewingPdf(null)}
      />
    )}
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <CardTitle className="text-lg">Processing Results</CardTitle>
            <p className="text-sm text-muted-foreground">
              {filteredResults.length} of {results.length} application{results.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Status filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Filter className="size-3.5" />
                  {statusFilter === "all" ? "All statuses" : STATUS_CONFIG[statusFilter].label}
                  <ChevronDown className="size-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setStatusFilter("all")}>
                  All statuses
                  <span className="ml-auto text-xs text-muted-foreground">{counts.all}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setStatusFilter("pass")}>
                  <Check className="size-3.5 text-success" />
                  Pass
                  <span className="ml-auto text-xs text-muted-foreground">{counts.pass}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("review")}>
                  <AlertTriangle className="size-3.5 text-warning" />
                  Review
                  <span className="ml-auto text-xs text-muted-foreground">{counts.review}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("fail")}>
                  <X className="size-3.5 text-destructive" />
                  Fail
                  <span className="ml-auto text-xs text-muted-foreground">{counts.fail}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Export dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Download className="size-3.5" />
                  Export
                  <ChevronDown className="size-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportCSV}>
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportJSON}>
                  Export as JSON
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-6">Filename</TableHead>
              <TableHead>Brand Name</TableHead>
              <TableHead>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex cursor-help items-center gap-1">
                      Brand Match
                      <Info className="size-3.5 text-muted-foreground" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Cross-reference between label and application content</p>
                  </TooltipContent>
                </Tooltip>
              </TableHead>
              <TableHead>Class Type</TableHead>
              <TableHead>Alcohol</TableHead>
              <TableHead>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex cursor-help items-center gap-1">
                      ABV Match
                      <Info className="size-3.5 text-muted-foreground" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Cross-reference between label and application content</p>
                  </TooltipContent>
                </Tooltip>
              </TableHead>
              <TableHead>Net Content</TableHead>
              <TableHead>Producer</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Gov Warning</TableHead>
              <TableHead className="pr-6">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex cursor-help items-center gap-1">
                      Status
                      <Info className="size-3.5 text-muted-foreground" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Pass: brand name matches, ABV matches, and government warning meets capitalization requirements.</p>
                  </TooltipContent>
                </Tooltip>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredResults.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="h-24 text-center text-muted-foreground">
                  No results match the current filter.
                </TableCell>
              </TableRow>
            ) : (
              filteredResults.map((result) => {
                const statusInfo = STATUS_CONFIG[result.status];
                const StatusIcon = statusInfo.icon;
                return (
                  <TableRow key={result.id}>
                    <TableCell className="pl-6 font-medium">{result.filename}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{result.brandName}</span>
                        <span className="text-xs text-muted-foreground">
                          {result.brandNameConfidence}% confidence
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <VerificationCell match={result.verification?.brandName} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{result.classType}</TableCell>
                    <TableCell>{result.alcoholContent}</TableCell>
                    <TableCell>
                      <VerificationCell match={result.verification?.alcoholContent} />
                    </TableCell>
                    <TableCell>{result.netContent}</TableCell>
                    <TableCell className="max-w-[140px] truncate">{result.producer}</TableCell>
                    <TableCell>{result.sourceOfProduct}</TableCell>
                    <TableCell>
                      <GovWarningCell
                        capital={result.governmentWarning.capital}
                        bold={result.governmentWarning.bold}
                        spelling={result.governmentWarning.spelling}
                      />
                    </TableCell>
                    <TableCell className="pr-6">
                      <div className="flex items-center gap-2">
                        {result.pdfUrl && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() => setViewingPdf({ url: result.pdfUrl!, filename: result.filename })}
                            aria-label={`View PDF for ${result.filename}`}
                          >
                            <FileSearch className="size-3.5" />
                          </Button>
                        )}
                        <Badge variant={statusInfo.variant} className="gap-1">
                          <StatusIcon className="size-3" />
                          {statusInfo.label}
                        </Badge>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
    </>
  );
}
