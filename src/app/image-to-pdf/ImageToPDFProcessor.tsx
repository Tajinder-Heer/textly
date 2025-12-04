"use client";

import React, { useState } from "react";
import { jsPDF } from "jspdf";

interface ImageToPDFProcessorProps {
  images: File[];
}

const ImageToPDFProcessor: React.FC<ImageToPDFProcessorProps> = ({ images }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const generatePDF = async () => {
    setIsProcessing(true);
    setProgress(0);

    const pdf = new jsPDF();
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      const imgData = await toBase64(image);
      pdf.addImage(imgData, "JPEG", 10, 10, 190, 0);
      if (i < images.length - 1) {
        pdf.addPage();
      }
      setProgress(Math.round(((i + 1) / images.length) * 100));
    }

    pdf.save("output.pdf");
    setIsProcessing(false);
  };

  const toBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  return (
    <div className="flex flex-col items-center mt-6">
      <button
        onClick={generatePDF}
        disabled={isProcessing || images.length === 0}
        className={`px-6 py-3 rounded-lg text-white transition ${
          isProcessing || images.length === 0
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-green-500 hover:bg-green-600"
        }`}
      >
        {isProcessing ? "Generating PDF..." : "Generate PDF"}
      </button>
      {isProcessing && (
        <div className="w-full bg-gray-200 rounded-full h-4 mt-4">
          <div
            className="bg-green-500 h-4 rounded-full"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      )}
      {isProcessing && (
        <p className="text-sm text-muted-foreground mt-2">Progress: {progress}%</p>
      )}
    </div>
  );
};

export default ImageToPDFProcessor;
