"use client";

import React, { useState } from "react";
import ImageToPDFUploader from "./ImageToPDFUploader";
import ImageToPDFProcessor from "./ImageToPDFProcessor";
import { Header } from "@/components/header";
import { ScanText } from "lucide-react";
import { LanguageProvider } from "@/context/language-context";
import { Button } from "@/components/ui/button";

export default function ImageToPDF() {
  const [images, setImages] = useState<File[]>([]);

  return (
    <LanguageProvider>
      <div className="min-h-screen flex flex-col bg-background">
        <Header pageLinks={[{ href: "/ocr", label: "OCR", icon: ScanText }]} />
        <main className="flex-grow container mx-auto p-4 md:p-8">
          <h1 className="text-3xl font-bold text-gray-800">Image to PDF</h1>
          <p className="text-gray-600 mt-2">
            Upload your images and generate a PDF file.
          </p>
          <ImageToPDFUploader onImagesSelected={setImages} />
          {images.length > 0 && (
            <div className="mt-4">
              <ImageToPDFProcessor images={images} />
             
            </div>
          )}
        </main>
        <footer className="bg-gray-100 text-center py-4 text-sm text-gray-500">
          © 2025 Textly. All rights reserved.
        </footer>
      </div>
    </LanguageProvider>
  );
}
