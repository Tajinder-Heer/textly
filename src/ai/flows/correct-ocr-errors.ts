'use server';

/**
 * @fileOverview An AI agent that corrects errors in OCR-extracted text.
 *
 * - correctOCRErrors - A function that handles the OCR error correction process.
 * - CorrectOCRErrorsInput - The input type for the correctOCRErrors function.
 * - CorrectOCRErrorsOutput - The return type for the correctOCRErrors function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CorrectOCRErrorsInputSchema = z.object({
  text: z
    .string()
    .describe(
      'The OCR extracted text that needs to be corrected for errors.'
    ),
});
export type CorrectOCRErrorsInput = z.infer<typeof CorrectOCRErrorsInputSchema>;

const CorrectOCRErrorsOutputSchema = z.object({
  correctedText: z.string().describe('The OCR extracted text with errors corrected by the AI model.'),
});
export type CorrectOCRErrorsOutput = z.infer<typeof CorrectOCRErrorsOutputSchema>;

export async function correctOCRErrors(input: CorrectOCRErrorsInput): Promise<CorrectOCRErrorsOutput> {
  return correctOCRErrorsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'correctOCRErrorsPrompt',
  input: {schema: CorrectOCRErrorsInputSchema},
  output: {schema: CorrectOCRErrorsOutputSchema},
  prompt: `You are an expert in correcting OCR errors, especially for Punjabi language text. Given the following text extracted by OCR, identify and correct any errors to produce a clean, accurate version of the original content.  Preserve the original formatting and layout as much as possible.

OCR Text: {{{text}}}`,
});

const correctOCRErrorsFlow = ai.defineFlow(
  {
    name: 'correctOCRErrorsFlow',
    inputSchema: CorrectOCRErrorsInputSchema,
    outputSchema: CorrectOCRErrorsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
