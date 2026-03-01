"use client";

import { Paperclip, X } from "lucide-react";
import { useRef, useState } from "react";

import { LIMITS } from "@chat/shared";

import { useAuthStore } from "@/stores/auth-store";

interface FileUploadButtonProps {
  workspaceId: string;
  onFileUploaded: (file: { id: string; name: string; url: string; mimeType: string; size: number }) => void;
}

export function FileUploadButton({ workspaceId, onFileUploaded }: FileUploadButtonProps) {
  const { accessToken } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !accessToken) return;

    if (file.size > LIMITS.MAX_FILE_SIZE) {
      alert(`File too large. Max size is ${LIMITS.MAX_FILE_SIZE / 1024 / 1024}MB`);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${apiUrl}/workspaces/${workspaceId}/files`);
      xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          setUploadProgress(Math.round((event.loaded / event.total) * 100));
        }
      };

      xhr.onload = () => {
        if (xhr.status === 201) {
          const result = JSON.parse(xhr.responseText);
          onFileUploaded(result.data);
        }
        setIsUploading(false);
        setUploadProgress(0);
      };

      xhr.onerror = () => {
        setIsUploading(false);
        setUploadProgress(0);
      };

      xhr.send(formData);
    } catch {
      setIsUploading(false);
    }

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileSelect}
        accept={LIMITS.ALLOWED_FILE_TYPES.join(",")}
      />

      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
        title="Attach file"
      >
        {isUploading ? (
          <div className="relative h-5 w-5">
            <svg className="h-5 w-5 -rotate-90" viewBox="0 0 20 20">
              <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.2" />
              <circle
                cx="10"
                cy="10"
                r="8"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray={`${uploadProgress * 0.5} 100`}
              />
            </svg>
          </div>
        ) : (
          <Paperclip className="h-5 w-5" />
        )}
      </button>
    </div>
  );
}
