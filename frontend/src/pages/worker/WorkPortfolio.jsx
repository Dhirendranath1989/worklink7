import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  PhotoIcon,
  EyeIcon,
  PlusIcon,
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

const WorkPortfolio = () => {
  const { user } = useSelector((state) => state.auth);
  const { viewedProfile: profile } = useSelector((state) => state.profiles);
  const [selectedImage, setSelectedImage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  // Get work photos from profile or user data
  const workPhotos = profile?.workPhotos || user?.workPhotos || [];

  // Process work photos to ensure proper image URLs
  const processedPhotos = workPhotos.map((photo, index) => {
    let photoSrc;
    let photoName = `Work Photo ${index + 1}`;
    
    if (typeof photo === 'string') {
      photoSrc = `http://localhost:5000/uploads/${photo}`;
    } else if (photo.path) {
      photoSrc = `http://localhost:5000${photo.path}`;
      photoName = photo.originalName || photo.name || photoName;
    } else if (photo.filename) {
      photoSrc = `http://localhost:5000/uploads/${photo.filename}`;
      photoName = photo.originalName || photo.name || photoName;
    } else {
      photoSrc = `http://localhost:5000/uploads/${photo.name || photo}`;
      photoName = photo.originalName || photo.name || photoName;
    }
    
    return {
      id: index,
      src: photoSrc,
      name: photoName,
      uploadDate: photo.uploadDate || new Date().toLocaleDateString(),
      category: photo.category || 'General'
    };
  });

  // Filter photos based on search and category
  const filteredPhotos = processedPhotos.filter(photo => {
    const matchesSearch = photo.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || photo.category.toLowerCase() === filterCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  // Get unique categories for filter
  const categories = ['all', ...new Set(processedPhotos.map(photo => photo.category))];

  const openImageModal = (photo) => {
    setSelectedImage(photo);
  };

  const closeImageModal = () => {
    setSelectedImage(null);
  };

  const handleImageError = (e) => {
    e.target.src = '/api/placeholder/400/300';
    toast.error('Failed to load image');
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 pt-16">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link
                to="/worker/dashboard"
                className="flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
              >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Back to Dashboard
              </Link>
              <div className="h-6 border-l border-gray-300"></div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Work Portfolio</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {filteredPhotos.length} of {processedPhotos.length} photos
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search photos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* Category Filter */}
            <div className="sm:w-48">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Portfolio Grid */}
        {filteredPhotos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredPhotos.map((photo) => (
              <div key={photo.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 overflow-hidden group hover:shadow-lg transition-shadow">
                <div className="relative aspect-square">
                  <img
                    src={photo.src}
                    alt={photo.name}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => openImageModal(photo)}
                    onError={handleImageError}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-center justify-center">
                    <EyeIcon className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  {photo.category !== 'General' && (
                    <div className="absolute top-2 right-2">
                      <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium">
                        {photo.category}
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-gray-900 dark:text-white truncate">{photo.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{photo.uploadDate}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-12 text-center">
            <PhotoIcon className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {searchTerm || filterCategory !== 'all' ? 'No photos found' : 'No work photos uploaded yet'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {searchTerm || filterCategory !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Upload photos of your work to showcase your skills and attract more clients'
              }
            </p>
            {!searchTerm && filterCategory === 'all' && (
              <Link
                to="/worker/dashboard?tab=profile"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Upload Photos
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={closeImageModal}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
            >
              <XMarkIcon className="h-8 w-8" />
            </button>
            <img
              src={selectedImage.src}
              alt={selectedImage.name}
              className="max-w-full max-h-full object-contain rounded-lg"
              onError={handleImageError}
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-4 rounded-b-lg">
              <h3 className="font-medium text-lg">{selectedImage.name}</h3>
              <p className="text-sm opacity-75">{selectedImage.uploadDate} • {selectedImage.category}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkPortfolio;