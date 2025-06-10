import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  ArrowDownTrayIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DocumentTextIcon,
  DocumentIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

const ImageViewer = ({ 
  isOpen, 
  onClose, 
  images, 
  currentIndex, 
  onIndexChange,
  showNavigation = true,
  showDownload = true 
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(currentIndex || 0);
  const [isLoading, setIsLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (currentIndex !== undefined) {
      setCurrentImageIndex(currentIndex);
    }
  }, [currentIndex]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setIsLoading(true);
      setImageError(false);
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          if (showNavigation && images.length > 1) {
            goToPrevious();
          }
          break;
        case 'ArrowRight':
          if (showNavigation && images.length > 1) {
            goToNext();
          }
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentImageIndex, images.length, showNavigation]);

  if (!isOpen || !images || images.length === 0) {
    return null;
  }

  const currentImage = images[currentImageIndex];
  if (!currentImage) {
    return null;
  }

  const goToPrevious = () => {
    const newIndex = currentImageIndex > 0 ? currentImageIndex - 1 : images.length - 1;
    setCurrentImageIndex(newIndex);
    setIsLoading(true);
    setImageError(false);
    if (onIndexChange) {
      onIndexChange(newIndex);
    }
  };

  const goToNext = () => {
    const newIndex = currentImageIndex < images.length - 1 ? currentImageIndex + 1 : 0;
    setCurrentImageIndex(newIndex);
    setIsLoading(true);
    setImageError(false);
    if (onIndexChange) {
      onIndexChange(newIndex);
    }
  };

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setImageError(true);
    toast.error('Failed to load image');
  };

  const downloadFile = (file) => {
    const link = document.createElement('a');
    link.href = file.src;
    link.download = file.name || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isImage = currentImage.isImage !== false && !currentImage.isPDF;
  const isPDF = currentImage.isPDF;

  return (
    <div className="fixed inset-0 z-50 bg-black" onClick={onClose}>
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/80 to-transparent p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {showNavigation && images.length > 1 && (
              <div className="text-white text-sm font-medium">
                {currentImageIndex + 1} / {images.length}
              </div>
            )}
            <h3 className="text-white text-lg font-medium truncate max-w-md">
              {currentImage.name}
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            {showDownload && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  downloadFile(currentImage);
                }}
                className="p-2 text-white hover:text-gray-300 transition-colors bg-black/50 rounded-full"
                title="Download"
              >
                <ArrowDownTrayIcon className="h-6 w-6" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-white hover:text-gray-300 transition-colors bg-black/50 rounded-full"
              title="Close"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      {showNavigation && images.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              goToPrevious();
            }}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 p-3 text-white hover:text-gray-300 transition-colors bg-black/50 rounded-full"
            title="Previous"
          >
            <ChevronLeftIcon className="h-8 w-8" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              goToNext();
            }}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 p-3 text-white hover:text-gray-300 transition-colors bg-black/50 rounded-full"
            title="Next"
          >
            <ChevronRightIcon className="h-8 w-8" />
          </button>
        </>
      )}

      {/* Main Content */}
      <div className="w-full h-full flex items-center justify-center p-0 m-0">
        {isImage ? (
          <div className="relative w-full h-full flex items-center justify-center">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
              </div>
            )}
            {!imageError ? (
              <img
                src={currentImage.src}
                alt={currentImage.name}
                className="w-full h-full object-contain"
                onLoad={handleImageLoad}
                onError={handleImageError}
                onClick={(e) => e.stopPropagation()}
                style={{ display: isLoading ? 'none' : 'block' }}
              />
            ) : (
              <div className="text-center text-white p-8">
                <DocumentIcon className="h-20 w-20 mx-auto mb-4 text-gray-400" />
                <p className="text-lg mb-2">Failed to load image</p>
                <p className="text-gray-400">The image could not be displayed</p>
              </div>
            )}
          </div>
        ) : isPDF ? (
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg max-w-md mx-4 text-center" onClick={(e) => e.stopPropagation()}>
            <DocumentTextIcon className="h-20 w-20 text-red-600 mx-auto mb-6" />
            <h3 className="text-xl font-medium mb-4 text-gray-900 dark:text-white">{currentImage.name}</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">PDF files cannot be previewed in fullscreen. Use the options below to view or download.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => window.open(currentImage.src, '_blank')}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
              >
                <DocumentTextIcon className="h-5 w-5 mr-2" />
                Open in New Tab
              </button>
              <button
                onClick={() => downloadFile(currentImage)}
                className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center"
              >
                <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                Download
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg max-w-md mx-4 text-center" onClick={(e) => e.stopPropagation()}>
            <DocumentIcon className="h-20 w-20 text-gray-600 dark:text-gray-300 mx-auto mb-6" />
            <h3 className="text-xl font-medium mb-4 text-gray-900 dark:text-white">{currentImage.name}</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">This file type cannot be previewed. Click below to download the file.</p>
            <button
              onClick={() => downloadFile(currentImage)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center mx-auto"
            >
              <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
              Download File
            </button>
          </div>
        )}
      </div>

      {/* Bottom Info */}
      {isImage && !imageError && (
        <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 to-transparent p-6">
          <div className="text-white">
            <div className="text-sm opacity-90 space-y-1">
              {currentImage.uploadDate && (
                <p>{currentImage.uploadDate}</p>
              )}
              {currentImage.category && (
                <p>Category: {currentImage.category}</p>
              )}
              {currentImage.type && currentImage.type !== 'Certificate' && (
                <p>Type: {currentImage.type}</p>
              )}
              {currentImage.issuer && currentImage.issuer !== 'Not specified' && (
                <p>Issued by: {currentImage.issuer}</p>
              )}
              {currentImage.issueDate && currentImage.issueDate !== 'Not specified' && (
                <p>Issue Date: {currentImage.issueDate}</p>
              )}
              {currentImage.expiryDate && currentImage.expiryDate !== 'No expiry' && (
                <p>Expiry Date: {currentImage.expiryDate}</p>
              )}
              {currentImage.description && (
                <p className="text-gray-300">Description: {currentImage.description}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageViewer;