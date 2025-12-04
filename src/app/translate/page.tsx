"use client";

import { useState, useRef, useCallback } from "react";
import type { ChangeEvent } from "react";
import * as mammoth from "mammoth";
import { Packer } from "docx";
import { saveAs } from "file-saver";
import { Document, Paragraph, TextRun } from "docx";
import { translateText } from "@/ai/flows/translate-text";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/context/language-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Header } from "@/components/header";
import {
  Copy,
  Download,
  Loader2,
  Sparkles,
  Trash2,
  UploadCloud,
  FileText,
  ScanText,
} from "lucide-react";
import { LanguageProvider } from "@/context/language-context";

type ProofreadStatus = "idle" | "processing" | "success" | "error";

function ProofreadComponent() {
  const { t } = useLanguage();
  const [inputText, setInputText] = useState("");
  const [resultText, setResultText] = useState("");
  const [status, setStatus] = useState<ProofreadStatus>("idle");
  const [fileName, setFileName] = useState<string | null>(null);

  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        resetState();
        setFileName(selectedFile.name);
        setStatus("processing");
        const reader = new FileReader();
        reader.onload = async (event) => {
          const arrayBuffer = event.target?.result as ArrayBuffer;
          try {
            const result = await mammoth.extractRawText({ arrayBuffer });
            setInputText(result.value);
            setStatus("idle");
          } catch (error) {
            console.error("Docx parsing error", error);
            toast({ variant: "destructive", title: t('toast.docxErrorTitle'), description: t('toast.docxErrorDesc') });
            setStatus("error");
          }
        };
        reader.readAsArrayBuffer(selectedFile);
      } else {
        toast({
          variant: "destructive",
          title: t("toast.unsupportedFileTypeTitle"),
          description: t("toast.unsupportedDocxTypeDesc"),
        });
      }
    }
  };
  
  const handleProofread = async () => {
    if (!inputText) return;
    setStatus("processing");
    setResultText("");
    try {
      const result = await translateText({ text: inputText });
      setResultText(result.translateText);
      setStatus("success");
    } catch (error) {
      console.error("AI Proofread Error:", error);
      toast({
        variant: "destructive",
        title: t('toast.proofreadFailedTitle'),
        description: t('toast.proofreadFailedDesc'),
      });
      setStatus("error");
    }
  };
  
  const resetState = () => {
    setInputText("");
    setResultText("");
    setFileName(null);
    setStatus("idle");
    if(fileInputRef.current) fileInputRef.current.value = "";
  };
  
  const handleDownload = async () => {
    const textToSave = resultText || inputText;
    const doc = new Document({
      sections: [{
        properties: {},
        children: textToSave.split('\n').map(line => 
            new Paragraph({
                children: [new TextRun(line)],
            })
        ),
      }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, "textly-proofread.docx");
  };

  const handleCopy = () => {
    const textToCopy = resultText || inputText;
    navigator.clipboard.writeText(textToCopy).then(() => {
      toast({ title: t('toast.copied') });
    }, (err) => {
      toast({ variant: "destructive", title: t('toast.copyFailedTitle'), description: err.message });
    });
  };

  const onDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const droppedFiles = event.dataTransfer.files;
    if (droppedFiles && droppedFiles.length > 0) {
      if (fileInputRef.current) {
        fileInputRef.current.files = droppedFiles;
        const changeEvent = new Event('change', { bubbles: true }) as unknown as ChangeEvent<HTMLInputElement>;
        Object.defineProperty(changeEvent, 'target', { writable: false, value: { files: droppedFiles } });
        handleFileChange(changeEvent);
      }
    }
  }, [handleFileChange]);

  const onDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <>
      <Header pageLinks={[{ href: "/ocr", label: "Scan Text", icon: ScanText }]} />
      <main className="flex-grow container mx-auto p-4 md:p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-headline text-primary">{t('translate.title')}</h2>
          <p className="text-muted-foreground">{t('translate.description')}</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <Card className="w-full shadow-lg">
            <CardHeader>
              <CardTitle>{t('translate.pasteTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={t('proofread.pastePlaceholder')}
                rows={15}
                className="font-body text-base resize-y"
              />
              <div className="flex items-center my-4">
                <Separator className="flex-grow" />
                <span className="mx-4 text-muted-foreground font-bold">{t('translate.or')}</span>
                <Separator className="flex-grow" />
              </div>
              {fileName ? (
                <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg text-center h-32 bg-muted">
                    <FileText className="w-12 h-12 text-primary mb-2" />
                    <p className="font-semibold">{fileName}</p>
                </div>
              ) : (
                <div
                    className="flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg text-center cursor-pointer h-32 bg-background/50 transition-all hover:bg-muted"
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={onDrop}
                    onDragOver={onDragOver}
                >
                    <UploadCloud className="w-12 h-12 text-primary mb-2" />
                    <p className="font-semibold">{t('Translate.uploadCta')}</p>
                    <p className="text-sm text-muted-foreground">{t('Translate.uploadSupports')}</p>
                    <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="hidden"
                    />
                </div>
              )}
               <div className="flex flex-wrap gap-2 mt-4">
                  <Button onClick={handleProofread} disabled={!inputText || status === "processing"}>
                    {status === "processing" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    {t('translate.button')}
                  </Button>
                  <Button variant="outline" onClick={resetState}><Trash2 className="mr-2 h-4 w-4" /> {t('extract.clear')}</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="w-full shadow-lg">
            <CardHeader>
              <CardTitle>{t('translate.resultTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              {status === 'processing' && (
                <div className="flex flex-col items-center justify-center h-96">
                  <Loader2 className="w-16 h-16 text-primary animate-spin mb-4" />
                  <p className="mb-2">{t('translate.processing')}</p>
                </div>
              )}
              {status !== 'processing' && (
                <div className="space-y-4">
                   <Textarea
                    value={resultText}
                    readOnly
                    placeholder={t('result.placeholder')}
                    rows={18}
                    className="font-body text-base resize-y bg-muted/50"
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" onClick={handleCopy} disabled={!resultText && !inputText}><Copy className="mr-2 h-4 w-4" /> {t('result.copy')}</Button>
                    <Button variant="secondary" onClick={handleDownload} disabled={!resultText && !inputText}><Download className="mr-2 h-4 w-4" /> {t('result.download')}</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}

export default function ProofreadPage() {
    return (
        <LanguageProvider>
            <ProofreadComponent />
        </LanguageProvider>
    )
}
