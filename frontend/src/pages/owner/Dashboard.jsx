import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';

import {
  BriefcaseIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ClockIcon,
  PlusIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  CameraIcon,
  PencilIcon,
  BookmarkIcon,

  MagnifyingGlassIcon,
  BellIcon,
  Cog6ToothIcon,
  HeartIcon,
  CalendarIcon,
  DocumentTextIcon,
  UserIcon,
  HomeIcon,
  ChartBarIcon,
  CogIcon,
  DocumentPlusIcon
} from '@heroicons/react/24/outline';
import {
  HeartIcon as HeartIconSolid,
  BookmarkIcon as BookmarkIconSolid
} from '@heroicons/react/24/solid';
import { fetchJobs } from '../../features/jobs/jobsSlice';

import { fetchSavedWorkers } from '../../features/savedWorkers/savedWorkersSlice';
import { setCredentials } from '../../features/auth/authSlice';
import { toast } from 'react-hot-toast';
import EditProfile from '../../components/EditProfile';

import { CreatePostModal, PostCard } from '../../components/Post';


// Default avatar constants
const DEFAULT_AVATAR_128 = "data:image/svg+xml,%3Csvg width='128' height='128' viewBox='0 0 128 128' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='128' height='128' fill='%23CCCCCC' rx='64'/%3E%3Cpath d='M64 42.67c7.04 0 12.8 5.76 12.8 12.8s-5.76 12.8-12.8 12.8-12.8-5.76-12.8-12.8 5.76-12.8 12.8-12.8zm0 59.73c-14.08 0-25.6-7.25-25.6-17.07 0-9.81 11.52-17.06 25.6-17.06s25.6 7.25 25.6 17.06c0 9.82-11.52 17.07-25.6 17.07z' fill='%23666666'/%3E%3C/svg%3E";
const DEFAULT_AVATAR_60 = "data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='60' height='60' fill='%23CCCCCC' rx='30'/%3E%3Cpath d='M30 20c3.3 0 6 2.7 6 6s-2.7 6-6 6-6-2.7-6-6 2.7-6 6-6zm0 28c-6.6 0-12-3.4-12-8 0-4.6 5.4-8 12-8s12 3.4 12 8c0 4.6-5.4 8-12 8z' fill='%23666666'/%3E%3C/svg%3E";

const OwnerDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const { jobs, loading } = useSelector((state) => state.jobs);
  const { savedWorkers, isLoading: savedWorkersLoading } = useSelector((state) => state.savedWorkers);


  const [activeTab, setActiveTab] = useState('profile');
  // Add search state variables
  const [searchSkill, setSearchSkill] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [showEditProfile, setShowEditProfile] = useState(false);

  const [showCreatePost, setShowCreatePost] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [posts, setPosts] = useState([]);

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

  // Handle post creation from CreatePostModal
  const handlePostCreated = (newPost) => {
    // Ensure the new post has proper author information
    const postWithAuthor = {
      ...newPost,
      author: {
        _id: user._id,
        fullName: user.fullName || user.name,
        name: user.fullName || user.name,
        profilePhoto: user.profilePhoto
      }
    };
    setPosts(prevPosts => [postWithAuthor, ...prevPosts]);
    toast.success('Post created successfully!');
  };

  // Handle post editing
  const handleEditPost = (post) => {
    setEditingPost(post);
  };

  // Add search handler function
  const handleSearch = () => {
    console.log('Performing search...');
    if (!searchSkill.trim() && !searchLocation.trim()) {
      toast.error('Please enter at least one search criteria');
      return;
    }
    
    // Navigate to SearchWorkers page with search parameters
    const searchParams = new URLSearchParams();
    if (searchSkill.trim()) searchParams.set('skill', searchSkill.trim());
    if (searchLocation.trim()) searchParams.set('location', searchLocation.trim());
    
    navigate(`/search-workers?${searchParams.toString()}`);
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

  // Handle post like with optimistic updates and feedback
  const handleLikePost = async (postId) => {
    // Find the current post
    const currentPost = posts.find(post => post._id === postId);
    if (!currentPost) return;
    
    const isCurrentlyLiked = currentPost.likes?.includes(user.userId);
    
    // Optimistic update for instant feedback
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post._id === postId 
          ? { 
              ...post, 
              likes: isCurrentlyLiked 
                ? (post.likes || []).filter(id => id !== user.userId)
                : [...(post.likes || []), user.userId]
            }
          : post
      )
    );
    
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
        // Update with server response
        setPosts(prevPosts => 
          prevPosts.map(post => 
            post._id === postId 
              ? { ...post, likes: data.isLiked 
                  ? [...(post.likes || []).filter(id => id !== user.userId), user.userId] 
                  : (post.likes || []).filter(id => id !== user.userId) }
              : post
          )
        );
        
        // Show feedback
        if (data.isLiked) {
          toast.success('❤️ Liked!', { duration: 1000 });
        }
      } else {
        // Revert optimistic update on error
        setPosts(prevPosts => 
          prevPosts.map(post => 
            post._id === postId 
              ? { 
                  ...post, 
                  likes: isCurrentlyLiked 
                    ? [...(post.likes || []), user.userId]
                    : (post.likes || []).filter(id => id !== user.userId)
                }
              : post
          )
        );
        toast.error('Failed to update like');
      }
    } catch (error) {
      console.error('Error liking post:', error);
      // Revert optimistic update on error
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post._id === postId 
            ? { 
                ...post, 
                likes: isCurrentlyLiked 
                  ? [...(post.likes || []), user.userId]
                  : (post.likes || []).filter(id => id !== user.userId)
              }
            : post
        )
      );
      toast.error('Failed to update like');
    }
  };



  useEffect(() => {
    dispatch(fetchJobs());
    dispatch(fetchSavedWorkers());
    fetchPosts();
    
    // Refresh user data from backend to ensure we have the latest profile information
    const refreshUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const response = await fetch('http://localhost:5000/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.user) {
              // Update Redux state with fresh user data
              dispatch(setCredentials({ user: data.user, token }));
              localStorage.setItem('user', JSON.stringify(data.user));
            }
          }
        }
      } catch (error) {
        console.error('Error refreshing user data:', error);
      }
    };
    
    refreshUserData();
  }, [dispatch]);

  // Separate useEffect to handle profile completion refresh
  useEffect(() => {
    // Check if we just completed profile (from URL params or localStorage flag)
    const urlParams = new URLSearchParams(window.location.search);
    const justCompleted = urlParams.get('profileCompleted') || localStorage.getItem('justCompletedProfile');
    
    if (justCompleted) {
      // Clear the flag
      localStorage.removeItem('justCompletedProfile');
      
      // Force refresh user data after a short delay
      setTimeout(async () => {
        try {
          const token = localStorage.getItem('token');
          if (token) {
            const response = await fetch('http://localhost:5000/api/auth/me', {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            if (response.ok) {
              const data = await response.json();
              if (data.user) {
                dispatch(setCredentials({ user: data.user, token }));
                localStorage.setItem('user', JSON.stringify(data.user));
                toast.success('Profile data refreshed!');
              }
            }
          }
        } catch (error) {
          console.error('Error force refreshing user data:', error);
        }
      }, 500);
    }
  }, [dispatch]);

  // Note: Theme is now handled by ThemeContext globally
  // Removed manual dark mode manipulation to prevent conflicts

  // Update profile data when user data changes
  // Debug logging for user data
  useEffect(() => {
    console.log('Owner Dashboard - User object:', user);
    console.log('Owner Dashboard - ProfilePhoto:', user?.profilePhoto);
  }, [user]);

  // Mock data for demonstration
  const stats = [
    {
      name: 'Active Jobs',
      value: jobs?.filter(job => job.status === 'active').length || 3,
      icon: BriefcaseIcon,
      change: '+2',
      changeType: 'positive',
      color: 'bg-blue-500'
    },
    {
      name: 'Total Workers Hired',
      value: 24,
      icon: UserGroupIcon,
      change: '+5',
      changeType: 'positive',
      color: 'bg-green-500'
    },
    {
      name: 'Total Spent',
      value: '₹45,230',
      icon: CurrencyDollarIcon,
      change: '+₹8,500',
      changeType: 'positive',
      color: 'bg-purple-500'
    }
  ];

  // Removed hardcoded savedWorkers - now using Redux state

  const recentJobs = [
    {
      id: 1,
      title: 'Kitchen Electrical Work',
      status: 'In Progress',
      worker: 'Rajesh Kumar',
      budget: '₹2,500',
      posted: '3 days ago',
      deadline: '2024-01-25',
      applicants: 8
    },
    {
      id: 2,
      title: 'House Deep Cleaning',
      status: 'Completed',
      worker: 'Priya Sharma',
      budget: '₹1,800',
      posted: '1 week ago',
      deadline: '2024-01-20',
      applicants: 12
    },
    {
      id: 3,
      title: 'Bathroom Pipe Repair',
      status: 'Active',
      worker: null,
      budget: '₹1,200',
      posted: '1 day ago',
      deadline: '2024-01-28',
      applicants: 5
    }
  ];







  const notifications = [
    {
      id: 1,
      type: 'job_update',
      message: 'Rajesh Kumar has started working on your Kitchen Electrical Work',
      time: '2 hours ago',
      read: false
    },
    {
      id: 2,
      type: 'application',
      message: 'New application received for Bathroom Pipe Repair',
      time: '4 hours ago',
      read: false
    },
    {
      id: 3,
      type: 'review_reminder',
      message: 'Please review your completed job with Priya Sharma',
      time: '1 day ago',
      read: true
    }
  ];

  const tabs = [
    { id: 'profile', name: 'Profile', icon: UserIcon },
    { id: 'bookmarked-workers', name: 'Bookmarked Workers', icon: BookmarkIcon }
  ];

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'in progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };



  const renderOverview = () => (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md dark:hover:shadow-gray-900/25 transition-shadow">
              <div className="flex items-center">
                <div className={`flex-shrink-0 p-3 rounded-lg ${stat.color}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stat.value}</p>
                </div>
              </div>
              <div className="mt-4">
                <span className={`text-sm font-medium ${
                  stat.changeType === 'positive' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  {stat.change}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">from last month</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Jobs */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recent Jobs</h2>
              <button 
                onClick={() => setActiveTab('jobs')}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 text-sm font-medium"
              >
                View all
              </button>
            </div>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {recentJobs.slice(0, 3).map((job) => (
              <div key={job.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">{job.title}</h3>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {job.worker ? `Assigned to ${job.worker}` : `${job.applicants} applicants`}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">{job.posted}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      getStatusColor(job.status)
                    }`}>
                      {job.status}
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{job.budget}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Saved Workers */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Saved Workers</h2>
              <button 
                onClick={() => setActiveTab('workers')}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 text-sm font-medium"
              >
                View all
              </button>
            </div>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {savedWorkers.slice(0, 3).map((worker) => (
              <div key={worker.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                <div className="flex items-center space-x-4">
                  <img
                    className="h-10 w-10 rounded-full object-cover"
                    src={worker.photo}
                    alt={worker.name}
                  />
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">{worker.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{worker.profession}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        worker.isAvailable ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                      }`}>
                        {worker.isAvailable ? 'Available' : 'Busy'}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button className="text-red-500 hover:text-red-400">
                      <HeartIconSolid className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Link
            to="/search-workers"
            className="flex items-center p-4 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-300 dark:hover:border-green-500 transition-all"
          >
            <MagnifyingGlassIcon className="h-6 w-6 text-green-600 dark:text-green-400 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Search Workers</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Find skilled workers</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Profile Information</h2>
          <button
            onClick={() => setShowEditProfile(true)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
          >
            <PencilIcon className="h-4 w-4 mr-2" />
            Edit Profile
          </button>
        </div>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Photo */}
          <div className="lg:col-span-1">
            <div className="flex flex-col items-center">
              <div className="relative">
                <img
                  className="h-32 w-32 rounded-full object-cover border-4 border-gray-200 dark:border-gray-600"
                  src={
                    user?.profilePhoto 
                      ? (user.profilePhoto.startsWith('http') 
                          ? user.profilePhoto 
                          : `http://localhost:5000${user.profilePhoto}`)
                      : DEFAULT_AVATAR_128
                  }
                  alt="Profile"
                />
              </div>
              <h3 className="mt-4 text-xl font-semibold text-gray-900 dark:text-gray-100">{user?.fullName || user?.name || 'Owner'}</h3>
              <p className="text-gray-600 dark:text-gray-400">Job Owner</p>
            </div>
          </div>

          {/* Profile Details */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Name
                </label>
                <p className="text-gray-900 dark:text-gray-100">{user?.fullName || user?.name || 'Not provided'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mobile Number
                </label>
                <div className="flex items-center">
                  <PhoneIcon className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-2" />
                  <p className="text-gray-900 dark:text-gray-100">{user?.mobile || 'Not provided'}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="flex items-center">
                  <EnvelopeIcon className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-2" />
                  <p className="text-gray-900 dark:text-gray-100">{user?.email || 'Not provided'}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Pincode
                </label>
                <p className="text-gray-900 dark:text-gray-100">{user?.pincode || 'Not provided'}</p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Address
                </label>
                <div className="flex items-start">
                  <MapPinIcon className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-2 mt-1" />
                  <div className="text-gray-900 dark:text-gray-100">
                    {user?.address && (
                      <div>{user.address}</div>
                    )}
                    {(user?.state || user?.district || user?.city || user?.block) && (
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {[user?.block, user?.city, user?.district, user?.state]
                          .filter(Boolean)
                          .join(', ')}
                      </div>
                    )}
                    {!user?.address && !user?.state && !user?.district && !user?.city && !user?.block && (
                      <span>Address not specified</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Languages Spoken */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Languages Spoken
                </label>
                <div className="flex items-start">
                  <div className="text-gray-900 dark:text-gray-100">
                    {user?.languagesSpoken && user.languagesSpoken.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {user.languagesSpoken.map((language, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                          >
                            {language}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-500 dark:text-gray-400">No languages specified</span>
                    )}
                  </div>
                </div>
              </div>
            </div>


          </div>
        </div>
      </div>
    </div>
  );

  const renderJobs = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">My Jobs</h2>
            <Link
              to="/post-job"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Post New Job
            </Link>
          </div>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {recentJobs.map((job) => (
            <div key={job.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{job.title}</h3>
                  <div className="flex items-center space-x-4 mt-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {job.worker ? (
                        <span className="flex items-center">
                          <UserIcon className="h-4 w-4 mr-1" />
                          Assigned to {job.worker}
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <UserGroupIcon className="h-4 w-4 mr-1" />
                          {job.applicants} applicants
                        </span>
                      )}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      Deadline: {job.deadline}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">{job.posted}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    getStatusColor(job.status)
                  }`}>
                    {job.status}
                  </span>
                  <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">{job.budget}</span>
                  <div className="flex space-x-2">
                    <button className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300">
                      <EyeIcon className="h-5 w-5" />
                    </button>

                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSavedWorkers = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Saved Workers</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Your bookmarked and favorite workers</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
          {savedWorkers.map((worker) => (
            <div 
              key={worker._id || worker.id} 
              className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md dark:hover:shadow-lg transition-shadow bg-white dark:bg-gray-700 cursor-pointer"
              onClick={() => navigate(`/worker/${worker._id || worker.id}`)}
            >
              <div className="flex items-center space-x-4 mb-4">
                <img
                  className="h-12 w-12 rounded-full object-cover"
                  src={worker.profilePhoto 
                    ? (worker.profilePhoto.startsWith('http') 
                        ? worker.profilePhoto 
                        : `http://localhost:5000${worker.profilePhoto}`)
                    : DEFAULT_AVATAR_128
                  }
                  alt={worker.fullName || worker.name || 'Worker'}
                  onError={(e) => {
                    e.target.src = DEFAULT_AVATAR_128;
                  }}
                />
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{worker.fullName || worker.name || 'Unknown Worker'}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{worker.skills && worker.skills.length > 0 ? worker.skills.join(', ') : 'No skills listed'}</p>
                </div>
                <button 
                  className="text-red-500 hover:text-red-400"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Handle unsave action here
                  }}
                >
                  <HeartIconSolid className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    worker.availabilityStatus === 'available' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                  }`}>
                    {worker.availabilityStatus === 'available' ? 'Available' : 'Busy'}
                  </span>
                </div>
                
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <MapPinIcon className="h-4 w-4 mr-1" />
                  {worker.location?.city || worker.location?.state || 'Location not specified'}
                </div>
                
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <ClockIcon className="h-4 w-4 mr-1" />
                  Rate: ${worker.hourlyRate || 'Not specified'}/hr
                </div>
              </div>
              
              <div className="flex flex-wrap gap-1 mb-4">
                {worker.skills && worker.skills.length > 0 ? worker.skills.slice(0, 3).map((skill, index) => (
                  <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                    {skill}
                  </span>
                )) : (
                  <span className="text-xs text-gray-500">No skills listed</span>
                )}
              </div>
              
              <div className="flex space-x-2">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/worker/${worker._id || worker.id}`);
                  }}
                  className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-700"
                >
                  View Profile
                </button>

                <button 
                  className="bg-gray-100 text-gray-700 px-3 py-2 rounded-md text-sm hover:bg-gray-200"
                  onClick={(e) => e.stopPropagation()}
                >
                  <PhoneIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );





  const renderNotifications = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
          <p className="text-sm text-gray-600 mt-1">Stay updated with your jobs and workers</p>
        </div>
        <div className="divide-y divide-gray-200">
          {notifications.map((notification) => (
            <div key={notification.id} className={`px-6 py-4 hover:bg-gray-50 ${
              !notification.read ? 'bg-blue-50' : ''
            }`}>
              <div className="flex items-start space-x-4">
                <div className={`flex-shrink-0 p-2 rounded-full ${
                  notification.type === 'job_update' ? 'bg-green-100' :
                  notification.type === 'application' ? 'bg-blue-100' :
                  'bg-yellow-100'
                }`}>
                  {notification.type === 'job_update' && <CheckCircleIcon className="h-5 w-5 text-green-600" />}
                  {notification.type === 'application' && <UserGroupIcon className="h-5 w-5 text-blue-600" />}

                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{notification.message}</p>
                  <p className="text-sm text-gray-500 mt-1">{notification.time}</p>
                </div>
                {!notification.read && (
                  <div className="flex-shrink-0">
                    <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );





  const renderFeedback = () => {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Feedback & Ratings</h2>
        
        {/* Rating Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-gray-900 mb-2">24</div>
            <div className="text-gray-600">Total Reviews</div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-gray-900 mb-2">98%</div>
            <div className="text-gray-600">Satisfaction Rate</div>
          </div>
        </div>
        
        {/* Recent Reviews */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Reviews</h3>
          <div className="space-y-6">
            {savedWorkers.map((worker) => (
              <div key={worker.id} className="border-b border-gray-200 pb-6 last:border-b-0">
                <div className="flex items-start space-x-4">
                  <img
                    className="h-12 w-12 rounded-full"
                    src={worker.photo}
                    alt={worker.name}
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">{worker.name}</h4>

                    </div>
                    <p className="text-sm text-gray-600 mt-1">{worker.profession}</p>
                    <p className="text-gray-700 mt-2">Excellent work quality and professional service. Highly recommended!</p>
                    <p className="text-sm text-gray-500 mt-2">2 days ago</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderBookmarkedWorkers = () => {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Bookmarked Workers</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedWorkers.map((worker) => (
            <div key={worker._id || worker.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl dark:hover:shadow-2xl transition-shadow duration-200">
              <div className="text-center">
                <img
                  className="h-20 w-20 rounded-full mx-auto mb-4 object-cover"
                  src={worker.profilePhoto 
                    ? (worker.profilePhoto.startsWith('http') 
                        ? worker.profilePhoto 
                        : `http://localhost:5000${worker.profilePhoto}`)
                    : DEFAULT_AVATAR_128
                  }
                  alt={worker.fullName || worker.name || 'Worker'}
                  onError={(e) => {
                    console.log('Bookmarked worker image failed to load:', e.target.src);
                    console.log('Worker data:', worker);
                    e.target.src = DEFAULT_AVATAR_128;
                  }}
                />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{worker.fullName || worker.name || 'Unknown Worker'}</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-3">{worker.skills && worker.skills.length > 0 ? worker.skills.join(', ') : 'No skills listed'}</p>

                <div className="flex space-x-2">
                  <button 
                    onClick={() => navigate(`/worker/${worker._id || worker.id}`)}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2 rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all duration-200"
                  >
                    View Details
                  </button>
                  <button className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                    <HeartIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderSettings = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
          <p className="text-sm text-gray-600 mt-1">Manage your account and preferences</p>
        </div>
        <div className="p-6 space-y-6">
          {/* Privacy Settings */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Privacy Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Show job history to workers</p>
                  <p className="text-sm text-gray-600">Allow workers to see your past job postings</p>
                </div>
                <button className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-blue-600 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                  <span className="translate-x-5 inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"></span>
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Show contact information</p>
                  <p className="text-sm text-gray-600">Display your phone number to hired workers</p>
                </div>
                <button className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-gray-200 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                  <span className="translate-x-0 inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"></span>
                </button>
              </div>
            </div>
          </div>

          {/* Notification Preferences */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Preferences</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Email notifications</p>
                  <p className="text-sm text-gray-600">Receive updates via email</p>
                </div>
                <button className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-blue-600 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                  <span className="translate-x-5 inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"></span>
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">SMS notifications</p>
                  <p className="text-sm text-gray-600">Receive updates via SMS</p>
                </div>
                <button className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-gray-200 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                  <span className="translate-x-0 inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"></span>
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Push notifications</p>
                  <p className="text-sm text-gray-600">Receive in-app notifications</p>
                </div>
                <button className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-blue-600 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                  <span className="translate-x-5 inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"></span>
                </button>
              </div>
            </div>
          </div>

          {/* Account Management */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Account Management</h3>
            <div className="space-y-4">
              <button className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <p className="text-sm font-medium text-gray-900">Change Password</p>
                <p className="text-sm text-gray-600">Update your account password</p>
              </button>
              <button className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <p className="text-sm font-medium text-gray-900">Update Mobile Number</p>
                <p className="text-sm text-gray-600">Change your registered mobile number</p>
              </button>
              <button className="w-full text-left p-4 border border-red-200 rounded-lg hover:bg-red-50">
                <p className="text-sm font-medium text-red-900">Deactivate Account</p>
                <p className="text-sm text-red-600">Temporarily disable your account</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return renderProfile();
      case 'feedback':
        return renderFeedback();
      case 'bookmarked-workers':
        return renderBookmarkedWorkers();
      default:
        return renderProfile();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-gradient-to-b from-indigo-900 via-purple-900 to-blue-900 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 min-h-screen shadow-2xl">
          <div className="p-6">
            {/* Profile Section */}
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/20 dark:border-gray-600">
                <img
                  src={user?.profilePhoto 
                    ? (user.profilePhoto.startsWith('http') 
                        ? user.profilePhoto 
                        : `http://localhost:5000${user.profilePhoto}`)
                    : '/default-avatar.png'
                  }
                  alt={user?.name || 'Owner'}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = '/default-avatar.png';
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white dark:text-gray-100 font-semibold text-sm truncate">
                  {user?.name || user?.fullName || user?.firstName || user?.displayName || user?.email?.split('@')[0] || 'Owner'}
                </h3>
                <p className="text-purple-200 dark:text-gray-300 text-xs">Property Owner</p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-white bg-opacity-20 dark:bg-gray-700 dark:bg-opacity-50 text-white dark:text-gray-100 shadow-lg'
                        : 'text-purple-200 dark:text-gray-300 hover:bg-white hover:bg-opacity-10 dark:hover:bg-gray-700 dark:hover:bg-opacity-30 hover:text-white dark:hover:text-gray-100'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{tab.name}</span>
                  </button>
                );
              })}
            </nav>

            {/* Social Links */}
            <div className="mt-auto pt-8">
              <div className="flex space-x-4 justify-center">
                <button className="text-purple-200 dark:text-gray-400 hover:text-white dark:hover:text-gray-200 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </button>
                <button className="text-purple-200 dark:text-gray-400 hover:text-white dark:hover:text-gray-200 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.748-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001 12.017.001z"/>
                  </svg>
                </button>
                <button className="text-purple-200 dark:text-gray-400 hover:text-white dark:hover:text-gray-200 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8 pt-12">
          {/* Search Bar */}
          <div className="mb-8">
            <div className="max-w-4xl mx-auto">
              {/* Main Search Section */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 text-center">
                  Find Workers
                </h2>
                
                {/* Search Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {/* Worker Search */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Search Workers
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <UserIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        placeholder="Enter worker name, skill, or service..."
                        value={searchSkill}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg leading-5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 shadow-sm transition-all duration-200"
                        onChange={(e) => {
                          console.log('Worker search:', e.target.value);
                          setSearchSkill(e.target.value);
                        }}
                      />
                    </div>
                  </div>
                  
                  {/* Location */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Location
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MapPinIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        placeholder="Enter city or area..."
                        value={searchLocation}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg leading-5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 shadow-sm transition-all duration-200"
                        onChange={(e) => {
                          console.log('Location search:', e.target.value);
                          setSearchLocation(e.target.value);
                        }}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Search Button */}
                <div className="flex justify-center mb-6">
                  <button 
                    className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-12 py-3 rounded-lg font-medium flex items-center space-x-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    onClick={handleSearch}
                  >
                    <MagnifyingGlassIcon className="h-5 w-5" />
                    <span>Search Workers</span>
                  </button>
                </div>
                
                {/* Quick Search Filters */}
                <div className="mt-6">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Popular Categories:</p>
                  <div className="flex flex-wrap gap-2">
                    <button 
                      className="px-4 py-2 text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors flex items-center space-x-1"
                      onClick={() => console.log('Filter: Electricians')}
                    >
                      <span>⚡</span>
                      <span>Electricians</span>
                    </button>
                    <button 
                      className="px-4 py-2 text-sm bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full hover:bg-green-200 dark:hover:bg-green-800 transition-colors flex items-center space-x-1"
                      onClick={() => console.log('Filter: Plumbers')}
                    >
                      <span>🔧</span>
                      <span>Plumbers</span>
                    </button>
                    <button 
                      className="px-4 py-2 text-sm bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors flex items-center space-x-1"
                      onClick={() => console.log('Filter: Cleaners')}
                    >
                      <span>🧹</span>
                      <span>Cleaners</span>
                    </button>
                    <button 
                      className="px-4 py-2 text-sm bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 rounded-full hover:bg-orange-200 dark:hover:bg-orange-800 transition-colors flex items-center space-x-1"
                      onClick={() => console.log('Filter: Carpenters')}
                    >
                      <span>🔨</span>
                      <span>Carpenters</span>
                    </button>
                    <button 
                      className="px-4 py-2 text-sm bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-full hover:bg-yellow-200 dark:hover:bg-yellow-800 transition-colors flex items-center space-x-1"
                      onClick={() => console.log('Filter: Painters')}
                    >
                      <span>🎨</span>
                      <span>Painters</span>
                    </button>
                    <button 
                      className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center space-x-1"
                      onClick={() => console.log('Show all categories')}
                    >
                      <span>👁️</span>
                      <span>View All</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Content */}
          {renderTabContent()}
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <EditProfile
          isOpen={showEditProfile}
          onClose={() => setShowEditProfile(false)}
          userType={user?.userType || 'owner'}
          currentProfile={user}
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
    </div>
  );
};

export default OwnerDashboard;