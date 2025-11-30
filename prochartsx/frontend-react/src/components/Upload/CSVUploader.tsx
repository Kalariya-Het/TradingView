import React, { useRef, useState } from 'react';
import axios from 'axios';

export const CSVUploader: React.FC<{ onUploadSuccess: () => void }> = ({ onUploadSuccess }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setUploading(true);
        setError(null);

        try {
            await axios.post('http://localhost:5000/api/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            onUploadSuccess();
            alert('File uploaded successfully!');
        } catch (err: any) {
            console.error(err);
            const errorMsg = err.response?.data?.error || err.message || 'Failed to upload file';
            setError(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    return (
        <div className="relative">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".csv"
                className="hidden"
            />
            <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="rounded bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-sm font-medium transition-colors disabled:opacity-50"
            >
                {uploading ? 'Uploading...' : 'Upload CSV'}
            </button>
            {error && (
                <div className="absolute top-full mt-2 right-0 w-64 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50">
                    <p className="text-sm">{error}</p>
                </div>
            )}
        </div>
    );
};
