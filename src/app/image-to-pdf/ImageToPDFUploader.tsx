"use client";

import React, { useState } from "react";

interface ImageToPDFUploaderProps {
  onImagesSelected: (files: File[]) => void;
}

const ImageToPDFUploader: React.FC<ImageToPDFUploaderProps> = ({ onImagesSelected }) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [statusMessage, setStatusMessage] = useState<string>("");

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(files);
    setStatusMessage(`${files.length} file(s) selected.`);
    onImagesSelected(files);
  };

  const handleFolderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(files);
    setStatusMessage(`${files.length} file(s) selected from folder.`);
    onImagesSelected(files);
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg bg-gradient-to-r from-gray-100 to-gray-200 shadow-md hover:shadow-lg transition-shadow">
      <h2 className="text-lg font-semibold text-gray-700 mb-4">Upload Images</h2>
      <div className="flex gap-4">
        <div>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
            id="manual-file-upload"
          />
          <label
            htmlFor="manual-file-upload"
            className="cursor-pointer bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
          >
            Select Files
          </label>
        </div>
        <div>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFolderChange}
            className="hidden"
            id="folder-upload"
            ref={(input) => {
              if (input) {
                (input as any).webkitdirectory = true;
              }
            }}
          />
          <label
            htmlFor="folder-upload"
            className="cursor-pointer bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2"
          >
            Select Folder
          </label>
        </div>
      </div>
      {statusMessage && (
        <p className="text-sm text-gray-600 mt-4 font-medium">{statusMessage}</p>
      )}
    </div>
  );
};

export default ImageToPDFUploader;
