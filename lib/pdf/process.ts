import { generateText, Output } from 'ai';
import { PDF_EXTRACTION_PROMPT } from '@/lib/pdf/prompts';
import { applicationSchema } from '@/lib/pdf/schema';
// import { createAzure} from '@ai-sdk/azure';

/**
 * Azure OpenAI configuration (optional)
 * 
 * Uncomment and configure if you want to use Azure-hosted Claude models instead of direct AI SDK API.
 * Requires AZURE_RESOURCE_NAME and AZURE_API_KEY environment variables.
 * Switch the model line to: model: azure.chat('claude-haiku-4.5')
 */
// const azure = createAzure({
//   resourceName: process.env.AZURE_RESOURCE_NAME,
//   apiKey: process.env.AZURE_API_KEY,
// });

/**
 * Process a PDF file and extract structured label compliance data using AI
 * 
 * This function uses Claude Haiku 4.5 to analyze TTB label application PDFs and extract
 * structured data including brand name, alcohol content, government warnings, etc.
 * The AI model reads both the PDF form fields and the embedded label image.
 * 
 * @param file - The PDF file to process (TTB Form 5100.31)
 * @returns Structured extraction result with confidence scores and verification data
 * 
 * 
 * - Model: Claude Haiku 4.5 (fast, cost-effective for document analysis)
 * - Token limit: 5000 (sufficient for label data)
 * - Output: Strictly typed object matching applicationSchema for type safety
 */
export async function processPdf(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());

  return await generateText({
    //model: azure.chat('claude-haiku-4.5'),
    model: 'anthropic/claude-haiku-4.5',
    maxOutputTokens: 5000,
    output: Output.object({
      schema: applicationSchema,
    }),
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: PDF_EXTRACTION_PROMPT,
          },
          {
            type: 'file',
            data: buffer,
            mediaType: 'application/pdf',
          }

        ],
      }
    ]
  });
}