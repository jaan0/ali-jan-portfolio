'use client'

import { useState, useRef } from 'react';
import { Upload, X } from 'lucide-react';

interface ImageUploadProps {
    currentUrl?: string | null;
    onUrlChange: (url: string) => void;
    label: string;
    name: string;
}

export default function ImageUpload({ currentUrl, onUrlChange, label, name }: ImageUploadProps) {
    const [preview, setPreview] = useState<string>(currentUrl || '');
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Upload file
        setUploading(true);
        setError('');

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Upload failed');
            }

            const data = await response.json();
            onUrlChange(data.url);
            setPreview(data.url);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Upload failed');
            setPreview(currentUrl || '');
        } finally {
            setUploading(false);
        }
    };

    const handleRemove = () => {
        setPreview('');
        onUrlChange('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const isPdf = preview?.toLowerCase().endsWith('.pdf');

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">{label}</label>

            {preview ? (
                <div className="relative inline-block">
                    {isPdf ? (
                        <div className="w-32 h-32 flex flex-col items-center justify-center bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-2 text-center">
                            <Upload className="w-8 h-8 text-gray-400 mb-1" />
                            <span className="text-[10px] font-medium text-gray-500 truncate w-full">PDF Document</span>
                        </div>
                    ) : (
                        <img
                            src={preview.startsWith('data:') || preview.startsWith('http') || preview.startsWith('/') ? preview : `/${preview.replace(/^\//, '')}`}
                            alt="Preview"
                            className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200"
                        />
                    )}
                    <button
                        type="button"
                        onClick={handleRemove}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-sm"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ) : (
                <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md cursor-pointer transition shadow-sm border border-gray-200">
                        <Upload className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">{uploading ? 'Uploading...' : 'Choose File'}</span>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*,application/pdf"
                            onChange={handleFileChange}
                            disabled={uploading}
                            className="hidden"
                        />
                    </label>
                    <span className="text-xs text-gray-500">or paste URL below</span>
                </div>
            )}

            {error && (
                <p className="text-xs text-red-600 font-medium">{error}</p>
            )}

            <input
                type="text"
                name={name}
                value={preview}
                onChange={(e) => {
                    setPreview(e.target.value);
                    onUrlChange(e.target.value);
                }}
                placeholder="Or paste URL manually"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2 text-sm"
            />
            <p className="text-xs text-gray-500 font-normal">Max 5MB • JPG, PNG, GIF, WebP, PDF</p>
        </div>
    );
}
