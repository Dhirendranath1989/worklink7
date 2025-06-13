import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
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
  FaCommentDots,
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
  FaChartBar,
  FaCertificate,
  FaFileAlt,
  FaUserCheck
} from 'react-icons/fa';
import { HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { toast } from 'react-toastify';
import { workerSearchAPI, reviewAPI } from '../../services/api';
import { saveWorker, removeSavedWorker, fetchSavedWorkers } from '../../features/savedWorkers/savedWorkersSlice';
import LoadingSpinner from '../../components/LoadingSpinner';


const WorkerProfile = () => {
  const { workerId } = useParams();
  const navigate = useNavigate();
  
  // Helper functions for worker data
  const getWorkerName = (worker) => {
    if (!worker) return 'Worker Name';
    
    // Try name field first (as returned by backend)
    if (worker.name && worker.name.trim()) {
      return worker.name;
    }
    
    // Try firstName + lastName combination
    if (worker.firstName && worker.firstName.trim()) {
      return `${worker.firstName} ${worker.lastName || ''}`.trim();
    }
    
    // Try fullName
    if (worker.fullName && worker.fullName.trim()) {
      return worker.fullName;
    }
    
    // Try displayName
    if (worker.displayName && worker.displayName.trim()) {
      return worker.displayName;
    }
    
    // Try email as last resort (remove @domain part)
    if (worker.email && worker.email.trim()) {
      return worker.email.split('@')[0];
    }
    
    return 'Worker Name';
  };
  
  const getWorkerInitials = (worker) => {
    if (!worker) return 'W';
    
    const name = getWorkerName(worker);
    if (name === 'Worker Name') {
      return 'W';
    }
    
    const nameParts = name.split(' ').filter(part => part.length > 0);
    if (nameParts.length >= 2) {
      return (nameParts[0].charAt(0) + nameParts[1].charAt(0)).toUpperCase();
    } else if (nameParts.length === 1) {
      return nameParts[0].charAt(0).toUpperCase();
    }
    
    return 'W';
  };
  
  const getWorkerProfileImage = (worker) => {
    if (!worker) return null;
    
    const photoPath = worker.profilePhoto || 
                     worker.profilePicture || 
                     worker.avatar || 
                     worker.photo || 
                     worker.profileImage || 
                     worker.image;
    
    if (!photoPath) return null;
    
    // If it's already a full URL, return as is
    if (photoPath.startsWith('http')) {
      return photoPath;
    }
    
    // Otherwise, prepend the backend URL with proper path handling
    const cleanPath = photoPath.startsWith('/') ? photoPath : `/${photoPath}`;
    return `http://localhost:5000${cleanPath}`;
  };
  
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
  
  // Interactive posts state
  const [showComments, setShowComments] = useState({});
  const [newComment, setNewComment] = useState({});
  const [isSubmittingComment, setIsSubmittingComment] = useState({});
  

  
  // Get current user from Redux store
  const { user } = useSelector((state) => state.auth);
  const { savedWorkers } = useSelector((state) => state.savedWorkers);
  const dispatch = useDispatch();

  useEffect(() => {
    if (workerId) {
      fetchWorkerProfile();
    }
    // Fetch saved workers when component mounts
    dispatch(fetchSavedWorkers());
  }, [workerId, dispatch]);

  // Check if current worker is bookmarked
  useEffect(() => {
    if (workerId && savedWorkers) {
      const isWorkerSaved = savedWorkers.some(worker => 
        worker._id === workerId || worker.id === workerId
      );
      setIsBookmarked(isWorkerSaved);
    }
  }, [workerId, savedWorkers]);

  useEffect(() => {
    if (activeTab === 'posts' && workerId) {
      fetchWorkerPosts();
    } else if (activeTab === 'reviews' && workerId) {
      fetchWorkerReviews();
    }
  }, [activeTab, workerId]);

  // Debug useEffect to log worker data after state updates
  useEffect(() => {
    if (worker) {
      console.log('=== WORKER STATE UPDATED ===');
      console.log('Full worker object:', worker);
      console.log('worker.name:', worker.name);
      console.log('worker.firstName:', worker.firstName);
      console.log('worker.lastName:', worker.lastName);
      console.log('worker.fullName:', worker.fullName);
      console.log('worker.displayName:', worker.displayName);
      console.log('getWorkerName result:', getWorkerName(worker));
      console.log('=== END WORKER DEBUG ===');
    }
  }, [worker]);

  const fetchWorkerProfile = async () => {
    try {
      setLoading(true);
      const response = await workerSearchAPI.getWorkerProfile(workerId);
      
      if (response.data.success) {
        console.log('Worker data received:', response.data.worker);
        console.log('Worker firstName:', response.data.worker?.firstName);
        console.log('Worker lastName:', response.data.worker?.lastName);
        console.log('Worker fullName:', response.data.worker?.fullName);
        console.log('Worker name:', response.data.worker?.name);
        console.log('Worker displayName:', response.data.worker?.displayName);
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
      
      console.log('Worker posts response:', response.data);
      
      // Handle different response structures
      if (response.data && response.data.success) {
        setPosts(response.data.posts || []);
      } else if (response.data && Array.isArray(response.data.posts)) {
        setPosts(response.data.posts);
      } else if (response.data && Array.isArray(response.data)) {
        setPosts(response.data);
      } else {
        setPosts([]);
        console.warn('Unexpected response format for worker posts:', response.data);
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

  // Interactive posts handlers
  const handleLikePost = async (postId) => {
    if (!user) {
      toast.error('Please login to like posts');
      return;
    }

    try {
      // Optimistic update
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post._id === postId) {
            const isLiked = Array.isArray(post.likes) ? post.likes.includes(user.userId || user.id) : false;
            const newLikes = isLiked 
              ? post.likes.filter(id => id !== (user.userId || user.id))
              : [...(post.likes || []), (user.userId || user.id)];
            return { ...post, likes: newLikes };
          }
          return post;
        })
      );

      const response = await fetch(`http://localhost:5000/api/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to like post');
      }

      const data = await response.json();
      toast.success(data.message || 'Post liked!');
    } catch (error) {
      console.error('Error liking post:', error);
      toast.error('Failed to like post');
      // Revert optimistic update
      fetchWorkerPosts();
    }
  };

  const handleAddComment = async (postId) => {
    if (!user) {
      toast.error('Please login to comment');
      return;
    }

    const commentText = newComment[postId]?.trim();
    if (!commentText) {
      toast.error('Please enter a comment');
      return;
    }

    // Store original comment for potential restoration
    const originalComment = newComment[postId];
    
    try {
      setIsSubmittingComment(prev => ({ ...prev, [postId]: true }));
      
      // Clear input immediately for better UX
      setNewComment(prev => ({ ...prev, [postId]: '' }));

      const response = await fetch(`http://localhost:5000/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: commentText })
      });

      if (!response.ok) {
        throw new Error('Failed to add comment');
      }

      const data = await response.json();
      
      // Update posts with new comment
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post._id === postId 
            ? { ...post, comments: [...(post.comments || []), data.comment] }
            : post
        )
      );

      toast.success('Comment added successfully!');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
      // Restore comment on error
      setNewComment(prev => ({ ...prev, [postId]: originalComment }));
    } finally {
      setIsSubmittingComment(prev => ({ ...prev, [postId]: false }));
    }
  };

  const handleSharePost = async (postId) => {
    try {
      const postUrl = `${window.location.origin}/post/${postId}`;
      
      if (navigator.share) {
        await navigator.share({
          title: 'Check out this post',
          text: 'Take a look at this interesting post!',
          url: postUrl
        });
        toast.success('Post shared successfully!');
      } else {
        await navigator.clipboard.writeText(postUrl);
        toast.success('Post link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing post:', error);
      toast.error('Failed to share post');
    }
  };

  const toggleComments = (postId) => {
    setShowComments(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  // Handle image click for full-screen view
  const handlePostImageClick = (image, index, postImages = []) => {
    // Set the selected image for the simple modal
    const imageUrl = image.startsWith('http') ? image : `http://localhost:5000${image}`;
    setSelectedImage(imageUrl);
    setShowImageModal(true);
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
      if (isSaved) {
        await dispatch(removeSavedWorker(workerId)).unwrap();
      } else {
        await dispatch(saveWorker(workerId)).unwrap();
      }
      setIsSaved(!isSaved);
      toast.success(isSaved ? 'Worker removed from favorites' : 'Worker saved to favorites');
    } catch (error) {
      console.error('Error toggling save:', error);
      toast.error('Failed to update favorites');
    }
  };

  const handleBookmarkToggle = async () => {
    try {
      if (isBookmarked) {
        await dispatch(removeSavedWorker(workerId)).unwrap();
      } else {
        await dispatch(saveWorker(workerId)).unwrap();
      }
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header Section */}
      <div className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Button */}
          <div className="mt-8 mb-8">
            <button
              onClick={() => navigate('/search-workers')}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            >
              <FaArrowLeft className="mr-2" />
              Back to Search
            </button>
          </div>
          
          {/* Profile Header Card */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-2xl border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
              {/* Left: Profile Info */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
                {/* Profile Photo */}
                <div className="relative">
                  <div className="w-40 h-40 rounded-full overflow-hidden bg-gradient-to-br from-primary-400 to-primary-600 shadow-2xl ring-4 ring-gray-200 dark:ring-gray-600">
                    {getWorkerProfileImage(worker) ? (
                      <img
                        src={getWorkerProfileImage(worker)}
                        alt={getWorkerName(worker)}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.log('Profile image failed to load:', getWorkerProfileImage(worker));
                          e.target.style.display = 'none';
                          const fallbackDiv = e.target.nextElementSibling;
                          if (fallbackDiv) {
                            fallbackDiv.style.display = 'flex';
                          }
                        }}
                      />
                    ) : null}
                    <div className="w-full h-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center" style={{display: getWorkerProfileImage(worker) ? 'none' : 'flex'}}>
                      <span className="text-white text-4xl font-bold">
                        {getWorkerInitials(worker)}
                      </span>
                    </div>
                  </div>
                  {worker.isVerified && (
                    <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-2 shadow-lg ring-4 ring-white dark:ring-gray-800">
                      <FaCheckCircle className="text-white text-xl" title="Verified Worker" />
                    </div>
                  )}
                  {/* Online Status Indicator */}
                  <div className="absolute top-2 right-2 w-6 h-6 bg-green-400 rounded-full border-4 border-white dark:border-gray-800 shadow-lg"></div>
                </div>
                
                {/* Basic Info */}
                <div className="flex-1 text-center sm:text-left">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white">{getWorkerName(worker)}</h1>
                    {worker.isVerified && (
                      <div className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 px-3 py-1 rounded-full">
                        <FaUserCheck className="text-blue-600 dark:text-blue-400 text-sm" />
                        <span className="text-blue-600 dark:text-blue-400 text-sm font-medium">Verified</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Mobile Number */}
                  {(worker.phone || worker.mobile || worker.mobileNumber || worker.phoneNumber || worker.mobileNo || worker.cellphone) && (
                    <div className="flex items-center justify-center sm:justify-start text-gray-600 dark:text-gray-300 mb-4">
                      <FaPhone className="mr-2 text-green-500" />
                      <span className="text-lg font-medium">
                        {worker.phone || worker.mobile || worker.mobileNumber || worker.phoneNumber || worker.mobileNo || worker.cellphone}
                      </span>
                    </div>
                  )}
                  
                  {/* Profession/Title */}
                  {worker.profession && (
                    <p className="text-xl text-gray-600 dark:text-gray-300 font-medium mb-4">{worker.profession}</p>
                  )}
                  
                  {/* Rating */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <div className="flex items-center gap-1">
                        {renderStars(worker.averageRating || 0, 'text-lg')}
                      </div>
                      <span className="text-xl font-bold text-gray-900 dark:text-white">
                        {worker.averageRating ? worker.averageRating.toFixed(1) : '0.0'}
                      </span>
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                      <span className="text-gray-600 dark:text-gray-300 text-sm">
                        {worker.totalReviews || 0} reviews
                      </span>
                    </div>
                  </div>
                  
                  {/* Location */}
                  <div className="flex items-center justify-center sm:justify-start text-gray-600 dark:text-gray-300 mb-4">
                    <FaMapMarkerAlt className="mr-2 text-primary-500" />
                    <span>{formatLocation(worker.location)}</span>
                  </div>
                  
                  {/* Experience & Rate */}
                  <div className="flex flex-wrap justify-center sm:justify-start gap-4">
                    {worker.experienceYears && (
                      <div className="flex items-center bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                        <FaClock className="mr-2 text-blue-500" />
                        <span className="text-gray-700 dark:text-gray-300 text-sm">{worker.experienceYears} years</span>
                      </div>
                    )}
                    {worker.hourlyRate && (
                      <div className="flex items-center bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                        <FaDollarSign className="mr-2 text-green-500" />
                        <span className="text-gray-700 dark:text-gray-300 text-sm">₹{worker.hourlyRate}/hour</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Right: Action Buttons */}
              <div className="flex flex-col gap-3 min-w-fit">

                <button
                  onClick={() => {
                    const phoneNumber = worker.phone || worker.mobile || worker.mobileNumber || worker.phoneNumber || worker.mobileNo || worker.cellphone;
                    if (phoneNumber) {
                      const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
                      const whatsappUrl = `https://wa.me/91${cleanNumber}?text=Hi, I found your profile on WorkLink and would like to discuss a potential project.`;
                      window.open(whatsappUrl, '_blank');
                    } else {
                      toast.error('Phone number not available');
                    }
                  }}
                  className="text-white px-8 py-4 rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 font-semibold"
                  style={{ backgroundColor: '#15ce9e' }}
                >
                  <FaCommentDots className="text-lg" />
                  <span>Contact</span>
                </button>

                <button
                  onClick={handleReview}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-4 rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 font-semibold"
                >
                  <FaStar className="text-lg" />
                  <span>Leave Review</span>
                </button>
                
                <button
                  onClick={() => {
                    const phoneNumber = worker.phone || worker.mobile || worker.mobileNumber || worker.phoneNumber || worker.mobileNo || worker.cellphone;
                    if (phoneNumber) {
                      const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
                      window.location.href = `tel:+91${cleanNumber}`;
                    } else {
                      toast.error('Phone number not available');
                    }
                  }}
                  className="text-white px-8 py-4 rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 font-semibold"
                  style={{ backgroundColor: '#17d33c' }}
                >
                  <FaPhone className="text-lg" />
                  <span>Call Now</span>
                </button>
                
                {/* Secondary Actions */}
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={handleSaveToggle}
                    className={`p-4 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 ${
                      isSaved
                        ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white'
                        : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                    title={isSaved ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    {isSaved ? <FaHeart className="text-lg" /> : <FaRegHeart className="text-lg" />}
                  </button>
                  
                  <button
                    onClick={handleBookmarkToggle}
                    className={`p-4 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 ${
                      isBookmarked
                        ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white'
                        : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                    title={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
                  >
                    {isBookmarked ? <FaBookmark className="text-lg" /> : <FaRegBookmark className="text-lg" />}
                  </button>
                  
                  <button
                    onClick={handleShare}
                    className="p-4 rounded-2xl bg-white/20 text-white hover:bg-white/30 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                    title="Share profile"
                  >
                    <FaShare className="text-lg" />
                  </button>
                  
                  <button
                    onClick={handleReport}
                    className="p-4 rounded-2xl bg-white/20 text-white hover:bg-white/30 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                    title="Report profile"
                  >
                    <FaFlag className="text-lg" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-2 shadow-xl border border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-2 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 py-4 px-6 rounded-xl font-semibold text-sm whitespace-nowrap transition-all duration-300 transform hover:-translate-y-1 ${
                    activeTab === tab.id
                      ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 shadow-lg'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className="text-lg" />
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
                // Ensure we have the full URL for the image
                const fullImageUrl = image.startsWith('http') ? image : `http://localhost:5000${image}`;
                setSelectedImage(fullImageUrl);
                setShowImageModal(true);
              }}
            />
          )}
          
          {activeTab === 'documents' && (
            <DocumentsTab worker={worker} />
          )}
          
          {activeTab === 'posts' && (
              <PostsTab 
                posts={posts} 
                loading={postsLoading} 
                user={user}
                showComments={showComments}
                newComment={newComment}
                isSubmittingComment={isSubmittingComment}
                handleLikePost={handleLikePost}
                handleAddComment={handleAddComment}
                handleSharePost={handleSharePost}
                toggleComments={toggleComments}
                setNewComment={setNewComment}
                onImageClick={handlePostImageClick}
              />
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
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Write a Review</h3>
              <button
                onClick={() => {
                  setShowReviewModal(false);
                  setReviewRating(0);
                  setReviewComment('');
                }}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100 transition-colors"
              >
                <FaTimes />
              </button>
            </div>
            
            {/* Rating */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                      <FaStar className="text-gray-300 dark:text-gray-600 hover:text-yellow-200 dark:hover:text-yellow-300" />
                    )}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Comment */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Comment
              </label>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                rows={4}
                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500 dark:placeholder-gray-400"
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
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReview}
                disabled={isSubmittingReview || reviewRating === 0 || !reviewComment.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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

      {/* Simple Photo Viewer Modal */}
      {showImageModal && selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div className="relative w-screen h-screen flex items-center justify-center">
            <img
              src={selectedImage}
              alt="Work photo"
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => {
                setShowImageModal(false);
                setSelectedImage(null);
              }}
              className="absolute top-4 right-4 w-12 h-12 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full flex items-center justify-center text-white text-xl transition-all duration-200 z-10"
            >
              <FaTimes />
            </button>
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
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl p-8 border border-white/20">
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
              <FaBriefcase className="text-white text-sm" />
            </div>
            About
          </h3>
          <p className="text-white/90 leading-relaxed text-lg">
            {worker.bio || worker.description || 'No description available.'}
          </p>
        </div>
        
        {/* Skills */}
        {worker.skills && worker.skills.length > 0 && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl p-8 border border-white/20">
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
                <FaUserCheck className="text-white text-sm" />
              </div>
              Skills & Expertise
            </h3>
            <div className="flex flex-wrap gap-3">
              {worker.skills.map((skill, index) => (
                <span
                  key={index}
                  className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white px-4 py-2 rounded-full text-sm font-semibold border border-white/20 backdrop-blur-sm hover:from-blue-500/30 hover:to-purple-500/30 transition-all duration-300"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {/* Work Experience */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Work Experience</h3>
          {worker.workExperience ? (
            Array.isArray(worker.workExperience) ? (
              <div className="space-y-4">
                {worker.workExperience.map((exp, index) => (
                  <div key={index} className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-medium text-gray-900 dark:text-white">{exp.title || exp.position}</h4>
                    <p className="text-gray-600 dark:text-gray-300">{exp.company}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{exp.duration || exp.period}</p>
                    {exp.description && (
                      <p className="text-gray-700 dark:text-gray-300 mt-2">{exp.description}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{worker.workExperience}</p>
            )
          ) : (
            <p className="text-gray-500 dark:text-gray-400">No work experience listed.</p>
          )}
        </div>

        {/* Languages */}
        {worker.languagesSpoken && worker.languagesSpoken.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Languages Spoken</h3>
            <div className="flex flex-wrap gap-2">
              {worker.languagesSpoken.map((language, index) => (
                <span
                  key={index}
                  className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-3 py-1 rounded-full text-sm font-medium border border-green-200 dark:border-green-700"
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
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-primary-400 to-primary-600 rounded-lg flex items-center justify-center">
              <FaEnvelope className="text-white text-sm" />
            </div>
            Contact Information
          </h3>
          <div className="space-y-4">
            {worker.email && (
              <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                  <FaEnvelope className="text-white text-sm" />
                </div>
                <span className="text-gray-900 dark:text-gray-100 font-medium">{worker.email}</span>
              </div>
            )}
            {(worker.phone || worker.mobile || worker.mobileNumber || worker.phoneNumber || worker.mobileNo || worker.cellphone) && (
              <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600">
                <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-green-600 rounded-lg flex items-center justify-center">
                  <FaPhone className="text-white text-sm" />
                </div>
                <span className="text-gray-900 dark:text-gray-100 font-medium">{worker.phone || worker.mobile || worker.mobileNumber || worker.phoneNumber || worker.mobileNo || worker.cellphone}</span>
              </div>
            )}
            {worker.website && (
              <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-purple-600 rounded-lg flex items-center justify-center">
                  <FaGlobe className="text-white text-sm" />
                </div>
                <a 
                  href={worker.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-900 dark:text-gray-100 font-medium hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  {worker.website}
                </a>
              </div>
            )}
          </div>
        </div>
        
        {/* Pricing & Rates */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
              <FaDollarSign className="text-white text-sm" />
            </div>
            Pricing & Rates
          </h3>
          <div className="space-y-4">
            {worker.hourlyRate && (
              <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600">
                <span className="text-gray-600 dark:text-gray-300 font-medium">Hourly Rate</span>
                <span className="font-bold text-gray-900 dark:text-white text-xl">₹{worker.hourlyRate}/hr</span>
              </div>
            )}
            {worker.minimumRate && (
              <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600">
                <span className="text-gray-600 dark:text-gray-300 font-medium">Minimum Rate</span>
                <span className="font-bold text-gray-900 dark:text-white text-xl">₹{worker.minimumRate}</span>
              </div>
            )}
            {worker.projectRate && (
               <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600">
                 <span className="text-gray-600 dark:text-gray-300 font-medium">Project Rate</span>
                 <span className="font-bold text-gray-900 dark:text-white text-xl">₹{worker.projectRate}</span>
               </div>
             )}
           </div>
         </div>
        
        {/* Availability Status */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
              <FaCheckCircle className="text-white text-sm" />
            </div>
            Availability Status
          </h3>
          <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600">
            <div className={`w-4 h-4 rounded-full ${
              worker.availabilityStatus === 'available' ? 'bg-green-500' :
              worker.availabilityStatus === 'busy' ? 'bg-yellow-500' :
              worker.availabilityStatus === 'unavailable' ? 'bg-red-500' :
              'bg-gray-500'
            }`}></div>
            <span className="text-gray-900 dark:text-white font-medium capitalize">
              {worker.availabilityStatus || 'Not specified'}
            </span>
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
      <div className="text-center py-16">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-12 border border-white/20 max-w-md mx-auto">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-400 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <FaCamera className="text-white text-3xl" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-4">No Work Photos</h3>
          <p className="text-white/80 text-lg">This worker hasn't uploaded any work photos yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl p-8 border border-white/20">
      <h3 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-r from-pink-400 to-purple-500 rounded-lg flex items-center justify-center">
          <FaCamera className="text-white text-sm" />
        </div>
        Work Photos ({worker.workPhotos.length})
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {worker.workPhotos.map((photo, index) => (
          <div 
            key={index} 
            className="relative group cursor-pointer overflow-hidden rounded-2xl bg-white/5 aspect-square border border-white/20 hover:border-white/40 transition-all duration-500 transform hover:-translate-y-2 hover:shadow-2xl"
            onClick={() => onImageClick(photo)}
          >
            <img
              src={photo}
              alt={`Work photo ${index + 1}`}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              onError={(e) => {
                e.target.src = '/api/placeholder/300/300';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30">
                <FaEye className="text-white text-xl" />
              </div>
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
      <div className="text-center py-16">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-12 border border-white/20 max-w-md mx-auto">
          <div className="w-20 h-20 bg-gradient-to-r from-orange-400 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <FaFileAlt className="text-white text-3xl" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-4">No Documents Available</h3>
          <p className="text-white/80 text-lg">This worker hasn't uploaded any documents or certificates yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Documents */}
      {documents.length > 0 && (
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl p-8 border border-white/20">
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
              <FaFileAlt className="text-white text-sm" />
            </div>
            Documents & ID Proof
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {documents.map((doc, index) => {
              const filename = doc.split('/').pop();
              return (
                <div key={index} className="flex items-center p-6 bg-white/5 border border-white/20 rounded-2xl hover:bg-white/10 hover:border-white/30 transition-all duration-300 transform hover:-translate-y-1">
                  <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/20 mr-4">
                    {getFileIcon(filename)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-bold text-white truncate">{filename}</p>
                    <p className="text-white/70 font-medium">Document</p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => window.open(doc, '_blank')}
                      className="w-10 h-10 bg-blue-500/20 hover:bg-blue-500/30 rounded-xl flex items-center justify-center border border-blue-400/30 hover:border-blue-400/50 transition-all duration-300"
                      title="View"
                    >
                      <FaEye className="text-blue-400" />
                    </button>
                    <button
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = doc;
                        link.download = filename;
                        link.click();
                      }}
                      className="w-10 h-10 bg-green-500/20 hover:bg-green-500/30 rounded-xl flex items-center justify-center border border-green-400/30 hover:border-green-400/50 transition-all duration-300"
                      title="Download"
                    >
                      <FaDownload className="text-green-400" />
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
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl p-8 border border-white/20">
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
              <FaCertificate className="text-white text-sm" />
            </div>
            Certificates & Qualifications
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {certificates.map((cert, index) => {
              const filename = cert.split('/').pop();
              return (
                <div key={index} className="flex items-center p-6 bg-white/5 border border-white/20 rounded-2xl hover:bg-white/10 hover:border-white/30 transition-all duration-300 transform hover:-translate-y-1">
                  <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/20 mr-4">
                    {getFileIcon(filename)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-bold text-white truncate">{filename}</p>
                    <p className="text-white/70 font-medium">Certificate</p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => window.open(cert, '_blank')}
                      className="w-10 h-10 bg-blue-500/20 hover:bg-blue-500/30 rounded-xl flex items-center justify-center border border-blue-400/30 hover:border-blue-400/50 transition-all duration-300"
                      title="View"
                    >
                      <FaEye className="text-blue-400" />
                    </button>
                    <button
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = cert;
                        link.download = filename;
                        link.click();
                      }}
                      className="w-10 h-10 bg-green-500/20 hover:bg-green-500/30 rounded-xl flex items-center justify-center border border-green-400/30 hover:border-green-400/50 transition-all duration-300"
                      title="Download"
                    >
                      <FaDownload className="text-green-400" />
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
const PostsTab = ({ posts, loading, user, showComments, newComment, isSubmittingComment, handleLikePost, handleAddComment, handleSharePost, toggleComments, setNewComment, onImageClick }) => {
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
        <div key={post._id || index} className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0">
              {post.author?.profilePhoto ? (
                <img
                  src={post.author.profilePhoto.startsWith('http') 
                    ? post.author.profilePhoto 
                    : `http://localhost:5000${post.author.profilePhoto}`}
                  alt={post.author.fullName || post.authorName}
                  className="w-full h-full rounded-full object-cover"
                  onError={(e) => {
                    e.target.src = '/default-avatar.png';
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">
                    {(post.author?.fullName || post.authorName)?.charAt(0)?.toUpperCase() || 'W'}
                  </span>
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-medium text-gray-900">{post.author?.fullName || post.authorName}</h4>
                <span className="text-gray-500 text-sm">•</span>
                <span className="text-gray-500 text-sm">
                  {new Date(post.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              
              <div className="mb-4">
                <p className="text-gray-700 mb-4 leading-relaxed">{post.content}</p>
                
                {post.images && post.images.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {post.images.map((image, imgIndex) => (
                      <img
                        key={imgIndex}
                        src={image.startsWith('http') ? image : `http://localhost:5000${image}`}
                        alt={`Post image ${imgIndex + 1}`}
                        className="w-full h-48 object-cover rounded-lg border cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => onImageClick && onImageClick(image, imgIndex, post.images)}
                      />
                    ))}
                  </div>
                )}
                
                {post.image && (
                  <div className="mb-4">
                    <img
                      src={post.image.startsWith('http') ? post.image : `http://localhost:5000${post.image}`}
                      alt="Post image"
                      className="rounded-lg max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => onImageClick && onImageClick(post.image, 0, [post.image])}
                    />
                  </div>
                )}
              </div>
              
              {/* Post Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center space-x-6">
                  {/* Like Button */}
                  <button
                    onClick={() => handleLikePost(post._id)}
                    className="flex items-center text-sm text-gray-500 hover:text-red-500 transition-all duration-200 transform hover:scale-105"
                  >
                    {user && Array.isArray(post.likes) && post.likes.includes(user.userId || user.id) ? (
                      <HeartIconSolid className="h-5 w-5 mr-1 text-red-500 animate-pulse" />
                    ) : (
                      <HeartIcon className="h-5 w-5 mr-1" />
                    )}
                    {Array.isArray(post.likes) ? post.likes.length : (post.likes || 0)} likes
                  </button>
                  
                  {/* Comment Button */}
                  <button
                    onClick={() => toggleComments(post._id)}
                    className="flex items-center text-sm text-gray-500 hover:text-blue-500 transition-all duration-200 transform hover:scale-105"
                  >
                    <svg className="h-5 w-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    {post.comments?.length || 0} comments
                  </button>
                  
                  {/* Share Button */}
                  <button
                    onClick={() => handleSharePost(post._id)}
                    className="flex items-center text-sm text-gray-500 hover:text-green-500 transition-all duration-200 transform hover:scale-105"
                  >
                    <svg className="h-5 w-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                    </svg>
                    Share
                  </button>
                </div>
                <div className="text-xs text-gray-400">
                  {post.location && `📍 ${post.location}`}
                </div>
              </div>
              
              {/* Comments Section */}
              {showComments[post._id] && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  {/* Add Comment Form */}
                  <div className="flex items-start space-x-3 mb-4">
                    <img
                      src={user?.profilePhoto 
                        ? (user.profilePhoto.startsWith('http') 
                            ? user.profilePhoto 
                            : `http://localhost:5000${user.profilePhoto}`)
                        : '/default-avatar.png'
                      }
                      alt="Your profile"
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <textarea
                        value={newComment[post._id] || ''}
                        onChange={(e) => setNewComment(prev => ({ ...prev, [post._id]: e.target.value }))}
                        placeholder="Write a comment..."
                        className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows="2"
                      />
                      <div className="flex justify-end mt-2">
                        <button
                          onClick={() => handleAddComment(post._id)}
                          disabled={isSubmittingComment[post._id] || !newComment[post._id]?.trim()}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                        >
                          {isSubmittingComment[post._id] ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Posting...
                            </>
                          ) : (
                            'Post Comment'
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Comments List */}
                  <div className="space-y-3">
                    {post.comments && post.comments.length > 0 ? (
                      post.comments.map((comment, commentIndex) => (
                        <div key={commentIndex} className="flex items-start space-x-3">
                          <img
                            src={comment.author?.profilePhoto 
                              ? (comment.author.profilePhoto.startsWith('http') 
                                  ? comment.author.profilePhoto 
                                  : `http://localhost:5000${comment.author.profilePhoto}`)
                              : '/default-avatar.png'
                            }
                            alt={comment.author?.fullName || 'User'}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <div className="flex-1 bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-sm text-gray-900">
                                {comment.author?.fullName || 'Anonymous User'}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(comment.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700">{comment.content}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-4">
                        No comments yet. Be the first to comment!
                      </p>
                    )}
                  </div>
                </div>
              )}
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
      stars.push(<FaStar key={`empty-${i}`} className="text-gray-300 dark:text-gray-600" />);
    }
    
    return stars;
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
        <LoadingSpinner size="lg" />
        <p className="text-gray-500 dark:text-gray-400 mt-4">Loading reviews...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Reviews Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Reviews ({totalReviews})
          </h3>
          <button
            onClick={onWriteReview}
            className="bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
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
            <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                  {(review.reviewerPhoto || review.reviewerProfilePicture) ? (
                    <img
                      src={
                        review.reviewerPhoto || review.reviewerProfilePicture
                          ? (review.reviewerPhoto || review.reviewerProfilePicture).startsWith('http')
                            ? (review.reviewerPhoto || review.reviewerProfilePicture)
                            : `http://localhost:5000${review.reviewerPhoto || review.reviewerProfilePicture}`
                          : null
                      }
                      alt={review.reviewerName}
                      className="w-full h-full rounded-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
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
                    <h4 className="font-medium text-gray-900 dark:text-white">{review.reviewerName}</h4>
                    <span className="text-gray-500 dark:text-gray-400 text-sm">•</span>
                    <span className="text-gray-500 dark:text-gray-400 text-sm">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex">
                      {renderStars(review.rating)}
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {review.rating.toFixed(1)}
                    </span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300">{review.comment}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
          <FaStar className="mx-auto text-gray-400 dark:text-gray-500 text-4xl mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Reviews Yet</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">Be the first to review this worker!</p>
          <button
            onClick={onWriteReview}
            className="bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-800 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Write First Review
          </button>
        </div>
      )}
    </div>
  );
};

export default WorkerProfile;