import { config } from 'dotenv';
config();

import '@/ai/flows/correct-ocr-errors.ts';
import '@/ai/flows/extract-text-from-file.ts';
import '@/ai/flows/proofread-text.ts';
