"use client";

import { AkharOcr } from "@/components/akhar-ocr";
import { Header } from "@/components/header";
import { LanguageProvider } from "@/context/language-context";
import { SpellCheck } from "lucide-react";

export default function OcrPage() {
  return (
    <LanguageProvider>
      <div className="min-h-screen flex flex-col bg-background">
        <Header pageLinks={[{ href: "/proofread", label: "Proofread Text", icon: SpellCheck }]} />
        <main className="flex-grow container mx-auto p-4 md:p-8">
          <AkharOcr />
        </main>
      </div>
    </LanguageProvider>
  );
}
