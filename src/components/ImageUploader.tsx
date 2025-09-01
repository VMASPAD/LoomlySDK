import React, { useRef } from 'react';
import { Button } from './ui/button';
import { Upload } from 'lucide-react';

interface ImageUploaderProps {
  onImageAdd: (imageData: string, fileName: string) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageAdd }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target?.result as string;
      onImageAdd(imageData, file.name);
    };
    reader.readAsDataURL(file);

    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        style={{ display: 'none' }}
      />
      <Button 
        onClick={handleButtonClick}
        variant="outline" 
        size="sm" 
        className="w-full justify-start"
      >
        <Upload className="w-4 h-4 mr-2" />
        Upload Image
      </Button>
    </div>
  );
};

export default ImageUploader;