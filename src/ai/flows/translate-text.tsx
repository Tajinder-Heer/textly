'use server';

/**
 * @fileOverview An AI agent that spell checks and proofreads text.
 *
 * - proofreadText - A function that handles the proofreading process.
 * - ProofreadTextInput - The input type for the proofreadText function.
 * - ProofreadTextOutput - The return type for the proofreadText function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProofreadTextInputSchema = z.object({
  text: z
    .string()
    .describe(
      'The text that needs to be translate to punjabi.'
    ),
});
export type ProofreadTextInput = z.infer<typeof ProofreadTextInputSchema>;

const ProofreadTextOutputSchema = z.object({
  translateText: z.string().describe('The text is translated Punjabi by AI model.'),
});
export type ProofreadTextOutput = z.infer<typeof ProofreadTextOutputSchema>;

export async function translateText(input: ProofreadTextInput): Promise<ProofreadTextOutput> {
  return proofreadTextFlow(input);
}

const prompt = ai.definePrompt({
  name: 'proofreadTextPrompt',
  input: {schema: ProofreadTextInputSchema},
  output: {schema: ProofreadTextOutputSchema},
  prompt: `You are an expert translator of the Punjabi language. Given the following text, please translate it to punjabi language. It is crucial that you DO NOT change the original content and meaning.

Text: {{{text}}}`,
});

const proofreadTextFlow = ai.defineFlow(
  {
    name: 'proofreadTextFlow',
    inputSchema: ProofreadTextInputSchema,
    outputSchema: ProofreadTextOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
