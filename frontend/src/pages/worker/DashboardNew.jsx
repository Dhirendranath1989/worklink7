import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  BriefcaseIcon,
  CurrencyDollarIcon,
  ClockIcon,
  UserGroupIcon,
  ChartBarIcon,
  PlusIcon,
  EyeIcon,
  CameraIcon,
  DocumentIcon,
  CalendarIcon,
  ChatBubbleLeftRightIcon,
  BellIcon,
  CogIcon,
  MapPinIcon,
  CheckBadgeIcon,
  PhotoIcon,
  AcademicCapIcon,
  LanguageIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
  FlagIcon,
  PhoneIcon,
  PencilIcon,
  TrashIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  HeartIcon,
  ShareIcon,
  ChatBubbleLeftIcon,
  GlobeAltIcon,
  BuildingOfficeIcon,
  UserCircleIcon,
  UserIcon,
  ChevronRightIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { fetchProfile, fetchEarnings } from '../../features/profiles/profilesSlice';
import { setCredentials } from '../../features/auth/authSlice';
import { toast } from 'react-hot-toast';
import EditProfile from '../../components/EditProfile';
import SearchWorkers from '../../components/SearchWorkers';
import { CreatePostModal, PostCard } from '../../components/Post';
import { reviewAPI } from '../../services/api';

const FacebookLikeDashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { viewedProfile: profile, earnings, loading } = useSelector((state) => state.profiles);
  
  // State management
  const [activeTab, setActiveTab] = useState('feed');

  const [posts, setPosts] = useState([]);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profilePhotoFile, setProfilePhotoFile] = useState(null);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showSearchWorkers, setShowSearchWorkers] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [showReviewDetails, setShowReviewDetails] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);

  // Fetch posts from backend
  const fetchPosts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/posts', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts || []);
      } else {
        console.error('Failed to fetch posts');
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  // Fetch reviews from backend with enhanced error handling
  const fetchReviews = useCallback(async () => {
    try {
      setReviewsLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login to view reviews');
        return;
      }
      
      const response = await reviewAPI.getReceivedReviews();
      if (response && response.data && response.data.reviews) {
        setReviews(response.data.reviews);
        console.log('Reviews fetched successfully:', response.data.reviews.length);
      } else {
        setReviews([]);
        console.log('No reviews found or invalid response structure');
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
      } else if (error.response?.status === 404) {
        setReviews([]);
      } else {
        toast.error('Failed to load reviews. Please try again.');
      }
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?._id) {
      dispatch(fetchProfile(user._id));
      dispatch(fetchEarnings());
    }
    fetchPosts();
    fetchReviews();
  }, [dispatch, user]);

  // Separate useEffect for real-time review updates
  useEffect(() => {
    if (!user?._id) return;
    
    // Set up real-time updates for reviews every 10 seconds for better responsiveness
    const reviewsInterval = setInterval(() => {
      if (!reviewsLoading) {
        console.log('Auto-refreshing reviews...');
        fetchReviews();
      }
    }, 10000);
    
    return () => {
      clearInterval(reviewsInterval);
    };
  }, [user?._id, reviewsLoading, fetchReviews]);

  // Handle review click to show details
  const handleReviewClick = (review) => {
    setSelectedReview(review);
    setShowReviewDetails(true);
  };

  // Debug logging
  console.log('DashboardNew - User data:', user);
  console.log('DashboardNew - ProfilePhoto:', user?.profilePhoto);
  console.log('DashboardNew - Profile data:', profile);

  // Get user profile data
  const userProfile = {
    name: user?.fullName || (user?.firstName && user?.lastName ? `${String(user.firstName)} ${String(user.lastName)}` : (user?.firstName ? String(user.firstName) : (user?.lastName ? String(user.lastName) : 'User'))),
    profilePhoto: user?.profilePhoto ? 
      (user.profilePhoto.startsWith('http') ? user.profilePhoto : `http://localhost:5000${user.profilePhoto}`) : 
      'https://via.placeholder.com/150x150/cccccc/666666?text=No+Photo',
    email: String(user?.email || ''),
    mobile: String(user?.phoneNumber || user?.mobile || 'Not provided'),
    address: String(user?.address || 'Not specified'),
    pincode: String(user?.pincode || 'Not specified'),
    location: String(user?.address || 'Not specified'),
    bio: String(user?.bio || user?.description || 'No bio available'),
    description: String(user?.description || user?.bio || 'No description available'),
    skills: Array.isArray(user?.skills) ? user.skills : [],
    languagesSpoken: Array.isArray(user?.languagesSpoken) ? user.languagesSpoken : [],
    workExperience: String(user?.workExperience || 'Not specified'),
    rating: Number(user?.rating) || 0,
    totalReviews: Number(user?.totalReviews) || 0,
    completedJobs: Number(user?.completedJobs) || 0,
    memberSince: user?.createdAt || new Date().toISOString(),
    hourlyRate: Number(user?.hourlyRate) || 0,
    workPhotos: Array.isArray(user?.workPhotos) ? user.workPhotos : [],
    certificates: Array.isArray(user?.certificates) ? user.certificates : [],
    availabilityStatus: String(user?.availabilityStatus || 'Not specified'),
    businessName: String(user?.businessName || ''),
    businessType: String(user?.businessType || '')
  };

  // Handle profile photo upload
  const handleProfilePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePhotoFile(file);
      
      // Create FormData for upload
      const formData = new FormData();
      formData.append('profilePhoto', file);
      
      try {
        const response = await fetch('http://localhost:5000/api/auth/complete-profile', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: formData
        });
        
        if (response.ok) {
          const result = await response.json();
          // Update user data in Redux and localStorage
          const updatedUser = { ...user, ...result.user };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          dispatch(setCredentials({ user: updatedUser, token: localStorage.getItem('token') }));
          toast.success('Profile photo updated successfully!');
        } else {
          toast.error('Failed to update profile photo');
        }
      } catch (error) {
        console.error('Profile photo upload error:', error);
        toast.error('Failed to update profile photo');
      }
    }
  };

  // Handle post creation from CreatePostModal
  const handlePostCreated = (newPost) => {
    // Add the new post to the beginning of the posts array
    setPosts(prevPosts => [newPost, ...prevPosts]);
    toast.success('Post created successfully!');
  };

  // Handle post editing
  const handleEditPost = (post) => {
    setEditingPost(post);
  };

  // Handle post deletion
  const handleDeletePost = async (postId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        setPosts(prevPosts => prevPosts.filter(post => post._id !== postId));
        toast.success('Post deleted successfully!');
      } else {
        toast.error('Failed to delete post');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Error deleting post');
    }
  };

  // Handle post like
  const handleLikePost = async (postId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPosts(prevPosts => 
          prevPosts.map(post => 
            post._id === postId 
              ? { ...post, likes: data.isLiked 
                  ? [...(post.likes || []), user.userId] 
                  : (post.likes || []).filter(id => id !== user.userId) }
              : post
          )
        );
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  // Handle like/unlike


  // Handle image preview
  const handleImagePreview = (imageUrl) => {
    setPreviewImage(imageUrl);
    setShowImagePreview(true);
  };

  // Stats data
  const stats = [
    {
      title: 'Completed Jobs',
      value: userProfile.completedJobs,
      icon: BriefcaseIcon,
      color: 'bg-blue-500',
      change: '+12%'
    },
    {
      title: 'Total Earnings',
      value: `$${earnings?.total || 0}`,
      icon: CurrencyDollarIcon,
      color: 'bg-green-500',
      change: '+8%'
    },

    {
      title: 'Active Projects',
      value: '3',
      icon: ClockIcon,
      color: 'bg-purple-500',
      change: '+1'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 pt-16">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <img
                src={userProfile.profilePhoto}
                alt="Profile"
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Welcome back, {userProfile.name.split(' ')[0]}!
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Ready to take on new projects?</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setShowEditProfile(true)}
                className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Edit Profile"
              >
                <UserIcon className="h-6 w-6" />
              </button>
              <button 
                onClick={() => setShowCreatePost(true)}
                className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Create Post"
              >
                <PlusIcon className="h-6 w-6" />
              </button>

            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Enhanced Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6 mb-6">
              <div className="text-center">
                <div className="relative inline-block">
                  <img
                    src={userProfile.profilePhoto}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover mx-auto"
                  />
                  <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 cursor-pointer">
                    <CameraIcon className="h-4 w-4" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePhotoChange}
                      className="hidden"
                    />
                  </label>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">{userProfile.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{userProfile.location}</p>

              </div>
              
              {/* Basic Information */}
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Email</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white truncate ml-2">{userProfile.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Mobile</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{userProfile.mobile}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Address</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white truncate ml-2">{userProfile.address}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Pincode</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{userProfile.pincode}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Completed Jobs</span>
                  <span className="text-sm font-semibold">{userProfile.completedJobs}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Hourly Rate</span>
                  <span className="text-sm font-semibold">₹{userProfile.hourlyRate}/hr</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Member Since</span>
                  <span className="text-sm font-semibold">
                    {new Date(userProfile.memberSince).getFullYear()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Work Experience</span>
                  <span className="text-sm font-medium">{userProfile.workExperience}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Availability Status</span>
                  <span className={`text-sm font-medium capitalize ${
                    userProfile.availabilityStatus === 'available' || userProfile.availabilityStatus === 'online' ? 'text-green-600' :
                    userProfile.availabilityStatus === 'busy' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {userProfile.availabilityStatus}
                  </span>
                </div>
                {/* Business Information for Owners */}
                {userProfile.businessName && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Business Name</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white truncate ml-2">{userProfile.businessName}</span>
                  </div>
                )}
                {userProfile.businessType && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Business Type</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{userProfile.businessType}</span>
                  </div>
                )}
              </div>
              
              {/* Bio/Description */}
              {userProfile.description && userProfile.description !== 'No description available' && (
                <div className="mt-6">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">About Me</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{userProfile.description}</p>
                </div>
              )}
              
              {/* Skills */}
              <div className="mt-6">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Skills</h4>
                <div className="flex flex-wrap gap-1">
                  {userProfile.skills.slice(0, 6).map((skill, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                  {userProfile.skills.length > 6 && (
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-full">
                      +{userProfile.skills.length - 6} more
                    </span>
                  )}
                </div>
              </div>

              {/* Languages */}
              {userProfile.languagesSpoken && userProfile.languagesSpoken.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Languages Spoken</h4>
                  <div className="flex flex-wrap gap-1">
                    {userProfile.languagesSpoken.map((language, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                      >
                        {language}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Work Photos */}
              {userProfile.workPhotos && userProfile.workPhotos.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Work Portfolio</h4>
                    <Link 
                      to="/worker/portfolio"
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center"
                    >
                      View All
                      <ChevronRightIcon className="h-3 w-3 ml-1" />
                    </Link>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {userProfile.workPhotos
                      .filter(photo => {
                        if (typeof photo === 'string') return true;
                        if (typeof photo === 'object' && photo.path) return true;
                        return false;
                      })
                      .slice(0, 4)
                      .map((photo, index) => {
                        const photoSrc = typeof photo === 'string' 
                          ? (photo.startsWith('http') ? photo : `http://localhost:5000${photo}`)
                          : (photo.path.startsWith('http') ? photo.path : `http://localhost:5000${photo.path}`);
                        return (
                          <img
                            key={index}
                            src={photoSrc}
                            alt={`Work ${index + 1}`}
                            className="w-full h-20 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => handleImagePreview(photoSrc)}
                          />
                        );
                      })}
                  </div>
                  {userProfile.workPhotos.filter(photo => {
                    if (typeof photo === 'string') return true;
                    if (typeof photo === 'object' && photo.path) return true;
                    return false;
                  }).length > 4 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                      +{userProfile.workPhotos.filter(photo => {
                        if (typeof photo === 'string') return true;
                        if (typeof photo === 'object' && photo.path) return true;
                        return false;
                      }).length - 4} more photos
                    </p>
                  )}
                </div>
              )}

              {/* Certificates */}
              {userProfile.certificates && userProfile.certificates.length > 0 && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Certificates</h4>
                    <Link 
                      to="/worker/certificates"
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center"
                    >
                      View All
                      <ChevronRightIcon className="h-3 w-3 ml-1" />
                    </Link>
                  </div>
                  <div className="space-y-2">
                    {userProfile.certificates
                      .filter(cert => {
                        if (typeof cert === 'string') return true;
                        if (typeof cert === 'object' && (cert.path || cert.originalName)) return true;
                        return false;
                      })
                      .slice(0, 3)
                      .map((cert, index) => {
                        const certName = typeof cert === 'string' 
                          ? cert.split('/').pop()
                          : (cert.originalName || cert.path?.split('/').pop() || 'Certificate');
                        const certUrl = typeof cert === 'string'
                          ? (cert.startsWith('http') ? cert : `http://localhost:5000${cert}`)
                          : (cert.path ? (cert.path.startsWith('http') ? cert.path : `http://localhost:5000${cert.path}`) : '#');
                        return (
                          <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                            <AcademicCapIcon className="h-4 w-4 text-blue-600" />
                            <a
                              href={certUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:text-blue-800 truncate"
                            >
                              {certName}
                            </a>
                          </div>
                        );
                      })}
                  </div>
                  {userProfile.certificates.filter(cert => {
                    if (typeof cert === 'string') return true;
                    if (typeof cert === 'object' && (cert.path || cert.originalName)) return true;
                    return false;
                  }).length > 3 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                      +{userProfile.certificates.filter(cert => {
                        if (typeof cert === 'string') return true;
                        if (typeof cert === 'object' && (cert.path || cert.originalName)) return true;
                        return false;
                      }).length - 3} more certificates
                    </p>
                  )}
                </div>
              )}

              {/* Edit Profile Button */}
              <div className="mt-6 pt-4 border-t">
                <button
                  onClick={() => setShowEditProfile(true)}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <PencilIcon className="h-4 w-4" />
                  <span>Edit Profile</span>
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Create Post */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6 mb-6">
              <div className="flex items-center space-x-4">
                <img
                  src={userProfile.profilePhoto}
                  alt="Profile"
                  className="w-10 h-10 rounded-full object-cover"
                />
                <button
                  onClick={() => setShowCreatePost(true)}
                  className="flex-1 text-left px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  What's on your mind, {userProfile.name.split(' ')[0]}?
                </button>
              </div>
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <button
                  onClick={() => setShowCreatePost(true)}
                  className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <PhotoIcon className="h-5 w-5" />
                  <span>Photo</span>
                </button>
                <button
                  onClick={() => setShowCreatePost(true)}
                  className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <DocumentIcon className="h-5 w-5" />
                  <span>Project</span>
                </button>
                <button
                  onClick={() => setShowCreatePost(true)}
                  className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <CalendarIcon className="h-5 w-5" />
                  <span>Event</span>
                </button>
              </div>
            </div>

            {/* Posts Feed */}
            <div className="space-y-6">
              {posts.map((post) => (
                <PostCard
                  key={post._id}
                  post={post}
                  onEdit={handleEditPost}
                  onDelete={handleDeletePost}
                  onLike={handleLikePost}
                  currentUserId={user?.userId}
                />
              ))}
              {posts.length === 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-8 text-center">
                  <p className="text-gray-500 dark:text-gray-400">No posts yet. Create your first post to get started!</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar - Reviews Section */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl shadow-lg border-2 border-blue-200 dark:border-blue-700 p-6 sticky top-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                  <StarIcon className="h-6 w-6 text-yellow-500 mr-2" />
                  My Reviews
                </h2>
                <button
                  onClick={() => setActiveTab('reviews')}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium"
                >
                  View All
                </button>
              </div>
              
              {/* Reviews Summary Cards */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4 text-center shadow-sm border border-blue-200 dark:border-blue-700">
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                    {reviewsLoading ? (
                      <div className="animate-pulse bg-blue-300 dark:bg-blue-600 h-8 w-12 mx-auto rounded"></div>
                    ) : (
                      reviews.length
                    )}
                  </div>
                  <div className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Reviews</div>
                </div>
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-lg p-4 text-center shadow-sm border border-yellow-200 dark:border-yellow-700">
                  <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 flex items-center justify-center mb-1">
                    {reviewsLoading ? (
                      <div className="animate-pulse bg-yellow-300 dark:bg-yellow-600 h-8 w-16 mx-auto rounded"></div>
                    ) : (
                      <>
                        {reviews.length > 0 ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1) : '0.0'}
                        <StarIcon className="h-6 w-6 ml-1 fill-current" />
                      </>
                    )}
                  </div>
                  <div className="text-sm font-medium text-yellow-700 dark:text-yellow-300">Average Rating</div>
                </div>
              </div>
              
              {/* Recent Reviews */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 dark:text-white flex items-center">
                    <StarIcon className="h-5 w-5 text-yellow-500 mr-2" />
                    Recent Reviews
                  </h3>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={fetchReviews}
                      disabled={reviewsLoading}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-full transition-colors"
                      title="Refresh reviews"
                    >
                      <svg className={`h-3 w-3 ${reviewsLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Refresh</span>
                    </button>
                    {reviews.length > 3 && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                        +{reviews.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
                {reviewsLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="flex items-start space-x-3">
                          <div className="animate-pulse bg-gray-300 dark:bg-gray-600 w-10 h-10 rounded-full"></div>
                          <div className="flex-1 space-y-2">
                            <div className="animate-pulse bg-gray-300 dark:bg-gray-600 h-4 w-3/4 rounded"></div>
                            <div className="animate-pulse bg-gray-300 dark:bg-gray-600 h-3 w-full rounded"></div>
                            <div className="animate-pulse bg-gray-300 dark:bg-gray-600 h-3 w-1/2 rounded"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : reviews.length > 0 ? (
                  <div className="space-y-3">
                    {reviews.slice(0, 3).map((review, index) => (
                      <div 
                        key={review._id || index} 
                        className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750"
                        onClick={() => handleReviewClick(review)}
                      >
                        <div className="flex items-start space-x-3">
                          <img
                            src={
                              review.reviewerProfilePicture
                                ? (review.reviewerProfilePicture.startsWith('http')
                                  ? review.reviewerProfilePicture
                                  : `http://localhost:5000${review.reviewerProfilePicture}`)
                                : review.reviewerAvatar || review.reviewer?.profilePhoto || 'https://via.placeholder.com/40x40/cccccc/666666?text=U'
                            }
                            alt={review.reviewerName || review.reviewer?.fullName || 'Reviewer'}
                            className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/40x40/cccccc/666666?text=U';
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {review.reviewerName || review.reviewer?.fullName || 'Anonymous'}
                              </p>
                              <div className="flex items-center space-x-1">
                                {[...Array(5)].map((_, i) => (
                                  <StarIcon
                                    key={i}
                                    className={`h-4 w-4 ${
                                      i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300 dark:text-gray-600'
                                    }`}
                                  />
                                ))}
                                <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                                  {review.rating}/5
                                </span>
                              </div>
                            </div>
                            {review.comment && (
                              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">
                                "{review.comment}"
                              </p>
                            )}
                            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                              <span>
                                {new Date(review.createdAt).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </span>
                              {review.jobTitle && (
                                <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">
                                  {review.jobTitle}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg p-8 text-center shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <StarIcon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                    </div>
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No reviews yet</h4>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
                      Complete your first job to receive reviews from clients
                    </p>
                    <div className="flex items-center justify-center space-x-2 text-xs text-gray-400 dark:text-gray-500">
                      <CheckBadgeIcon className="h-4 w-4" />
                      <span>Build your reputation</span>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="mt-6 space-y-3">
                {/* Call to Action for no reviews */}
                {reviews.length === 0 && !reviewsLoading && (
                  <div className="text-center">
                    <button
                      onClick={() => {
                        setActiveTab('jobs');
                        toast.success('Redirecting to find jobs...');
                      }}
                      className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 flex items-center justify-center space-x-2 mx-auto"
                    >
                      <BriefcaseIcon className="h-4 w-4" />
                      <span>Find Your First Job</span>
                    </button>
                  </div>
                )}
                
                {/* Action buttons row */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={fetchReviews}
                    disabled={reviewsLoading}
                    className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium disabled:opacity-50 transition-colors duration-200"
                  >
                    <ArrowUpIcon className={`h-4 w-4 ${reviewsLoading ? 'animate-spin' : ''}`} />
                    <span>{reviewsLoading ? 'Refreshing...' : 'Refresh'}</span>
                  </button>
                  
                  {reviews.length > 0 && (
                    <div className="flex items-center space-x-4">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Last updated: {new Date().toLocaleTimeString()}
                      </span>
                      <button
                        onClick={() => setActiveTab('reviews')}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium transition-colors duration-200"
                      >
                        View All →
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>



      {/* Image Preview Modal */}
      {showImagePreview && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <div className="relative max-w-4xl max-h-[90vh]">
            <button
              onClick={() => setShowImagePreview(false)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
            >
              <XMarkIcon className="h-8 w-8" />
            </button>
            <img
              src={previewImage}
              alt="Preview"
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <EditProfile
          isOpen={showEditProfile}
          onClose={() => setShowEditProfile(false)}
          userType={user?.userType || 'worker'}
          currentProfile={profile}
        />
      )}

      {/* Search Workers Modal */}
      {showSearchWorkers && (
        <SearchWorkers
          isOpen={showSearchWorkers}
          onClose={() => setShowSearchWorkers(false)}
        />
      )}

      {/* Create/Edit Post Modal */}
        {(showCreatePost || editingPost) && (
          <CreatePostModal
            isOpen={showCreatePost || !!editingPost}
            onClose={() => {
              setShowCreatePost(false);
              setEditingPost(null);
            }}
            editPost={editingPost}
            onPostCreated={(postData) => {
              handlePostCreated(postData);
              setShowCreatePost(false);
              setEditingPost(null);
            }}
          />
        )}

      {/* Review Details Modal */}
      {showReviewDetails && selectedReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Review Details
              </h3>
              <button
                onClick={() => setShowReviewDetails(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Reviewer Info */}
              <div className="flex items-center space-x-4 mb-6">
                <img
                   src={
                     selectedReview.reviewerProfilePicture
                       ? (selectedReview.reviewerProfilePicture.startsWith('http')
                         ? selectedReview.reviewerProfilePicture
                         : `http://localhost:5000${selectedReview.reviewerProfilePicture}`)
                       : selectedReview.reviewerAvatar || selectedReview.reviewer?.profilePhoto || 'https://via.placeholder.com/80x80/cccccc/666666?text=U'
                   }
                   alt={selectedReview.reviewerName || selectedReview.reviewer?.fullName || 'Reviewer'}
                   className="w-16 h-16 rounded-full object-cover border-4 border-gray-200 dark:border-gray-600"
                   onError={(e) => {
                     e.target.src = 'https://via.placeholder.com/80x80/cccccc/666666?text=U';
                   }}
                 />
                <div className="flex-1">
                  <h4 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {selectedReview.reviewerName || selectedReview.reviewer?.fullName || 'Anonymous'}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    {selectedReview.reviewer?.email || 'Email not available'}
                  </p>
                  {selectedReview.reviewer?.location && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center mt-1">
                      <MapPinIcon className="h-4 w-4 mr-1" />
                      {selectedReview.reviewer.location}
                    </p>
                  )}
                </div>
              </div>

              {/* Rating */}
              <div className="mb-6">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Rating:</span>
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon
                        key={i}
                        className={`h-5 w-5 ${
                          i < selectedReview.rating ? 'text-yellow-400 fill-current' : 'text-gray-300 dark:text-gray-600'
                        }`}
                      />
                    ))}
                    <span className="text-lg font-semibold text-gray-900 dark:text-white ml-2">
                      {selectedReview.rating}/5
                    </span>
                  </div>
                </div>
              </div>

              {/* Review Comment */}
              {selectedReview.comment && (
                <div className="mb-6">
                  <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Review:</h5>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <p className="text-gray-800 dark:text-gray-200 leading-relaxed">
                      "{selectedReview.comment}"
                    </p>
                  </div>
                </div>
              )}

              {/* Review Date and Job */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Review Date:</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {new Date(selectedReview.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                {selectedReview.jobTitle && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Job:</span>
                    <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-xs font-medium">
                      {selectedReview.jobTitle}
                    </span>
                  </div>
                )}
              </div>

              {/* Additional Reviewer Info */}
              {selectedReview.reviewer && (
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Reviewer Information:</h5>
                  <div className="space-y-2 text-sm">
                    {selectedReview.reviewer.phoneNumber && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Phone:</span>
                        <span className="text-gray-900 dark:text-white">{selectedReview.reviewer.phoneNumber}</span>
                      </div>
                    )}
                    {selectedReview.reviewer.address && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Address:</span>
                        <span className="text-gray-900 dark:text-white text-right">{selectedReview.reviewer.address}</span>
                      </div>
                    )}
                    {selectedReview.reviewer.userType && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">User Type:</span>
                        <span className="text-gray-900 dark:text-white capitalize">{selectedReview.reviewer.userType}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowReviewDetails(false)}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacebookLikeDashboard;