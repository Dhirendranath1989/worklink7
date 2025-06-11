import React, { useState } from 'react';
import { FaStar, FaMapMarkerAlt, FaHeart, FaRegHeart, FaCheckCircle } from 'react-icons/fa';
import { toast } from 'react-toastify';

const WorkerCard = ({ worker, onClick, onSave, onUnsave, isSaved = false }) => {
  const [isLiked, setIsLiked] = useState(isSaved);
  const [isLoading, setIsLoading] = useState(false);

  const handleSaveToggle = async (e) => {
    e.stopPropagation(); // Prevent card click
    setIsLoading(true);
    
    try {
      if (isLiked) {
        await onUnsave?.(worker._id);
        setIsLiked(false);
        toast.success('Worker removed from favorites');
      } else {
        await onSave?.(worker._id);
        setIsLiked(true);
        toast.success('Worker saved to favorites');
      }
    } catch (error) {
      console.error('Error toggling save:', error);
      toast.error('Failed to update favorites');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <FaStar key={i} className="text-yellow-400" />
      );
    }
    
    if (hasHalfStar) {
      stars.push(
        <FaStar key="half" className="text-yellow-400 opacity-50" />
      );
    }
    
    const remainingStars = 5 - Math.ceil(rating);
    for (let i = 0; i < remainingStars; i++) {
      stars.push(
        <FaStar key={`empty-${i}`} className="text-gray-300" />
      );
    }
    
    return stars;
  };

  const formatLocation = (location) => {
    if (!location) return 'Location not specified';
    
    const parts = [];
    if (location.city) parts.push(location.city);
    if (location.state) parts.push(location.state);
    
    return parts.length > 0 ? parts.join(', ') : 'Location not specified';
  };

  const formatSkills = (skills) => {
    if (!skills || skills.length === 0) return [];
    return skills.slice(0, 3); // Show only first 3 skills
  };

  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:-translate-y-1 border border-gray-200 dark:border-gray-700"
      onClick={onClick}
    >
      {/* Card Header with Image and Save Button */}
      <div className="relative">
        <div className="aspect-w-16 aspect-h-12 bg-gray-200 rounded-t-lg overflow-hidden">
          {worker.profilePhoto ? (
            <img
              src={worker.profilePhoto.startsWith('http') ? worker.profilePhoto : `${process.env.REACT_APP_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000'}${worker.profilePhoto}`}
              alt={worker.name}
              className="w-full h-48 object-cover"
              onError={(e) => {
                e.target.src = '/api/placeholder/300/200';
              }}
            />
          ) : (
            <div className="w-full h-48 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
              <span className="text-white text-4xl font-bold">
                {worker.name?.charAt(0)?.toUpperCase() || 'W'}
              </span>
            </div>
          )}
        </div>
        
        {/* Save Button */}
        <button
          onClick={handleSaveToggle}
          disabled={isLoading}
          className="absolute top-3 right-3 p-2 bg-white dark:bg-gray-700 rounded-full shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50"
        >
          {isLiked ? (
            <FaHeart className="text-red-500 text-lg" />
          ) : (
            <FaRegHeart className="text-gray-600 text-lg" />
          )}
        </button>
      </div>

      {/* Card Content */}
      <div className="p-4">
        {/* Worker Name and Verification */}
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
            {worker.name}
          </h3>
          {worker.isVerified && (
            <FaCheckCircle className="text-blue-500 text-sm ml-2 flex-shrink-0" title="Verified Worker" />
          )}
        </div>

        {/* Rating */}
        <div className="flex items-center mb-3">
          <div className="flex items-center space-x-1">
            {renderStars(worker.rating || 0)}
          </div>
          <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">
            {worker.rating ? worker.rating.toFixed(1) : '0.0'}
          </span>
          <span className="ml-1 text-sm text-gray-500 dark:text-gray-400">
            ({worker.reviewCount || 0} reviews)
          </span>
        </div>

        {/* Bio */}
        {worker.bio && (
          <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">
            {worker.bio}
          </p>
        )}

        {/* Skills */}
        <div className="mb-3">
          <div className="flex flex-wrap gap-1">
            {formatSkills(worker.skills).map((skill, index) => (
              <span
                key={index}
                className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs px-2 py-1 rounded-full"
              >
                {skill}
              </span>
            ))}
            {worker.skills && worker.skills.length > 3 && (
              <span className="inline-block bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs px-2 py-1 rounded-full">
                +{worker.skills.length - 3} more
              </span>
            )}
          </div>
        </div>

        {/* Location and Rate */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center text-gray-600 dark:text-gray-300">
            <FaMapMarkerAlt className="mr-1" />
            <span className="truncate">{formatLocation(worker.location)}</span>
          </div>
          {worker.hourlyRate && (
            <div className="text-green-600 font-semibold">
              ₹{worker.hourlyRate}/hr
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkerCard;