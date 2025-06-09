import React, { useState, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  ClockIcon,
  PhoneIcon,
  ChatBubbleLeftIcon,
  HeartIcon,
  UserIcon,
  BriefcaseIcon,
  CheckBadgeIcon,
  EnvelopeIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

// Default avatar constants
const DEFAULT_AVATAR_60 = "data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='60' height='60' fill='%23CCCCCC' rx='30'/%3E%3Cpath d='M30 20c3.3 0 6 2.7 6 6s-2.7 6-6 6-6-2.7-6-6 2.7-6 6-6zm0 28c-6.6 0-12-3.4-12-8 0-4.6 5.4-8 12-8s12 3.4 12 8c0 4.6-5.4 8-12 8z' fill='%23666666'/%3E%3C/svg%3E";
const DEFAULT_AVATAR_150 = "data:image/svg+xml,%3Csvg width='150' height='150' viewBox='0 0 150 150' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='150' height='150' fill='%23CCCCCC' rx='75'/%3E%3Cpath d='M75 50c8.25 0 15 6.75 15 15s-6.75 15-15 15-15-6.75-15-15 6.75-15 15-15zm0 70c-16.5 0-30-8.5-30-20 0-11.5 13.5-20 30-20s30 8.5 30 20c0 11.5-13.5 20-30 20z' fill='%23666666'/%3E%3C/svg%3E";

const SearchWorkers = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [showWorkerProfile, setShowWorkerProfile] = useState(false);
  const [filters, setFilters] = useState({
    location: '',
    minRate: '',
    maxRate: '',
    availability: 'all'
  });

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter skills to search for');
      return;
    }

    setIsSearching(true);
    try {
      const queryParams = new URLSearchParams({
        skills: searchQuery,
        ...filters
      });

      const response = await fetch(`http://localhost:5000/api/search/workers?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setSearchResults(data || []);
        if (data.length === 0) {
          toast.info('No workers found matching your criteria');
        }
      } else {
        toast.error(data.message || 'Failed to search workers');
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('An error occurred while searching');
    } finally {
      setIsSearching(false);
    }
  };

  const handleViewProfile = (worker) => {
    setSelectedWorker(worker);
    setShowWorkerProfile(true);
  };



  const WorkerProfileModal = () => {
    if (!selectedWorker) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Worker Profile</h2>
            <button
              onClick={() => setShowWorkerProfile(false)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
            >
              <XMarkIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          <div className="p-6">
            {/* Profile Header */}
            <div className="flex items-start space-x-6 mb-6">
              <img
                src={selectedWorker.profilePicture 
                  ? (selectedWorker.profilePicture.startsWith('http') 
                      ? selectedWorker.profilePicture 
                      : `http://localhost:5000${selectedWorker.profilePicture}`)
                  : DEFAULT_AVATAR_150
                }
                alt={selectedWorker.name || selectedWorker.fullName}
                className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
              />
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  {selectedWorker.name || selectedWorker.fullName}
                </h3>
                <div className="flex items-center space-x-4 mb-3">

                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    selectedWorker.availabilityStatus === 'available' 
                      ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                      : selectedWorker.availabilityStatus === 'busy'
                      ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                      : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                  }`}>
                    {selectedWorker.availabilityStatus || 'Available'}
                  </span>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center">
                    <MapPinIcon className="h-4 w-4 mr-1" />
                    {selectedWorker.location || 'Location not specified'}
                  </div>
                  <div className="flex items-center">
                    <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                    ₹{selectedWorker.hourlyRate || 0}/hour
                  </div>
                  <div className="flex items-center">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    {selectedWorker.workExperience || 'Experience not specified'}
                  </div>
                </div>
              </div>
            </div>

            {/* Skills */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Skills</h4>
              <div className="flex flex-wrap gap-2">
                {(selectedWorker.skills || []).map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Description */}
            {selectedWorker.description && (
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">About</h4>
                <p className="text-gray-700 dark:text-gray-400 leading-relaxed">
                  {selectedWorker.description}
                </p>
              </div>
            )}

            {/* Languages */}
            {selectedWorker.languagesSpoken && selectedWorker.languagesSpoken.length > 0 && (
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Languages</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedWorker.languagesSpoken.map((language, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded-full text-sm"
                    >
                      {language}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Work Photos */}
            {selectedWorker.workPhotos && selectedWorker.workPhotos.length > 0 && (
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Work Portfolio</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {selectedWorker.workPhotos.map((photo, index) => {
                    const photoSrc = typeof photo === 'string' 
                      ? (photo.startsWith('http') ? photo : `http://localhost:5000${photo}`)
                      : (photo.path ? (photo.path.startsWith('http') ? photo.path : `http://localhost:5000${photo.path}`) : `http://localhost:5000/uploads/${photo.filename || photo}`);
                    return (
                      <img
                        key={index}
                        src={photoSrc}
                        alt={`Work ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border"
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Contact Information */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Contact Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center">
                  <PhoneIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-gray-700 dark:text-gray-300">
                    {selectedWorker.mobile || selectedWorker.phoneNumber || 'Not provided'}
                  </span>
                </div>
                <div className="flex items-center">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-gray-700 dark:text-gray-300">
                    {selectedWorker.email || 'Not provided'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Search Workers</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
            >
              <XMarkIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          <div className="p-6">
            {/* Search Form */}
            <div className="mb-6">
              <div className="flex space-x-4 mb-4">
                <div className="flex-1">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by skills (e.g., plumbing, electrical, carpentry)"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />
                  </div>
                </div>
                <button
                  onClick={handleSearch}
                  disabled={isSearching}
                  className={`px-6 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 ${
                    isSearching ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isSearching ? 'Searching...' : 'Search'}
                </button>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={filters.location}
                    onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Enter location"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Min Rate (₹/hour)
                  </label>
                  <input
                    type="number"
                    value={filters.minRate}
                    onChange={(e) => setFilters(prev => ({ ...prev, minRate: e.target.value }))}
                    placeholder="Min rate"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Max Rate (₹/hour)
                  </label>
                  <input
                    type="number"
                    value={filters.maxRate}
                    onChange={(e) => setFilters(prev => ({ ...prev, maxRate: e.target.value }))}
                    placeholder="Max rate"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Availability
                  </label>
                  <select
                    value={filters.availability}
                    onChange={(e) => setFilters(prev => ({ ...prev, availability: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                  >
                    <option value="all">All</option>
                    <option value="available">Available</option>
                    <option value="busy">Busy</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Search Results */}
            <div>
              {searchResults.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Found {searchResults.length} worker{searchResults.length !== 1 ? 's' : ''}
                  </h3>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchResults.map((worker) => (
                  <div key={worker.id || worker._id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md dark:hover:shadow-gray-900/25 transition-shadow">
                    <div className="flex items-center space-x-4 mb-4">
                      <img
                        src={worker.profilePicture 
                          ? (worker.profilePicture.startsWith('http') 
                              ? worker.profilePicture 
                              : `http://localhost:5000${worker.profilePicture}`)
                          : DEFAULT_AVATAR_60
                        }
                        alt={worker.name || worker.fullName}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {worker.name || worker.fullName}
                        </h4>
                        {/* Average Rating Display */}
                        {worker.averageRating > 0 && (
                          <div className="flex items-center mt-1">
                            <div className="flex items-center mr-2">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <svg
                                  key={star}
                                  className={`h-3 w-3 ${
                                    star <= Math.round(worker.averageRating)
                                      ? 'text-yellow-400 fill-current'
                                      : 'text-gray-300 dark:text-gray-600'
                                  }`}
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                            </div>
                            <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                              {worker.averageRating.toFixed(1)}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                              ({worker.totalReviews || 0})
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1 mb-2">
                        {(worker.skills || []).slice(0, 3).map((skill, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                        {worker.skills && worker.skills.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs">
                            +{worker.skills.length - 3} more
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center">
                          <MapPinIcon className="h-4 w-4 mr-1" />
                          {worker.location ? worker.location.substring(0, 20) + '...' : 'Location not specified'}
                        </div>
                        <div className="flex items-center font-semibold text-green-600 dark:text-green-400">
                          <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                          ₹{worker.hourlyRate || 0}/hr
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        worker.availabilityStatus === 'available' 
                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                          : worker.availabilityStatus === 'busy'
                          ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                          : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                      }`}>
                        {worker.availabilityStatus || 'Available'}
                      </span>
                      <button
                        onClick={() => handleViewProfile(worker)}
                        className="flex items-center px-3 py-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium"
                      >
                        <EyeIcon className="h-4 w-4 mr-1" />
                        View Profile
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {searchResults.length === 0 && searchQuery && !isSearching && (
                <div className="text-center py-12">
                  <UserIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No workers found</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Try adjusting your search criteria or filters
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Worker Profile Modal */}
      {showWorkerProfile && <WorkerProfileModal />}
    </>
  );
};

export default SearchWorkers;