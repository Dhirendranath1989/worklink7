import React, { useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  DocumentIcon,
  PlusIcon,
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  AcademicCapIcon,
  CalendarIcon,
  DocumentTextIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import ImageViewer from '../../components/ImageViewer';

const Certificates = () => {
  const { user } = useSelector((state) => state.auth);
  const { viewedProfile: profile } = useSelector((state) => state.profiles);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [currentCertificateIndex, setCurrentCertificateIndex] = useState(0);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [triggerElement, setTriggerElement] = useState(null);
  const certificateRefs = useRef([]);

  // Get certificates from profile or user data
  const certificates = profile?.certificates || user?.certificates || [];

  // Process certificates to ensure proper image URLs
  const processedCertificates = certificates.map((cert, index) => {
    let certSrc;
    let certName = `Certificate ${index + 1}`;
    
    if (typeof cert === 'object' && cert.path) {
      // New structure with path, originalName, etc.
      certSrc = cert.path.startsWith('http') ? cert.path : `http://localhost:5000${cert.path}`;
      certName = cert.originalName || cert.name || certName;
    } else if (typeof cert === 'object' && cert.filename) {
      // Legacy structure with filename
      certSrc = `http://localhost:5000/uploads/${cert.filename}`;
      certName = cert.originalName || cert.name || certName;
    } else if (typeof cert === 'string') {
      // Simple string path
      certSrc = cert.startsWith('http') ? cert : `http://localhost:5000${cert}`;
      certName = cert.split('/').pop() || certName;
    } else {
      // Fallback
      certSrc = `http://localhost:5000/uploads/${cert.name || cert}`;
      certName = cert.originalName || cert.name || certName;
    }
    
    return {
      id: index,
      src: certSrc,
      name: certName,
      issueDate: cert.issueDate || new Date().toLocaleDateString(),
      type: cert.type || 'Professional',
      issuer: cert.issuer || 'Unknown Issuer'
    };
  });

  // Filter certificates based on search and type
  const filteredCertificates = processedCertificates.filter(cert => {
    const matchesSearch = cert.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cert.issuer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || cert.type.toLowerCase() === filterType.toLowerCase();
    return matchesSearch && matchesType;
  });

  // Get unique types for filter
  const types = ['all', ...new Set(processedCertificates.map(cert => cert.type))];

  const handleImageError = (e) => {
    e.target.src = '/api/placeholder/400/300';
    toast.error('Failed to load certificate image');
  };

  const openCertificateModal = (cert, index, element) => {
    setSelectedCertificate(cert);
    setCurrentCertificateIndex(index);
    setTriggerElement(element);
    setIsViewerOpen(true);
  };

  const closeCertificateModal = () => {
    setIsViewerOpen(false);
    setSelectedCertificate(null);
    setTriggerElement(null);
  };

  const handleIndexChange = (newIndex) => {
    setCurrentCertificateIndex(newIndex);
    setSelectedCertificate(filteredCertificates[newIndex]);
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
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Certificates</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {filteredCertificates.length} of {processedCertificates.length} certificates
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
                placeholder="Search certificates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* Type Filter */}
            <div className="sm:w-48">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {types.map(type => (
                  <option key={type} value={type}>
                    {type === 'all' ? 'All Types' : type}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Certificates Grid */}
        {filteredCertificates.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredCertificates.map((cert, index) => (
              <div key={cert.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 overflow-hidden group hover:shadow-lg transition-all duration-300 hover:scale-105">
                <div className="relative aspect-[4/3]">
                  <img
                    ref={(el) => certificateRefs.current[index] = el}
                    src={cert.src}
                    alt={cert.name}
                    className="w-full h-full object-cover cursor-pointer transition-transform duration-300 group-hover:scale-110"
                    onError={handleImageError}
                    onClick={(e) => openCertificateModal(cert, index, e.target)}
                  />
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center cursor-pointer"
                       onClick={(e) => {
                         e.preventDefault();
                         openCertificateModal(cert, index, certificateRefs.current[index]);
                       }}>
                    <EyeIcon className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  <div className="absolute top-2 right-2 z-10">
                    <span className="bg-green-600 text-white px-2 py-1 rounded text-xs font-medium">
                      {cert.type}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-gray-900 dark:text-white truncate mb-2">{cert.name}</h3>
                  <div className="space-y-1">
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <AcademicCapIcon className="h-4 w-4 mr-2" />
                      <span className="truncate">{cert.issuer}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      <span>{cert.issueDate}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-12 text-center">
            <DocumentIcon className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {searchTerm || filterType !== 'all' ? 'No certificates found' : 'No certificates uploaded yet'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {searchTerm || filterType !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Upload your certificates to showcase your qualifications and expertise'
              }
            </p>
            {!searchTerm && filterType === 'all' && (
              <Link
                to="/worker/dashboard?tab=profile"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Upload Certificates
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Certificate Viewer Modal */}
      {isViewerOpen && (
        <ImageViewer
          isOpen={isViewerOpen}
          onClose={closeCertificateModal}
          images={filteredCertificates}
          currentIndex={currentCertificateIndex}
          onIndexChange={handleIndexChange}
          triggerElement={triggerElement}
          showNavigation={true}
          showDownload={true}
        />
      )}
    </div>
  );
};

export default Certificates;