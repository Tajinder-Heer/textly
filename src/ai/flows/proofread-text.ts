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
      'The text that needs to be proofread for spelling and grammatical errors.'
    ),
});
export type ProofreadTextInput = z.infer<typeof ProofreadTextInputSchema>;

const ProofreadTextOutputSchema = z.object({
  proofreadText: z.string().describe('The text with spelling and grammatical errors corrected by the AI model.'),
});
export type ProofreadTextOutput = z.infer<typeof ProofreadTextOutputSchema>;

export async function proofreadText(input: ProofreadTextInput): Promise<ProofreadTextOutput> {
  return proofreadTextFlow(input);
}

const prompt = ai.definePrompt({
  name: 'proofreadTextPrompt',
  input: {schema: ProofreadTextInputSchema},
  output: {schema: ProofreadTextOutputSchema},
  prompt: `You are an expert proofreader. Given the following text, please identify and correct any spelling and grammatical errors. It is crucial that you DO NOT change the original content, meaning, or tone. Only correct the spelling and grammar.

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
