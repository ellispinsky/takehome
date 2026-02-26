import { z } from "zod";

/**
 * Zod schema for TTB label application data extraction
 * 
 * This schema defines the structure for AI-extracted data from TTB Form 5100.31 (label applications).
 * It includes both application form data (typed fields) and label image data (OCR-extracted text).
 * 
 * Key design decisions:
 * - Dual alcohol content extraction: applicationABV from PDF form vs alcoholContent from label image
 *   (enables cross-verification to catch discrepancies between application and actual label)
 * - Confidence scores: Track AI extraction certainty for manual review prioritization
 * - Government warning validation: TTB requires specific capitalization and formatting
 */
export const applicationSchema = z.object({
  /**
   * Data extracted from the PDF application form fields (box 6, box 13, etc.)
   * This represents what the applicant submitted, not what's on the label image
   */
  applicationInfo: z.object({
    applicationBrandName: z.string().describe("The brand name of the application. Located in box 6"),
    applicationABV: z.string().describe("ONLY the numeric alcohol percentage from box 13. Extract just the number and % symbol (e.g. '45%', '12.5%'). Remove any text like 'ALC/VOL', 'ABV', 'BY VOL', etc. It is in the pdf NOT the image"),
  }),
  brandName: z.object({
    raw_text: z.string().describe("The brand name text extracted from the label"),
    present: z.boolean().describe("Whether the brand name is present on the label"),
    confidence: z.number().describe("Confidence score for this extraction (0.0 to 1.0)"),
  }).describe("The brand name of the product"),
  classType: z.object({
    raw_text: z.string().describe("The product class/type text"),
    present: z.boolean().describe("Whether the class type is present"),
    confidence: z.number().describe("Confidence score (0.0 to 1.0)"),
  }).describe("The class/type of product (e.g. 'Red Wine', 'Whisky')"),
  alcoholContent: z.object({
    raw_text: z.string().describe("ONLY the numeric alcohol percentage from box 13. Extract just the number and % symbol (e.g. '45%', '12.5%'). Remove any text like 'ALC/VOL', 'ABV', 'BY VOL', etc."),
    present: z.boolean().describe("Whether alcohol content is present"),
    confidence: z.number().describe("Confidence score (0.0 to 1.0)"),
  }).describe("The alcohol content percentage"),
  netContent: z.object({
    raw_text: z.string().describe("The net content/volume text (e.g. '750 ML', '1L')"),
    present: z.boolean().describe("Whether net content is present"),
    confidence: z.number().describe("Confidence score (0.0 to 1.0)"),
  }).describe("The net content or volume"),
  producer: z.object({
    raw_text: z.string().describe("The producer/manufacturer name and location"),
    present: z.boolean().describe("Whether producer info is present"),
    confidence: z.number().describe("Confidence score (0.0 to 1.0)"),
  }).describe("The producer or manufacturer information"),
  sourceOfProduct: z.object({
    raw_text: z.string().describe("Whether the product is domestic or imported"),
    confidence: z.number().describe("Confidence score (0.0 to 1.0)"),
  }),
  /**
   * Government health warning validation (TTB legal requirement)
   * 
   * Federal regulations require the warning title to be:
   * 1. In all capital letters (e.g. "GOVERNMENT WARNING" not "Government Warning")
   * 2. Bold formatted
   * 3. Spelled correctly
   * 
   * Note: Only the title heading is evaluated, not the body text/bullet points
   * Non-compliance can result in application rejection
   */
  governmentWarning: z.object({
    capitalLetters: z.boolean().describe("True if the government warning TITLE (e.g. 'GOVERNMENT WARNING' or 'GOVERNMENT WARNING:') is in all capital letters. Evaluate ONLY the title heading, NOT the body text or bullet points that follow. If the title reads 'GOVERNMENT WARNING' in caps, this is true."),
    bold: z.boolean().describe("True if the government warning TITLE heading is bold. Evaluate ONLY the title heading, NOT the body text that follows."),
    justification: z.string().describe("The justification for the government warning title"),
    spelledCorrectly: z.boolean().describe("Whether the government warning is spelled correctly"),
  }).describe("The government warning text in all capital letters and bold, it needs to be spelled correctly, each letter in the government warning needs to be in all capital letters and bold"),
});
export type ApplicationData = z.infer<typeof applicationSchema>;