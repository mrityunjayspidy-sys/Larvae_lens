import React, { useRef, useState } from 'react';
import { Upload, Video, Image as ImageIcon, AlertCircle, RefreshCw, CheckCircle2, Camera } from 'lucide-react';

interface VideoCaptureCardProps {
  onVideoSelected: (file: File, duration?: number) => void;
  selectedFile: File | null;
  onClear: () => void;
  maxSizeMB?: number;
  maxSeconds?: number;
}

export const VideoCaptureCard: React.FC<VideoCaptureCardProps> = ({
  onVideoSelected,
  selectedFile,
  onClear,
  maxSizeMB = 80,
  maxSeconds = 15,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraVideoInputRef = useRef<HTMLInputElement>(null);
  const cameraPhotoInputRef = useRef<HTMLInputElement>(null);

  const [mediaMode, setMediaMode] = useState<'video' | 'photo'>('video');
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isImage, setIsImage] = useState(false);

  const validateAndSelectFile = (file: File) => {
    setError(null);

    const isImg = file.type.startsWith('image/') || Boolean(file.name.match(/\.(jpg|jpeg|png|webp)$/i));
    setIsImage(isImg);

    // 1. Size Validation
    const fileMB = file.size / (1024 * 1024);
    if (fileMB > maxSizeMB) {
      setError(`File size (${fileMB.toFixed(1)} MB) exceeds maximum allowed ${maxSizeMB} MB.`);
      return;
    }

    const objectUrl = URL.createObjectURL(file);

    if (isImg) {
      setDuration(1.0);
      setPreviewUrl(objectUrl);
      onVideoSelected(file, 1.0);
      return;
    }

    // Video validation
    const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska'];
    if (!allowedVideoTypes.includes(file.type) && !file.name.match(/\.(mp4|webm|mov)$/i)) {
      setError('Please select an MP4, WebM, MOV video, or JPG/PNG photo.');
      return;
    }

    // Client duration extraction via HTML5 Video element
    const videoEl = document.createElement('video');
    videoEl.preload = 'metadata';
    videoEl.onloadedmetadata = () => {
      URL.revokeObjectURL(videoEl.src);
      const vidDuration = videoEl.duration;
      if (vidDuration > maxSeconds) {
        setError(`Video length (${vidDuration.toFixed(1)}s) exceeds recommended ${maxSeconds}s limit. Please provide a shorter 5-10s clip.`);
        return;
      }
      setDuration(vidDuration);
      setPreviewUrl(objectUrl);
      onVideoSelected(file, vidDuration);
    };
    videoEl.onerror = () => {
      setError('Could not decode video stream. The file may be corrupt.');
    };
    videoEl.src = objectUrl;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSelectFile(e.dataTransfer.files[0]);
    }
  };

  const handleClear = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setDuration(null);
    setError(null);
    setIsImage(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraVideoInputRef.current) cameraVideoInputRef.current.value = '';
    if (cameraPhotoInputRef.current) cameraPhotoInputRef.current.value = '';
    onClear();
  };

  return (
    <div className="card space-y-4 bg-white border border-slate-200/90 shadow-card">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-black text-slate-900">Import Water Photo or Video</h2>
          <p className="text-xs text-slate-600">
            Check standing water in plant saucers, coolers, buckets, tires, or drains for mosquito larvae.
          </p>
        </div>
        {selectedFile && (
          <button
            onClick={handleClear}
            className="text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1.5 self-start sm:self-auto bg-slate-100 px-3 py-1.5 rounded-control border border-slate-300"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Replace Media
          </button>
        )}
      </div>

      {/* Mode Selection Tabs */}
      {!selectedFile && (
        <div className="flex gap-2 p-1 bg-slate-200 rounded-control text-xs font-bold text-slate-900 max-w-sm border border-slate-300">
          <button
            type="button"
            onClick={() => setMediaMode('video')}
            className={`flex-1 py-2 px-3 rounded-control flex items-center justify-center gap-1.5 transition-all ${
              mediaMode === 'video' ? 'bg-white text-slate-900 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Video className="w-3.5 h-3.5 text-teal-600" />
            Video Clip (5–10s)
          </button>
          <button
            type="button"
            onClick={() => setMediaMode('photo')}
            className={`flex-1 py-2 px-3 rounded-control flex items-center justify-center gap-1.5 transition-all ${
              mediaMode === 'photo' ? 'bg-white text-slate-900 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5 text-teal-600" />
            Photo / Still Image
          </button>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-control bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {!selectedFile ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-card p-6 sm:p-10 text-center transition-all ${
            dragActive ? 'border-slate-900 bg-slate-100' : 'border-slate-300 hover:border-slate-500 bg-slate-50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={mediaMode === 'video' ? 'video/mp4,video/webm,video/quicktime' : 'image/jpeg,image/png,image/webp,image/*'}
            className="hidden"
            onChange={(e) => e.target.files?.[0] && validateAndSelectFile(e.target.files[0])}
          />
          <input
            ref={cameraVideoInputRef}
            type="file"
            accept="video/*"
            capture="environment"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && validateAndSelectFile(e.target.files[0])}
          />
          <input
            ref={cameraPhotoInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && validateAndSelectFile(e.target.files[0])}
          />

          <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mx-auto text-slate-900 mb-3.5 shadow-sm">
            {mediaMode === 'video' ? <Video className="w-7 h-7 text-teal-600" /> : <ImageIcon className="w-7 h-7 text-teal-600" />}
          </div>

          <p className="text-base font-extrabold text-slate-900 mb-1">
            {mediaMode === 'video'
              ? 'Drag & drop a stagnant-water video, or record with camera'
              : 'Drag & drop a stagnant-water photo, or capture with camera'}
          </p>
          <p className="text-xs text-slate-600 mb-5">
            {mediaMode === 'video'
              ? 'Supported: MP4, WebM, MOV • Optimal duration: 5–10s • Max 80MB'
              : 'Supported: JPG, PNG, WebP • Clear lighting • Max 80MB'}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (mediaMode === 'video') cameraVideoInputRef.current?.click();
                else cameraPhotoInputRef.current?.click();
              }}
              className="btn-primary w-full sm:w-auto text-xs px-6 py-3 shadow-sm"
            >
              <Camera className="w-4 h-4" />
              {mediaMode === 'video' ? 'Record with Camera' : 'Take Water Photo'}
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="btn-secondary w-full sm:w-auto text-xs px-6 py-3"
            >
              <Upload className="w-4 h-4 text-slate-600" />
              {mediaMode === 'video' ? 'Browse Video File' : 'Browse Photo File'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {previewUrl && (
            <div className="relative rounded-card overflow-hidden bg-black aspect-video max-h-[360px] flex items-center justify-center border border-slate-300 shadow-md">
              {isImage ? (
                <img
                  src={previewUrl}
                  alt="Water sample preview"
                  className="w-full h-full object-contain"
                />
              ) : (
                <video
                  src={previewUrl}
                  controls
                  playsInline
                  className="w-full h-full object-contain"
                />
              )}
            </div>
          )}

          <div className="flex items-center justify-between p-3.5 rounded-control bg-slate-50 border border-slate-200 text-xs">
            <div className="flex items-center gap-2.5 truncate">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-bold text-slate-900 truncate">{selectedFile.name}</span>
            </div>
            <div className="flex items-center gap-3 text-slate-600 shrink-0 font-mono font-semibold">
              <span>{(selectedFile.size / (1024 * 1024)).toFixed(1)} MB</span>
              <span>{isImage ? 'Still Photo' : `${duration ? duration.toFixed(1) : '—'}s`}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
