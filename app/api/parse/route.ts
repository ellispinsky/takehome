import { processPdf } from '@/lib/pdf/process';
import { verifyMatch } from '@/lib/pdf/verification';
import { classifyError, getProcessingErrorMessage } from '@/lib/api/errors';

/**
 * POST /api/parse - Process TTB label application PDFs for compliance review
 * 
 * Accepts single or multiple PDF files, extracts label data using AI, and validates
 * against TTB requirements (brand name match, ABV match, government warning format).
 * 
 * Request: multipart/form-data with one or more PDF files
 * Response: Array of results with extracted data, verification status, and summary stats
 * 
 * Error handling:
 * - 400: Invalid content type, no files, or non-PDF files
 * - 413: File(s) too large
 * - 429: Rate limit exceeded (AI API throttling)
 * - 500: Processing errors or authentication failures
 */
export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") ?? "";
    if (!contentType.includes("multipart/form-data")) {
      return Response.json(
        { error: "Content-Type must be multipart/form-data" },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const files = formData.getAll("file") as File[];

    if (!files.length) {
      return Response.json(
        { error: "FormData must include at least one 'file'." },
        { status: 400 }
      );
    }

    // Validate file types
    for (const file of files) {
      const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
      if (!isPdf) {
        return Response.json(
          { error: `Unsupported file type: ${file.type}. Only PDFs are supported.` },
          { status: 400 }
        );
      }
    }

    /**
     * Process all PDFs in parallel and handle individual file failures gracefully
     * 
     * Uses Promise.all to process files concurrently for performance. Each file is processed
     * independently - if one fails, others continue. This is critical for batch uploads where
     * one corrupted PDF shouldn't block the entire batch.
     * 
     * For each file:
     * 1. Extract data from PDF using AI (processPdf)
     * 2. Cross-verify label vs application data (verifyMatch)
     * 3. Return success with data OR error with user-friendly message
     */
    const results = await Promise.all(files.map(async (file) => {
      try {
        const result = await processPdf(file);
        
        // Cross-verify: Does the label match what was submitted in the application?
        // Empty strings use nullish coalescing to prevent verifyMatch from failing
        const alcoholContentMatch = verifyMatch(
          result.output.alcoholContent?.raw_text ?? '', 
          result.output.applicationInfo?.applicationABV ?? ''
        );
        const brandNameMatch = verifyMatch(
          result.output.brandName?.raw_text ?? '', 
          result.output.applicationInfo?.applicationBrandName ?? ''
        );
        return {
          status: 'success' as const,
          filename: file.name,
          data: result.output,
          alcoholContentMatch,
          brandNameMatch,
        };
      } catch (error) {
        console.error(`Error parsing file ${file.name}:`, error);
        return {
          status: 'error' as const,
          filename: file.name,
          error: getProcessingErrorMessage(error),
        };
      }
    }));

    const summary = {
      total: files.length,
      successful: results.filter(r => r.status === 'success').length,
      failed: results.filter(r => r.status === 'error').length
    };

    return Response.json({ 
      results,
      summary 
    });
  } catch (error) {
    const { isPayloadTooLarge, isRateLimited, isAuthError, message } = classifyError(error);

    if (isPayloadTooLarge) {
      return Response.json(
        { error: 'One or more files are too large. Try compressing them.' },
        { status: 413 }
      );
    }
    if (isRateLimited) {
      return Response.json(
        { error: 'Rate limit exceeded. Please try again in a moment.' },
        { status: 429 }
      );
    }
    if (isAuthError) {
      return Response.json(
        { error: 'API authentication failed. Please check configuration.' },
        { status: 500 }
      );
    }
    return Response.json(
      { error: 'Failed to parse files.', details: message },
      { status: 500 }
    );
  }
}