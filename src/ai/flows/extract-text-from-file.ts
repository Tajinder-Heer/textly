'use server';

/**
 * @fileOverview An AI agent that extracts text from an image or a PDF file.
 *
 * - extractTextFromFile - A function that handles the text extraction process.
 * - ExtractTextFromFileInput - The input type for the extractTextFromFile function.
 * - ExtractTextFromFileOutput - The return type for the extractTextFromFile function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractTextFromFileInputSchema = z.object({
  fileDataUri: z
    .string()
    .describe(
      "An image or PDF file, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractTextFromFileInput = z.infer<typeof ExtractTextFromFileInputSchema>;

const ExtractTextFromFileOutputSchema = z.object({
  extractedText: z.string().describe('The text extracted from the provided file, preserving original formatting.'),
});
export type ExtractTextFromFileOutput = z.infer<typeof ExtractTextFromFileOutputSchema>;

export async function extractTextFromFile(input: ExtractTextFromFileInput): Promise<ExtractTextFromFileOutput> {
  return extractTextFromFileFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractTextFromFilePrompt',
  input: {schema: ExtractTextFromFileInputSchema},
  output: {schema: ExtractTextFromFileOutputSchema},
  prompt: `You are an expert in performing OCR on documents. Given the following file, extract all the text content. It is crucial that you preserve the original formatting, keep the between paragraph spacing but join the line break within single paragraph, and layout, as accurately as possible. The text is in Punjabi.

File: {{media url=fileDataUri}}`,
});

const extractTextFromFileFlow = ai.defineFlow(
  {
    name: 'extractTextFromFileFlow',
    inputSchema: ExtractTextFromFileInputSchema,
    outputSchema: ExtractTextFromFileOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
