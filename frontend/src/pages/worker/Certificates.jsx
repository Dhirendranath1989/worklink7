import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  DocumentIcon,
  EyeIcon,
  PlusIcon,
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  AcademicCapIcon,
  CalendarIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

const Certificates = () => {
  const { user } = useSelector((state) => state.auth);
  const { viewedProfile: profile } = useSelector((state) => state.profiles);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  // Get certificates from profile or user data
  const certificates = profile?.certificates || user?.certificates || [];

  // Process certificates to ensure proper URLs and metadata
  const processedCertificates = certificates.map((cert, index) => {
    let certSrc;
    let certName;
    let certType = 'Certificate';
    
    if (typeof cert === 'string') {
      certSrc = `http://localhost:5000/uploads/${cert}`;
      certName = `Certificate ${index + 1}`;
    } else if (cert.path) {
      certSrc = `http://localhost:5000${cert.path}`;
      certName = cert.originalName || cert.name || `Certificate ${index + 1}`;
      certType = cert.type || 'Certificate';
    } else if (cert.filename) {
      certSrc = `http://localhost:5000/uploads/${cert.filename}`;
      certName = cert.originalName || cert.originalname || cert.name || `Certificate ${index + 1}`;
      certType = cert.type || 'Certificate';
    } else {
      certSrc = `http://localhost:5000/uploads/${cert.name || cert}`;
      certName = cert.originalName || cert.name || `Certificate ${index + 1}`;
      certType = cert.type || 'Certificate';
    }
    
    // Determine file type from extension
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

  // Filter certificates based on search and type
  const filteredCertificates = processedCertificates.filter(cert => {
    const matchesSearch = cert.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cert.issuer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || 
                       (filterType === 'pdf' && cert.isPDF) ||
                       (filterType === 'image' && cert.isImage);
    return matchesSearch && matchesType;
  });

  const openCertificateModal = (cert) => {
    setSelectedCertificate(cert);
  };

  const closeCertificateModal = () => {
    setSelectedCertificate(null);
  };

  const handleFileError = (e) => {
    e.target.src = '/api/placeholder/400/300';
    toast.error('Failed to load certificate');
  };

  const downloadCertificate = (cert) => {
    const link = document.createElement('a');
    link.href = cert.src;
    link.download = cert.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getCertificateIcon = (cert) => {
    if (cert.isPDF) {
      return <DocumentTextIcon className="h-8 w-8 text-red-600" />;
    } else if (cert.isImage) {
      return <DocumentIcon className="h-8 w-8 text-blue-600" />;
    } else {
      return <DocumentIcon className="h-8 w-8 text-gray-600 dark:text-gray-300" />;
    }
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
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Certificates & Licenses</h1>
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
                <option value="all">All Types</option>
                <option value="pdf">PDF Documents</option>
                <option value="image">Images</option>
              </select>
            </div>
          </div>
        </div>

        {/* Certificates Grid */}
        {filteredCertificates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCertificates.map((cert) => (
              <div key={cert.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {getCertificateIcon(cert)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 dark:text-white truncate">{cert.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{cert.type}</p>
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <AcademicCapIcon className="h-4 w-4 mr-2" />
                          <span>{cert.issuer}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <CalendarIcon className="h-4 w-4 mr-2" />
                          <span>Uploaded: {cert.uploadDate}</span>
                        </div>
                        {cert.issueDate !== 'Not specified' && (
                          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                            <CalendarIcon className="h-4 w-4 mr-2" />
                            <span>Issued: {cert.issueDate}</span>
                          </div>
                        )}
                        {cert.expiryDate !== 'No expiry' && (
                          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                            <CalendarIcon className="h-4 w-4 mr-2" />
                            <span>Expires: {cert.expiryDate}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        {cert.fileExtension}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex space-x-3">
                    <button
                      onClick={() => openCertificateModal(cert)}
                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                    >
                      <EyeIcon className="h-4 w-4 mr-2" />
                      View
                    </button>
                    <button
                      onClick={() => downloadCertificate(cert)}
                      className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center"
                    >
                      <DocumentIcon className="h-4 w-4 mr-2" />
                      Download
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-12 text-center">
            <AcademicCapIcon className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {searchTerm || filterType !== 'all' ? 'No certificates found' : 'No certificates uploaded yet'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {searchTerm || filterType !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Upload your professional certificates and licenses to build trust with clients'
              }
            </p>
            {!searchTerm && filterType === 'all' && (
              <Link
                to="/worker/dashboard?tab=profile"
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Upload Certificates
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Certificate Modal */}
      {selectedCertificate && (
        <div className="fixed inset-0 bg-black flex items-center justify-center z-50" onClick={closeCertificateModal}>
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-60"
            onClick={closeCertificateModal}
          >
            <XMarkIcon className="h-8 w-8" />
          </button>
          {selectedCertificate.isPDF ? (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4 text-center" onClick={(e) => e.stopPropagation()}>
              <DocumentTextIcon className="h-16 w-16 text-red-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">{selectedCertificate.name}</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">PDF files cannot be previewed here</p>
              <button
                onClick={() => window.open(selectedCertificate.src, '_blank')}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mr-2"
              >
                Open in New Tab
              </button>
              <button
                onClick={() => downloadCertificate(selectedCertificate)}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                Download
              </button>
            </div>
          ) : selectedCertificate.isImage ? (
            <div className="relative max-w-4xl max-h-full" onClick={(e) => e.stopPropagation()}>
              <img
                src={selectedCertificate.src}
                alt={selectedCertificate.name}
                className="max-w-full max-h-screen object-contain"
                onError={handleFileError}
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white p-4">
                <h3 className="font-medium text-lg">{selectedCertificate.name}</h3>
                <p className="text-sm opacity-75">{selectedCertificate.uploadDate} • {selectedCertificate.type}</p>
                {selectedCertificate.issuer !== 'Not specified' && (
                  <p className="text-sm opacity-75">Issued by: {selectedCertificate.issuer}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4 text-center" onClick={(e) => e.stopPropagation()}>
              <DocumentIcon className="h-16 w-16 text-gray-600 dark:text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">{selectedCertificate.name}</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">This file type cannot be previewed</p>
              <button
                onClick={() => downloadCertificate(selectedCertificate)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Download
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Certificates;