"use client";

import 'react-image-crop/dist/ReactCrop.css';
import { useState, useRef, useCallback } from "react";
import type { ChangeEvent } from "react";
import Tesseract from "tesseract.js";
import * as pdfjsLib from "pdfjs-dist";
import { Packer } from "docx";
import { saveAs } from "file-saver";
import { Document, Paragraph, TextRun } from "docx";
import { correctOCRErrors } from "@/ai/flows/correct-ocr-errors";
import { extractTextFromFile } from "@/ai/flows/extract-text-from-file";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/context/language-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';
import {
  Copy,
  Download,
  FileImage,
  Loader2,
  Sparkles,
  Trash2,
  UploadCloud,
  Sun,
  Contrast,
  Pipette,
  Crop as CropIcon,
  FileText
} from "lucide-react";

type OcrStatus = "idle" | "processing" | "success" | "error" | "correcting";
type OcrEngine = "tesseract" | "ai";
type OcrLanguage = "eng" | "pan" | "hin" | "eng+pan" | "eng+hin" | "pan+hin" | "eng+pan+hin";

export function AkharOcr() {
  const { t } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState("");
  const [status, setStatus] = useState<OcrStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  const [filters, setFilters] = useState({
    brightness: 100,
    contrast: 100,
    grayscale: 0,
  });
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<Crop | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [ocrEngine, setOcrEngine] = useState<OcrEngine>("tesseract");
  const [ocrLanguage, setOcrLanguage] = useState<OcrLanguage>("eng+pan+hin");

  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      resetState();
      setFile(selectedFile);
      if (selectedFile.type.startsWith("image/")) {
        setPreviewUrl(URL.createObjectURL(selectedFile));
      } else if (selectedFile.type === "application/pdf") {
        setPreviewUrl('pdf'); // Special value to indicate PDF
      } else {
        toast({
          variant: "destructive",
          title: t("toast.unsupportedFileTypeTitle"),
          description: t("toast.unsupportedFileTypeDesc"),
        });
      }
    }
  };
  
  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const newCrop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 90,
        },
        16 / 9,
        width,
        height,
      ),
      width,
      height,
    );
    setCrop(newCrop);
    setCompletedCrop(newCrop);
  };

  const getCroppedImg = (image: HTMLImageElement, crop: Crop): Promise<string> => {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = crop.width * scaleX;
    canvas.height = crop.height * scaleY;
    const ctx = canvas.getContext('2d');
  
    if (!ctx) {
      return Promise.reject(new Error('Failed to get canvas context'));
    }
  
    // Apply filters to the canvas context
    ctx.filter = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) grayscale(${filters.grayscale}%)`;
  
    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width * scaleX,
      crop.height * scaleY
    );
  
    return new Promise((resolve) => {
      resolve(canvas.toDataURL());
    });
  };

  const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        resolve(event.target?.result as string);
      };
      reader.onerror = (error) => {
        reject(error);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAiOcr = async () => {
    if (!file) return;

    setStatus("processing");
    setProgress(0);
    setProgressMessage(t('result.extractingAi'));
    setExtractedText(t('ocr.processing'));

    try {
      const fileDataUri = await fileToDataUri(file);
      const result = await extractTextFromFile({ fileDataUri });
      setExtractedText(result.extractedText);
      setStatus("success");
    } catch(error) {
      console.error("AI OCR Error:", error);
      setExtractedText(t('ocr.fail'));
      setStatus("error");
      toast({
        variant: "destructive",
        title: t('toast.aiOcrFailedTitle'),
        description: t('toast.aiOcrFailedDesc'),
      });
    }
  }

  const processPdf = async (pdfFile: File) => {
    try {
      setStatus("processing");
      setExtractedText("");
      setProgress(0);
      
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
      const fileReader = new FileReader();
      
      const fileReadPromise = new Promise<ArrayBuffer>((resolve, reject) => {
        fileReader.onload = (event) => resolve(event.target?.result as ArrayBuffer);
        fileReader.onerror = (error) => reject(error);
        fileReader.readAsArrayBuffer(pdfFile);
      });
      
      const arrayBuffer = await fileReadPromise;
      const typedarray = new Uint8Array(arrayBuffer);
      const pdf = await pdfjsLib.getDocument(typedarray).promise;
      
      let fullText = "";
      const worker = await Tesseract.createWorker(ocrLanguage, 1, {
        langPath: '/tessdata',
        logger: (m) => {
          if (m.status === "recognizing text") {
            const pageProgress = m.progress / pdf.numPages;
            const totalProgress = (((i-1) / pdf.numPages) + pageProgress) * 100;
            setProgress(Math.round(totalProgress));
          }
        },
      });

      let i = 1;
      for (i = 1; i <= pdf.numPages; i++) {
        setProgressMessage(`${t('ocr.processingPage')} ${i} ${t('ocr.of')} ${pdf.numPages}...`);
        
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (context) {
          await page.render({ canvasContext: context, viewport: viewport }).promise;
          const { data: { text } } = await worker.recognize(canvas.toDataURL());
          fullText += text + "\n\n";
          setExtractedText(fullText);
        }
      }
      
      await worker.terminate();
      setExtractedText(fullText.trim());
      setStatus("success");
    } catch (error) {
       console.error("PDF Processing Error:", error);
      setExtractedText(t('ocr.fail'));
      setStatus("error");
      toast({
        variant: "destructive",
        title: t('toast.pdfErrorTitle'),
        description: t('toast.pdfErrorDesc'),
      });
    }
  }

  const handleOcr = async () => {
    if (!file) return;

    if(ocrEngine === 'ai') {
        await handleAiOcr();
        return;
    }

    if (file.type === "application/pdf") {
      await processPdf(file);
      return;
    }

    if (!previewUrl || previewUrl === 'pdf') return;

    setStatus("processing");
    setProgress(0);
    setProgressMessage(t('result.extracting'));
    setExtractedText(t('ocr.processing'));

    try {
      let imageUrl = previewUrl;
      // Apply crop if a crop has been made (even if not currently in crop mode)
      if (completedCrop && imageRef.current) {
        imageUrl = await getCroppedImg(imageRef.current, completedCrop);
      }

      const worker = await Tesseract.createWorker(ocrLanguage, 1, {
        langPath: '/tessdata',
        logger: (m) => {
          if (m.status === "recognizing text") {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.src = imageUrl;
      img.crossOrigin = "anonymous"; // Handle potential CORS issues with object URLs
      img.onload = async () => {
          canvas.width = img.width;
          canvas.height = img.height;
          if (ctx) {
            ctx.filter = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) grayscale(${filters.grayscale}%)`;
            ctx.drawImage(img, 0, 0);
          }
          const { data: { text } } = await worker.recognize(canvas);
          setExtractedText(text);
          setStatus("success");
          await worker.terminate();
      }
      img.onerror = (err) => {
        console.error("Image load error", err);
        throw new Error("Could not load image for OCR.");
      }
    } catch (error) {
      console.error("OCR Error:", error);
      setExtractedText(t('ocr.fail'));
      setStatus("error");
      toast({
        variant: "destructive",
        title: t('toast.ocrFailedTitle'),
        description: t('toast.ocrFailedDesc'),
      });
    }
  };

  const handleCorrection = async () => {
    if (!extractedText) return;
    setStatus("correcting");
    try {
      const result = await correctOCRErrors({ text: extractedText });
      setExtractedText(result.correctedText);
      toast({
        title: t('toast.aiSuccessTitle'),
        description: t('toast.aiSuccessDesc'),
      });
    } catch (error) {
      console.error("AI Correction Error:", error);
      toast({
        variant: "destructive",
        title: t('toast.aiFailedTitle'),
        description: t('toast.aiFailedDesc'),
      });
    } finally {
      setStatus("success");
    }
  };
  
  const resetState = () => {
    setFile(null);
    if(previewUrl && previewUrl !== 'pdf') URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setExtractedText("");
    setStatus("idle");
    setProgress(0);
    setProgressMessage("");
    setFilters({ brightness: 100, contrast: 100, grayscale: 0 });
    setCrop(undefined);
    setCompletedCrop(null);
    setIsCropping(false);
    if(fileInputRef.current) fileInputRef.current.value = "";
  };
  
  const handleDownload = async () => {
    const doc = new Document({
      sections: [{
        properties: {},
        children: extractedText.split('\n').map(line => 
            new Paragraph({
                children: [new TextRun(line)],
            })
        ),
      }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, "textly-scanned-text.docx");
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(extractedText).then(() => {
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
  
  const isPdf = file?.type === "application/pdf";

  const filterStyle = {
    filter: `brightness(${filters.brightness}%) contrast(${filters.contrast}%) grayscale(${filters.grayscale}%)`,
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      <Card className="w-full h-full shadow-lg border-2 border-dashed border-muted hover:border-primary transition-colors duration-300">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">{t('upload.title')}</CardTitle>
          <CardDescription>{t('upload.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          {!file ? (
            <div
              className="flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-lg text-center cursor-pointer h-96 bg-background/50 transition-all hover:bg-muted"
              onClick={() => fileInputRef.current?.click()}
              onDrop={onDrop}
              onDragOver={onDragOver}
            >
              <UploadCloud className="w-16 h-16 text-primary mb-4" />
              <p className="font-semibold">{t('upload.cta')}</p>
              <p className="text-sm text-muted-foreground">{t('upload.supports')}</p>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/png, image/jpeg, application/pdf"
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative border rounded-lg overflow-hidden h-96 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                {isPdf ? (
                   <div className="flex flex-col items-center text-center p-4">
                    <FileText className="w-24 h-24 text-primary mb-4" />
                    <p className="font-semibold text-lg">{file.name}</p>
                    <p className="text-sm text-muted-foreground">{t('upload.pdfReady')}</p>
                  </div>
                ) : isCropping ? (
                  <ReactCrop
                    crop={crop}
                    onChange={c => setCrop(c)}
                    onComplete={c => setCompletedCrop(c)}
                  >
                    <img
                      ref={imageRef}
                      src={previewUrl!}
                      alt="File preview"
                      className="max-h-full max-w-full object-contain transition-all duration-300"
                      style={filterStyle}
                      onLoad={onImageLoad}
                    />
                  </ReactCrop>
                ) : completedCrop ? (
                  // Show cropped preview when not in crop mode but crop exists
                  <div className="relative w-full h-full flex items-center justify-center">
                    <img
                      ref={imageRef}
                      src={previewUrl!}
                      alt="Cropped preview"
                      className="max-h-full max-w-full object-contain transition-all duration-300"
                      style={{
                        ...filterStyle,
                        clipPath: `inset(${completedCrop.y}px ${100 - (completedCrop.x + completedCrop.width)}px ${100 - (completedCrop.y + completedCrop.height)}px ${completedCrop.x}px)`,
                      }}
                    />
                  </div>
                ) : (
                  <img ref={imageRef} src={previewUrl!} alt="File preview" className="max-h-full max-w-full object-contain transition-all duration-300" style={filterStyle} />
                )}
              </div>
              
              {!isPdf && (
                <Card>
                  <CardHeader><CardTitle className="text-lg">{t('enhancement.title')}</CardTitle></CardHeader>
                  <CardContent className="space-y-4 pt-2">
                    <div className="grid gap-2">
                      <Label htmlFor="brightness" className="flex items-center"><Sun className="mr-2 h-4 w-4"/> {t('enhancement.brightness')}</Label>
                      <Slider id="brightness" min={50} max={200} value={[filters.brightness]} onValueChange={([val]) => setFilters(f => ({...f, brightness: val}))} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="contrast" className="flex items-center"><Contrast className="mr-2 h-4 w-4"/> {t('enhancement.contrast')}</Label>
                      <Slider id="contrast" min={50} max={200} value={[filters.contrast]} onValueChange={([val]) => setFilters(f => ({...f, contrast: val}))} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="grayscale" className="flex items-center"><Pipette className="mr-2 h-4 w-4"/> {t('enhancement.grayscale')}</Label>
                      <Slider id="grayscale" min={0} max={100} value={[filters.grayscale]} onValueChange={([val]) => setFilters(f => ({...f, grayscale: val}))} />
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t('extract.engineTitle')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={ocrEngine} onValueChange={(value) => setOcrEngine(value as OcrEngine)} className="flex space-x-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="tesseract" id="tesseract" />
                      <Label htmlFor="tesseract">{t('extract.tesseract')}</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="ai" id="ai" />
                      <Label htmlFor="ai">{t('extract.ai')}</Label>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>

              {ocrEngine === "tesseract" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Language Selection</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup value={ocrLanguage} onValueChange={(value) => setOcrLanguage(value as OcrLanguage)} className="flex flex-wrap gap-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="eng" id="eng" />
                        <Label htmlFor="eng">English</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="pan" id="pan" />
                        <Label htmlFor="pan">Punjabi</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="hin" id="hin" />
                        <Label htmlFor="hin">Hindi</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="eng+pan" id="eng-pan" />
                        <Label htmlFor="eng-pan">English + Punjabi</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="eng+hin" id="eng-hin" />
                        <Label htmlFor="eng-hin">English + Hindi</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="pan+hin" id="pan-hin" />
                        <Label htmlFor="pan-hin">Punjabi + Hindi</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="eng+pan+hin" id="eng-pan-hin" />
                        <Label htmlFor="eng-pan-hin">All (English + Punjabi + Hindi)</Label>
                      </div>
                    </RadioGroup>
                  </CardContent>
                </Card>
              )}

              <div className="flex flex-wrap gap-2">
                {!isPdf && (
                   <Button onClick={() => {
                     if (isCropping) {
                       // Exiting crop mode - keep the crop selection
                       setIsCropping(false);
                     } else {
                       // Entering crop mode - reset crop to full image
                       if (crop) setCompletedCrop(crop);
                       setIsCropping(true);
                     }
                   }} variant={isCropping ? "default" : "outline"}>
                      <CropIcon className="mr-2 h-4 w-4" />
                      {isCropping ? t('crop.done') : t('crop.cropImage')}
                    </Button>
                )}
                <Button onClick={handleOcr} disabled={status === "processing" || !file}>
                  {status === "processing" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t('extract.button')}
                </Button>
                <Button variant="outline" onClick={resetState}><Trash2 className="mr-2 h-4 w-4" /> {t('extract.clear')}</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="w-full shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">{t('result.title')}</CardTitle>
          <CardDescription>{t('result.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          {status === 'processing' && (
            <div className="flex flex-col items-center justify-center h-96">
              <p className="mb-2">{progressMessage || (ocrEngine === 'ai' ? t('result.extractingAi') : t('result.extracting'))} {progress > 0 && `${progress}%`}</p>
              <Progress value={progress} className="w-full" />
            </div>
          )}
          {status !== 'processing' && (
            <div className="space-y-4">
              <Textarea
                value={extractedText}
                onChange={(e) => setExtractedText(e.target.value)}
                placeholder={t('result.placeholder')}
                rows={18}
                className="font-body text-base resize-y"
              />
              <div className="flex flex-wrap gap-2">
                <Button onClick={handleCorrection} disabled={!extractedText || status === 'correcting' || status === 'processing'}>
                  {status === 'correcting' ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  {t('result.refineWithAi')}
                </Button>
                <Button variant="secondary" onClick={handleCopy} disabled={!extractedText}><Copy className="mr-2 h-4 w-4" /> {t('result.copy')}</Button>
                <Button variant="secondary" onClick={handleDownload} disabled={!extractedText}><Download className="mr-2 h-4 w-4" /> {t('result.download')}</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}