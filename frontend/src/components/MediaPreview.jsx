import React, { useState } from 'react';
import {
  PhotoIcon,
  DocumentIcon,
  EyeIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import ImageViewer from './ImageViewer';

const MediaPreview = ({ 
  workPhotos = [], 
  certificates = [], 
  showTitle = true,
  maxItems = 6,
  onViewAll,
  className = '' 
}) => {
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewingType, setViewingType] = useState('photos'); // 'photos' or 'certificates'

  // Process work photos
  const processedPhotos = workPhotos.map((photo, index) => {
    let photoSrc;
    let photoName = `Work Photo ${index + 1}`;
    
    if (typeof photo === 'object' && photo.path) {
      photoSrc = photo.path.startsWith('http') ? photo.path : `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000'}${photo.path}`;
      photoName = photo.originalName || photo.name || photoName;
    } else if (typeof photo === 'object' && photo.filename) {
      photoSrc = `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000'}/uploads/${photo.filename}`;
      photoName = photo.originalName || photo.name || photoName;
    } else if (typeof photo === 'string') {
      photoSrc = photo.startsWith('http') ? photo : `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000'}${photo}`;
      photoName = photo.split('/').pop() || photoName;
    } else {
      photoSrc = `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000'}/uploads/${photo.name || photo}`;
      photoName = photo.originalName || photo.name || photoName;
    }
    
    return {
      id: index,
      src: photoSrc,
      name: photoName,
      uploadDate: photo.uploadDate || new Date().toLocaleDateString(),
      category: photo.category || 'General',
      isImage: true
    };
  });

  // Process certificates
  const processedCertificates = certificates.map((cert, index) => {
    let certSrc, certName, certType;
    
    if (typeof cert === 'object' && cert.path) {
      certSrc = cert.path.startsWith('http') ? cert.path : `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000'}${cert.path}`;
      certName = cert.originalName || cert.name || `Certificate ${index + 1}`;
      certType = cert.type || 'Certificate';
    } else if (typeof cert === 'object' && cert.filename) {
      certSrc = `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000'}/uploads/${cert.filename}`;
      certName = cert.originalName || cert.originalname || cert.name || `Certificate ${index + 1}`;
      certType = cert.type || 'Certificate';
    } else if (typeof cert === 'string') {
      certSrc = cert.startsWith('http') ? cert : `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000'}${cert}`;
      certName = cert.split('/').pop() || `Certificate ${index + 1}`;
      certType = 'Certificate';
    } else {
      certSrc = `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000'}/uploads/${cert.name || cert}`;
      certName = cert.originalName || cert.name || `Certificate ${index + 1}`;
      certType = cert.type || 'Certificate';
    }
    
    const fileExtension = certName.split('.').pop()?.toLowerCase();
    const isPDF = fileExtension === 'pdf';
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension);
    
    return {
      id: index,
      src: certSrc,
      name: certName,
      type: certType,
      uploadDate: cert.uploadDate || new Date().toLocaleDateString(),
      issueDate: cert.issueDate || 'Not specified',
      expiryDate: cert.expiryDate || 'No expiry',
      issuer: cert.issuer || 'Not specified',
      isPDF,
      isImage,
      fileExtension: fileExtension?.toUpperCase() || 'FILE'
    };
  });

  const displayedPhotos = processedPhotos.slice(0, maxItems);
  const displayedCertificates = processedCertificates.slice(0, maxItems);
  const remainingPhotos = Math.max(0, processedPhotos.length - maxItems);
  const remainingCertificates = Math.max(0, processedCertificates.length - maxItems);

  const openViewer = (type, index) => {
    setViewingType(type);
    setCurrentIndex(index);
    setIsViewerOpen(true);
  };

  const closeViewer = () => {
    setIsViewerOpen(false);
  };

  const handleIndexChange = (newIndex) => {
    setCurrentIndex(newIndex);
  };

  const currentImages = viewingType === 'photos' ? processedPhotos : processedCertificates;

  if (processedPhotos.length === 0 && processedCertificates.length === 0) {
    return null;
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6 ${className}`}>
      {showTitle && (
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Portfolio Preview</h3>
      )}

      {/* Work Photos Section */}
      {processedPhotos.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <PhotoIcon className="h-5 w-5 text-blue-500 dark:text-blue-400 mr-2" />
              <h4 className="font-medium text-gray-900 dark:text-white">
                Work Photos ({processedPhotos.length})
              </h4>
            </div>
            {processedPhotos.length > maxItems && onViewAll && (
              <button
                onClick={() => onViewAll('photos')}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
              >
                View All
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {displayedPhotos.map((photo, index) => (
              <div
                key={photo.id}
                className="relative aspect-square group cursor-pointer"
                onClick={() => openViewer('photos', index)}
              >
                <img
                  src={photo.src}
                  alt={photo.name}
                  className="w-full h-full object-cover rounded-lg border-2 border-gray-200 dark:border-gray-600 group-hover:border-blue-400 dark:group-hover:border-blue-500 transition-colors"
                  onError={(e) => {
                    e.target.src = '/api/placeholder/150/150';
                  }}
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity rounded-lg flex items-center justify-center">
                  <EyeIcon className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ))}
            
            {remainingPhotos > 0 && (
              <div
                className="relative aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
                onClick={() => onViewAll && onViewAll('photos')}
              >
                <PlusIcon className="h-6 w-6 text-gray-400 dark:text-gray-500 mb-1" />
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  +{remainingPhotos} more
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Certificates Section */}
      {processedCertificates.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <DocumentIcon className="h-5 w-5 text-green-500 dark:text-green-400 mr-2" />
              <h4 className="font-medium text-gray-900 dark:text-white">
                Document & ID Proof ({processedCertificates.length})
              </h4>
            </div>
            {processedCertificates.length > maxItems && onViewAll && (
              <button
                onClick={() => onViewAll('certificates')}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
              >
                View All
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {displayedCertificates.map((cert, index) => (
              <div
                key={cert.id}
                className="relative aspect-square group cursor-pointer"
                onClick={() => openViewer('certificates', index)}
              >
                {cert.isImage ? (
                  <img
                    src={cert.src}
                    alt={cert.name}
                    className="w-full h-full object-cover rounded-lg border-2 border-gray-200 dark:border-gray-600 group-hover:border-green-400 dark:group-hover:border-green-500 transition-colors"
                    onError={(e) => {
                      e.target.src = '/api/placeholder/150/150';
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 dark:bg-gray-700 rounded-lg border-2 border-gray-200 dark:border-gray-600 group-hover:border-green-400 dark:group-hover:border-green-500 transition-colors flex flex-col items-center justify-center p-2">
                    <DocumentIcon className="h-8 w-8 text-gray-400 dark:text-gray-500 mb-1" />
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium text-center">
                      {cert.fileExtension}
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity rounded-lg flex items-center justify-center">
                  <EyeIcon className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ))}
            
            {remainingCertificates > 0 && (
              <div
                className="relative aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center cursor-pointer hover:border-green-400 dark:hover:border-green-500 transition-colors"
                onClick={() => onViewAll && onViewAll('certificates')}
              >
                <PlusIcon className="h-6 w-6 text-gray-400 dark:text-gray-500 mb-1" />
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  +{remainingCertificates} more
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Image Viewer */}
      <ImageViewer
        isOpen={isViewerOpen}
        onClose={closeViewer}
        images={currentImages}
        currentIndex={currentIndex}
        onIndexChange={handleIndexChange}
        showNavigation={true}
        showDownload={true}
      />
    </div>
  );
};

export default MediaPreview;