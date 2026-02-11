import { forwardRef, useImperativeHandle, useRef, useCallback } from 'react';

interface PhotoCaptureProps {
  onPhotoSelected: (base64: string) => void;
}

export interface PhotoCaptureRef {
  openCamera: () => void;
  openGallery: () => void;
}

export const PhotoCapture = forwardRef<PhotoCaptureRef, PhotoCaptureProps>(
  function PhotoCapture({ onPhotoSelected }, ref) {
    const cameraInputRef = useRef<HTMLInputElement>(null);
    const galleryInputRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => ({
      openCamera: () => cameraInputRef.current?.click(),
      openGallery: () => galleryInputRef.current?.click(),
    }));

    const compressAndEmit = useCallback(
      (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const MAX = 800;
            let { width, height } = img;
            if (width > MAX || height > MAX) {
              const scale = MAX / Math.max(width, height);
              width = Math.round(width * scale);
              height = Math.round(height * scale);
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d')!;
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            // Strip "data:image/jpeg;base64," prefix
            const base64 = dataUrl.split(',')[1];
            onPhotoSelected(base64);
          };
          img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
      },
      [onPhotoSelected],
    );

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
          compressAndEmit(file);
        }
        // Reset so the same file can be selected again
        e.target.value = '';
      },
      [compressAndEmit],
    );

    return (
      <>
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleChange}
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleChange}
        />
      </>
    );
  },
);
