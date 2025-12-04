# Textly Project Guide (Updated)

Welcome to the Textly project! This guide is designed to help you understand the structure and functionality of the project, even if you are new to Next.js. We will cover the file structure, client-side and server-side code, and provide a detailed explanation of how the code works, with examples.

---

## 1. File Structure Overview

The project is organized as follows:

### Root Files
- **`apphosting.yaml`**: Configuration for hosting the app (e.g., Google App Engine).
- **`firebase.json`**: Firebase configuration for deploying and managing Firebase services.
- **`next-env.d.ts`**: TypeScript definitions for Next.js.
- **`next.config.ts`**: Next.js configuration file.
- **`package.json`**: Lists project dependencies and scripts.
- **`postcss.config.mjs`**: Configuration for PostCSS (used for processing CSS).
- **`tailwind.config.ts`**: Tailwind CSS configuration file.
- **`tsconfig.json`**: TypeScript configuration file.

### `docs/`
- **`blueprint.md`**: Documentation or blueprint for the project.

### `src/`
This is the main directory for the application code. It contains the following subdirectories:

#### `ai/`
- **`dev.ts`**: Development utilities for AI-related features.
- **`genkit.ts`**: General utilities for AI generation.
- **`flows/`**: Contains workflows for AI features:
  - **`correct-ocr-errors.ts`**: Logic for correcting OCR errors.
  - **`extract-text-from-file.ts`**: Logic for extracting text from files.
  - **`proofread-text.ts`**: Logic for proofreading text.

#### `app/`
This folder contains the main pages of the application:
- **`favicon.ico`**: The app's favicon.
- **`globals.css`**: Global CSS styles.
- **`layout.tsx`**: Layout component for the app.
- **`page.tsx`**: The main landing page.
- **`ocr/page.tsx`**: Page for OCR functionality.
- **`proofread/page.tsx`**: Page for proofreading functionality.

#### `components/`
Reusable UI components are stored here:
- **`akhar-ocr.tsx`**: Component for OCR functionality.
- **`header.tsx`**: Header component.
- **`icons.tsx`**: Icon components.
- **`ui/`**: A collection of reusable UI components like buttons, forms, and dialogs.

#### `context/`
- **`language-context.tsx`**: Context for managing language settings.

#### `hooks/`
- **`use-mobile.tsx`**: Custom hook for mobile-specific functionality.
- **`use-toast.ts`**: Custom hook for toast notifications.

#### `lib/`
- **`utils.ts`**: Utility functions used across the project.

#### `locales/`
- **`en.json`**: English translations.
- **`pa.json`**: Punjabi translations.

---

## 2. Client-Side Code

### Pages
Next.js uses a file-based routing system. Each file in the `src/app/` directory corresponds to a route:
- **`page.tsx`**: The main landing page.
- **`ocr/page.tsx`**: The OCR page.
- **`proofread/page.tsx`**: The proofreading page.

#### Example: Adding a New Page
```tsx
// src/app/new-page.tsx
export default function NewPage() {
  return <h1>Welcome to the New Page!</h1>;
}
```
Access this page at `http://localhost:3000/new-page`.

### Components
Reusable components are stored in the `src/components/` directory. For example:
- **`header.tsx`**: Displays the header across all pages.
- **`ui/`**: Contains UI elements like buttons, forms, and dialogs.

### Styling
- **`globals.css`**: Defines global styles.
- **Tailwind CSS**: Used for utility-first styling. Configuration is in `tailwind.config.ts`.

---

## 3. Server-Side Code

### API Routes
Next.js allows you to create API routes in the `src/pages/api/` directory. However, this project handles server-side logic within the `ai/flows/` directory.

#### Example: Correcting OCR Errors
```ts
// src/ai/flows/correct-ocr-errors.ts
import Tesseract from 'tesseract.js';

export async function correctOcrErrors(imagePath: string) {
  const result = await Tesseract.recognize(imagePath, 'eng');
  return result.data.text;
}
```
This function uses the Tesseract.js library to perform OCR on an image and return the extracted text.

### Server-Side Rendering (SSR)
Next.js supports SSR, which is used to render pages on the server before sending them to the client. This ensures better SEO and faster initial load times.

#### Example: SSR in Action
```tsx
// src/app/ocr/page.tsx
export async function getServerSideProps() {
  const data = await fetchOCRData();
  return { props: { data } };
}

export default function OCRPage({ data }) {
  return <div>{data}</div>;
}
```

---

## 4. Key Features and Their Implementation

### OCR (Optical Character Recognition)
- **Page**: `src/app/ocr/page.tsx`
- **Component**: `src/components/akhar-ocr.tsx`
- **Logic**: `src/ai/flows/correct-ocr-errors.ts`

#### Example: Using the OCR Component
```tsx
import AkharOCR from '@/components/akhar-ocr';

export default function OCRPage() {
  return <AkharOCR />;
}
```

### Proofreading
- **Page**: `src/app/proofread/page.tsx`
- **Logic**: `src/ai/flows/proofread-text.ts`

### Text Extraction
- **Logic**: `src/ai/flows/extract-text-from-file.ts`

---

## 5. How to Run the Project

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Run the Development Server**
   ```bash
   npm run dev
   ```

3. **Open the App**
   Visit `http://localhost:3000` in your browser.

4. **Build for Production**
   ```bash
   npm run build
   ```

5. **Start the Production Server**
   ```bash
   npm start
   ```

---

## 6. Code Guide for Beginners

### Understanding Components
- Components are reusable pieces of UI.
- Example: `src/components/ui/button.tsx` defines a button component.

### Modifying Styles
- Use Tailwind CSS classes in your components.
- Update global styles in `globals.css`.

### Debugging Tips
- Use `console.log` to debug.
- Check the browser console for errors.
- Use the Next.js documentation for reference: https://nextjs.org/docs

---

This guide should help you get started with the Textly project. If you have any questions, feel free to ask!