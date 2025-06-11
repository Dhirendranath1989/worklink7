import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FaStar, 
  FaMapMarkerAlt, 
  FaPhone, 
  FaEnvelope, 
  FaGlobe, 
  FaCheckCircle,
  FaHeart,
  FaRegHeart,
  FaComment,
  FaBriefcase,
  FaArrowLeft,
  FaDownload,
  FaEye,
  FaTimes,
  FaFilePdf,
  FaFileWord,
  FaFileImage,
  FaShieldAlt,
  FaCalendarAlt,
  FaDollarSign,
  FaClock,
  FaThumbsUp,
  FaShare,
  FaFlag,
  FaBookmark,
  FaRegBookmark,
  FaCamera,
  FaFileAlt,
  FaUserCheck
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import { workerSearchAPI, reviewAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';

const WorkerProfile = () => {
  const { workerId } = useParams();
  const navigate = useNavigate();
  
  // Core state
  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Tab-specific state
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [totalReviews, setTotalReviews] = useState(0);
  
  // Action state
  const [isSaved, setIsSaved] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  
  // Modal state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    if (workerId) {
      fetchWorkerProfile();
    }
  }, [workerId]);

  useEffect(() => {
    if (activeTab === 'posts' && workerId) {
      fetchWorkerPosts();
    } else if (activeTab === 'reviews' && workerId) {
      fetchWorkerReviews();
    }
  }, [activeTab, workerId]);

  const fetchWorkerProfile = async () => {
    try {
      setLoading(true);
      const response = await workerSearchAPI.getWorkerProfile(workerId);
      
      if (response.data.success) {
        setWorker(response.data.worker);
      } else {
        toast.error('Worker not found');
        navigate('/search-workers');
      }
    } catch (error) {
      console.error('Error fetching worker profile:', error);
      toast.error('Failed to load worker profile');
      navigate('/search-workers');
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkerPosts = async () => {
    try {
      setPostsLoading(true);
      const response = await workerSearchAPI.getWorkerPosts(workerId, { page: 1, limit: 10 });
      
      if (response.data.success) {
        setPosts(response.data.posts || []);
      }
    } catch (error) {
      console.error('Error fetching worker posts:', error);
      toast.error('Failed to load worker posts');
    } finally {
      setPostsLoading(false);
    }
  };

  const fetchWorkerReviews = async () => {
    try {
      setReviewsLoading(true);
      const response = await reviewAPI.getWorkerReviews(workerId, 1, 10);
      
      setReviews(response.data.reviews || []);
      setTotalReviews(response.data.totalReviews || 0);
    } catch (error) {
      console.error('Error fetching worker reviews:', error);
      toast.error('Failed to load worker reviews');
    } finally {
      setReviewsLoading(false);
    }
  };

  // Action handlers
  const handleContact = () => {
    toast.info('Redirecting to chat...');
    // TODO: Implement chat functionality
  };

  const handleReview = () => {
    setShowReviewModal(true);
  };

  const handleHire = () => {
    toast.info('Redirecting to hire process...');
    // TODO: Implement hire functionality
  };

  const handleSaveToggle = async () => {
    try {
      setIsSaved(!isSaved);
      toast.success(isSaved ? 'Worker removed from favorites' : 'Worker saved to favorites');
    } catch (error) {
      console.error('Error toggling save:', error);
      toast.error('Failed to update favorites');
    }
  };

  const handleBookmarkToggle = async () => {
    try {
      setIsBookmarked(!isBookmarked);
      toast.success(isBookmarked ? 'Bookmark removed' : 'Worker bookmarked');
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      toast.error('Failed to update bookmark');
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${worker.name} - WorkLink Profile`,
        text: `Check out ${worker.name}'s profile on WorkLink`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Profile link copied to clipboard');
    }
  };

  const handleReport = () => {
    toast.info('Report functionality will be implemented');
    // TODO: Implement report functionality
  };

  const handleSubmitReview = async () => {
    if (reviewRating === 0) {
      toast.error('Please select a rating');
      return;
    }

    if (!reviewComment.trim()) {
      toast.error('Please write a comment');
      return;
    }

    try {
      setIsSubmittingReview(true);
      await reviewAPI.createReview({
        workerId: workerId,
        rating: reviewRating,
        comment: reviewComment.trim()
      });
      
      toast.success('Review submitted successfully!');
      setShowReviewModal(false);
      setReviewRating(0);
      setReviewComment('');
      fetchWorkerReviews();
      fetchWorkerProfile(); // Refresh to update average rating
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error(error.response?.data?.message || 'Failed to submit review');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Utility functions
  const renderStars = (rating, size = 'text-base') => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={i} className={`text-yellow-400 ${size}`} />);
    }
    
    if (hasHalfStar) {
      stars.push(<FaStar key="half" className={`text-yellow-400 opacity-50 ${size}`} />);
    }
    
    const remainingStars = 5 - Math.ceil(rating);
    for (let i = 0; i < remainingStars; i++) {
      stars.push(<FaStar key={`empty-${i}`} className={`text-gray-300 ${size}`} />);
    }
    
    return stars;
  };

  const formatLocation = (location) => {
    if (!location) return 'Location not specified';
    
    const parts = [];
    if (location.address) parts.push(location.address);
    if (location.city) parts.push(location.city);
    if (location.state) parts.push(location.state);
    if (location.zipCode) parts.push(location.zipCode);
    
    return parts.length > 0 ? parts.join(', ') : 'Location not specified';
  };

  const getFileIcon = (filename) => {
    const extension = filename.split('.').pop().toLowerCase();
    switch (extension) {
      case 'pdf':
        return <FaFilePdf className="text-red-500" />;
      case 'doc':
      case 'docx':
        return <FaFileWord className="text-blue-500" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <FaFileImage className="text-green-500" />;
      default:
        return <FaFileAlt className="text-gray-500" />;
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FaBriefcase },
    { id: 'photos', label: 'Work Photos', icon: FaCamera },
    { id: 'documents', label: 'Documents & ID', icon: FaFileAlt },
    { id: 'posts', label: 'Posts & Updates', icon: FaComment },
    { id: 'reviews', label: 'Reviews', icon: FaStar }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  if (!worker) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Worker not found</h2>
          <button
            onClick={() => navigate('/search-workers')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Back to Search
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Back Button */}
          <button
            onClick={() => navigate('/search-workers')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <FaArrowLeft className="mr-2" />
            Back to Search
          </button>
          
          {/* Profile Header */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            {/* Left: Profile Info */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              {/* Profile Photo */}
              <div className="relative">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 shadow-lg">
                  {worker.profilePhoto ? (
                    <img
                      src={worker.profilePhoto}
                      alt={worker.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = '/api/placeholder/150/150';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                      <span className="text-white text-3xl font-bold">
                        {worker.name?.charAt(0)?.toUpperCase() || 'W'}
                      </span>
                    </div>
                  )}
                </div>
                {worker.isVerified && (
                  <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 shadow-lg">
                    <FaCheckCircle className="text-blue-500 text-xl" title="Verified Worker" />
                  </div>
                )}
              </div>
              
              {/* Basic Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">{worker.name}</h1>
                  {worker.isVerified && (
                    <FaUserCheck className="text-blue-500 text-xl" title="Verified Professional" />
                  )}
                </div>
                
                {/* Profession/Title */}
                {worker.profession && (
                  <p className="text-xl text-gray-700 font-medium mb-2">{worker.profession}</p>
                )}
                
                {/* Rating */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center gap-1">
                    {renderStars(worker.averageRating || 0, 'text-lg')}
                  </div>
                  <span className="text-lg font-semibold text-gray-900">
                    {worker.averageRating ? worker.averageRating.toFixed(1) : '0.0'}
                  </span>
                  <span className="text-gray-600">
                    ({worker.totalReviews || 0} reviews)
                  </span>
                </div>
                
                {/* Location */}
                <div className="flex items-center text-gray-600 mb-3">
                  <FaMapMarkerAlt className="mr-2 text-red-500" />
                  <span>{formatLocation(worker.location)}</span>
                </div>
                
                {/* Experience & Rate */}
                <div className="flex flex-wrap gap-4 text-sm">
                  {worker.experienceYears && (
                    <div className="flex items-center text-gray-600">
                      <FaClock className="mr-1" />
                      <span>{worker.experienceYears} years experience</span>
                    </div>
                  )}
                  {worker.hourlyRate && (
                    <div className="flex items-center text-gray-600">
                      <FaDollarSign className="mr-1" />
                      <span>${worker.hourlyRate}/hour</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Right: Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleContact}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors font-medium"
              >
                <FaComment />
                <span>Contact</span>
              </button>
              
              <button
                onClick={handleReview}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors font-medium"
              >
                <FaStar />
                <span>Leave Review</span>
              </button>
              
              <button
                onClick={handleHire}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors font-medium"
              >
                <FaBriefcase />
                <span>Hire Now</span>
              </button>
              
              {/* Secondary Actions */}
              <div className="flex gap-2">
                <button
                  onClick={handleSaveToggle}
                  className={`p-3 rounded-lg transition-colors ${
                    isSaved
                      ? 'bg-red-100 text-red-600 hover:bg-red-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title={isSaved ? 'Remove from favorites' : 'Add to favorites'}
                >
                  {isSaved ? <FaHeart /> : <FaRegHeart />}
                </button>
                
                <button
                  onClick={handleBookmarkToggle}
                  className={`p-3 rounded-lg transition-colors ${
                    isBookmarked
                      ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
                >
                  {isBookmarked ? <FaBookmark /> : <FaRegBookmark />}
                </button>
                
                <button
                  onClick={handleShare}
                  className="p-3 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                  title="Share profile"
                >
                  <FaShare />
                </button>
                
                <button
                  onClick={handleReport}
                  className="p-3 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                  title="Report profile"
                >
                  <FaFlag />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200 mt-6">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="py-8">
          {activeTab === 'overview' && (
            <OverviewTab worker={worker} />
          )}
          
          {activeTab === 'photos' && (
            <WorkPhotosTab 
              worker={worker} 
              onImageClick={(image) => {
                setSelectedImage(image);
                setShowImageModal(true);
              }}
            />
          )}
          
          {activeTab === 'documents' && (
            <DocumentsTab worker={worker} />
          )}
          
          {activeTab === 'posts' && (
            <PostsTab posts={posts} loading={postsLoading} />
          )}
          
          {activeTab === 'reviews' && (
            <ReviewsTab 
              reviews={reviews} 
              loading={reviewsLoading} 
              totalReviews={totalReviews}
              onWriteReview={handleReview}
            />
          )}
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Write a Review</h3>
              <button
                onClick={() => {
                  setShowReviewModal(false);
                  setReviewRating(0);
                  setReviewComment('');
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FaTimes />
              </button>
            </div>
            
            {/* Rating */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rating
              </label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    className="text-2xl focus:outline-none transition-colors"
                  >
                    {star <= reviewRating ? (
                      <FaStar className="text-yellow-400" />
                    ) : (
                      <FaStar className="text-gray-300 hover:text-yellow-200" />
                    )}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Comment */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comment
              </label>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Share your experience with this worker..."
              />
            </div>
            
            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowReviewModal(false);
                  setReviewRating(0);
                  setReviewComment('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReview}
                disabled={isSubmittingReview || reviewRating === 0 || !reviewComment.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmittingReview ? (
                  <div className="flex items-center justify-center">
                    <LoadingSpinner size="sm" />
                  </div>
                ) : (
                  'Submit Review'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {showImageModal && selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => {
                setShowImageModal(false);
                setSelectedImage(null);
              }}
              className="absolute top-4 right-4 text-white hover:text-gray-300 text-2xl z-10"
            >
              <FaTimes />
            </button>
            <img
              src={selectedImage}
              alt="Work photo"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Overview Tab Component
const OverviewTab = ({ worker }) => {
  const renderAvailability = (availability) => {
    if (!availability || typeof availability !== 'object') {
      return <span className="text-gray-500">Not specified</span>;
    }

    const availableDays = Object.entries(availability)
      .filter(([day, info]) => info && info.available)
      .map(([day, info]) => ({
        day: day.charAt(0).toUpperCase() + day.slice(1),
        hours: info.hours || 'Not specified'
      }));

    if (availableDays.length === 0) {
      return <span className="text-gray-500">No availability set</span>;
    }

    return (
      <div className="space-y-2">
        {availableDays.map(({ day, hours }) => (
          <div key={day} className="flex justify-between text-sm">
            <span className="font-medium text-gray-700">{day}:</span>
            <span className="text-gray-600">{hours}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Main Content */}
      <div className="lg:col-span-2 space-y-6">
        {/* About Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">About</h3>
          <p className="text-gray-700 leading-relaxed">
            {worker.bio || worker.description || 'No description available.'}
          </p>
        </div>
        
        {/* Skills */}
        {worker.skills && worker.skills.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills & Expertise</h3>
            <div className="flex flex-wrap gap-2">
              {worker.skills.map((skill, index) => (
                <span
                  key={index}
                  className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {/* Work Experience */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Work Experience</h3>
          {worker.workExperience ? (
            Array.isArray(worker.workExperience) ? (
              <div className="space-y-4">
                {worker.workExperience.map((exp, index) => (
                  <div key={index} className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-medium text-gray-900">{exp.title || exp.position}</h4>
                    <p className="text-gray-600">{exp.company}</p>
                    <p className="text-sm text-gray-500">{exp.duration || exp.period}</p>
                    {exp.description && (
                      <p className="text-gray-700 mt-2">{exp.description}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-700 leading-relaxed">{worker.workExperience}</p>
            )
          ) : (
            <p className="text-gray-500">No work experience listed.</p>
          )}
        </div>

        {/* Languages */}
        {worker.languagesSpoken && worker.languagesSpoken.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Languages</h3>
            <div className="flex flex-wrap gap-2">
              {worker.languagesSpoken.map((language, index) => (
                <span
                  key={index}
                  className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium"
                >
                  {language}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Sidebar */}
      <div className="space-y-6">
        {/* Contact Info */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Info</h3>
          <div className="space-y-3">
            {worker.email && (
              <div className="flex items-center text-gray-600">
                <FaEnvelope className="mr-3 text-blue-500" />
                <span className="text-sm">{worker.email}</span>
              </div>
            )}
            {worker.phone && (
              <div className="flex items-center text-gray-600">
                <FaPhone className="mr-3 text-green-500" />
                <span className="text-sm">{worker.phone}</span>
              </div>
            )}
            {worker.website && (
              <div className="flex items-center text-gray-600">
                <FaGlobe className="mr-3 text-purple-500" />
                <a 
                  href={worker.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  {worker.website}
                </a>
              </div>
            )}
          </div>
        </div>
        
        {/* Pricing & Rates */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing & Rates</h3>
          <div className="space-y-3">
            {worker.hourlyRate && (
              <div className="flex justify-between">
                <span className="text-gray-600">Hourly Rate:</span>
                <span className="font-medium text-gray-900">${worker.hourlyRate}/hour</span>
              </div>
            )}
            {worker.minimumRate && (
              <div className="flex justify-between">
                <span className="text-gray-600">Minimum Rate:</span>
                <span className="font-medium text-gray-900">${worker.minimumRate}</span>
              </div>
            )}
            {worker.projectRate && (
              <div className="flex justify-between">
                <span className="text-gray-600">Project Rate:</span>
                <span className="font-medium text-gray-900">${worker.projectRate}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Availability Schedule */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Availability Schedule</h3>
          {renderAvailability(worker.availability)}
        </div>
        
        {/* Stats */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Stats</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Reviews:</span>
              <span className="font-medium text-gray-900">{worker.totalReviews || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Jobs Completed:</span>
              <span className="font-medium text-gray-900">{worker.completedJobs || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Response Time:</span>
              <span className="font-medium text-gray-900">{worker.responseTime || 'N/A'}</span>
            </div>
            {worker.experienceYears && (
              <div className="flex justify-between">
                <span className="text-gray-600">Experience:</span>
                <span className="font-medium text-gray-900">{worker.experienceYears} years</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Verification Status */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Verification Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Identity Verified:</span>
              <div className="flex items-center">
                {worker.isVerified ? (
                  <>
                    <FaCheckCircle className="text-green-500 mr-1" />
                    <span className="text-green-600 text-sm font-medium">Verified</span>
                  </>
                ) : (
                  <span className="text-gray-500 text-sm">Not Verified</span>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Background Check:</span>
              <div className="flex items-center">
                {worker.backgroundCheck ? (
                  <>
                    <FaShieldAlt className="text-green-500 mr-1" />
                    <span className="text-green-600 text-sm font-medium">Completed</span>
                  </>
                ) : (
                  <span className="text-gray-500 text-sm">Not Completed</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Work Photos Tab Component
const WorkPhotosTab = ({ worker, onImageClick }) => {
  if (!worker.workPhotos || worker.workPhotos.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <FaCamera className="mx-auto text-gray-400 text-4xl mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Work Photos</h3>
        <p className="text-gray-500">This worker hasn't uploaded any work photos yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Work Photos ({worker.workPhotos.length})</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {worker.workPhotos.map((photo, index) => (
          <div 
            key={index} 
            className="relative group cursor-pointer overflow-hidden rounded-lg bg-gray-100 aspect-square"
            onClick={() => onImageClick(photo)}
          >
            <img
              src={photo}
              alt={`Work photo ${index + 1}`}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
              onError={(e) => {
                e.target.src = '/api/placeholder/300/300';
              }}
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity flex items-center justify-center">
              <FaEye className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Documents Tab Component
const DocumentsTab = ({ worker }) => {
  const getFileIcon = (filename) => {
    const extension = filename.split('.').pop().toLowerCase();
    switch (extension) {
      case 'pdf':
        return <FaFilePdf className="text-red-500" />;
      case 'doc':
      case 'docx':
        return <FaFileWord className="text-blue-500" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <FaFileImage className="text-green-500" />;
      default:
        return <FaFileAlt className="text-gray-500" />;
    }
  };

  const documents = worker.documents || [];
  const certificates = worker.certificates || [];
  const allDocuments = [...documents, ...certificates];

  if (allDocuments.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <FaFileAlt className="mx-auto text-gray-400 text-4xl mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Documents Available</h3>
        <p className="text-gray-500">This worker hasn't uploaded any documents or certificates yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Documents */}
      {documents.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Documents & ID Proof</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {documents.map((doc, index) => {
              const filename = doc.split('/').pop();
              return (
                <div key={index} className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="text-2xl mr-3">
                    {getFileIcon(filename)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{filename}</p>
                    <p className="text-xs text-gray-500">Document</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => window.open(doc, '_blank')}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      title="View"
                    >
                      <FaEye />
                    </button>
                    <button
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = doc;
                        link.download = filename;
                        link.click();
                      }}
                      className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                      title="Download"
                    >
                      <FaDownload />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Certificates */}
      {certificates.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Certificates & Qualifications</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {certificates.map((cert, index) => {
              const filename = cert.split('/').pop();
              return (
                <div key={index} className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="text-2xl mr-3">
                    {getFileIcon(filename)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{filename}</p>
                    <p className="text-xs text-gray-500">Certificate</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => window.open(cert, '_blank')}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      title="View"
                    >
                      <FaEye />
                    </button>
                    <button
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = cert;
                        link.download = filename;
                        link.click();
                      }}
                      className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                      title="Download"
                    >
                      <FaDownload />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// Posts Tab Component
const PostsTab = ({ posts, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <LoadingSpinner size="lg" />
        <p className="text-gray-500 mt-4">Loading posts...</p>
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <FaComment className="mx-auto text-gray-400 text-4xl mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Posts Yet</h3>
        <p className="text-gray-500">This worker hasn't shared any posts or updates yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {posts.map((post, index) => (
        <div key={index} className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0">
              {post.authorPhoto ? (
                <img
                  src={post.authorPhoto}
                  alt={post.authorName}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">
                    {post.authorName?.charAt(0)?.toUpperCase() || 'W'}
                  </span>
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-medium text-gray-900">{post.authorName}</h4>
                <span className="text-gray-500 text-sm">•</span>
                <span className="text-gray-500 text-sm">
                  {new Date(post.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-gray-700 mb-4">{post.content}</p>
              {post.image && (
                <div className="mb-4">
                  <img
                    src={post.image}
                    alt="Post image"
                    className="rounded-lg max-w-full h-auto"
                  />
                </div>
              )}
              <div className="flex items-center gap-4 text-gray-500">
                <button className="flex items-center gap-1 hover:text-blue-600 transition-colors">
                  <FaThumbsUp />
                  <span className="text-sm">{post.likes || 0}</span>
                </button>
                <button className="flex items-center gap-1 hover:text-blue-600 transition-colors">
                  <FaComment />
                  <span className="text-sm">{post.comments || 0}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Reviews Tab Component
const ReviewsTab = ({ reviews, loading, totalReviews, onWriteReview }) => {
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={i} className="text-yellow-400" />);
    }
    
    if (hasHalfStar) {
      stars.push(<FaStar key="half" className="text-yellow-400 opacity-50" />);
    }
    
    const remainingStars = 5 - Math.ceil(rating);
    for (let i = 0; i < remainingStars; i++) {
      stars.push(<FaStar key={`empty-${i}`} className="text-gray-300" />);
    }
    
    return stars;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <LoadingSpinner size="lg" />
        <p className="text-gray-500 mt-4">Loading reviews...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Reviews Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Reviews ({totalReviews})
          </h3>
          <button
            onClick={onWriteReview}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <FaStar />
            <span>Write Review</span>
          </button>
        </div>
      </div>

      {/* Reviews List */}
      {reviews && reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((review, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0">
                  {review.reviewerPhoto ? (
                    <img
                      src={review.reviewerPhoto}
                      alt={review.reviewerName}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">
                        {review.reviewerName?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium text-gray-900">{review.reviewerName}</h4>
                    <span className="text-gray-500 text-sm">•</span>
                    <span className="text-gray-500 text-sm">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex">
                      {renderStars(review.rating)}
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {review.rating.toFixed(1)}
                    </span>
                  </div>
                  <p className="text-gray-700">{review.comment}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <FaStar className="mx-auto text-gray-400 text-4xl mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Reviews Yet</h3>
          <p className="text-gray-500 mb-4">Be the first to review this worker!</p>
          <button
            onClick={onWriteReview}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Write First Review
          </button>
        </div>
      )}
    </div>
  );
};

export default WorkerProfile;