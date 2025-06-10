import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import { MapPinIcon, CalendarIcon, CheckBadgeIcon, HeartIcon, ChatBubbleLeftIcon, PhoneIcon, StarIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid, StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { reviewAPI } from '../services/api';
import { fetchProfile } from '../features/profiles/profilesSlice';
import { createConversation } from '../features/chat/chatSlice';
import { saveWorker, removeSavedWorker, checkIfWorkerSaved } from '../features/savedWorkers/savedWorkersSlice';
import { toast } from 'react-hot-toast';
import { useChatPopup } from '../hooks/useChatPopup';
import MediaPreview from '../components/MediaPreview';

const WorkerProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { openChatPopup } = useChatPopup();

  const { viewedProfile, isLoading, error } = useSelector((state) => state.profiles);
  const { checkedWorkers } = useSelector((state) => state.savedWorkers);
  const [activeTab, setActiveTab] = useState('overview');
  const [workerPosts, setWorkerPosts] = useState([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const [showComments, setShowComments] = useState({});
  const [newComment, setNewComment] = useState({});
  const [isSubmittingComment, setIsSubmittingComment] = useState({});
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [workerReviews, setWorkerReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const { user } = useSelector((state) => state.auth);

  // Fetch worker posts
  const fetchWorkerPosts = async (workerId) => {
    try {
      setIsLoadingPosts(true);
      const response = await fetch(`http://localhost:5000/api/posts?userId=${workerId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setWorkerPosts(data.posts || []);
      }
    } catch (error) {
      console.error('Error fetching worker posts:', error);
    } finally {
      setIsLoadingPosts(false);
    }
  };

  // Fetch worker reviews
  const fetchWorkerReviews = async (workerId) => {
    try {
      const response = await reviewAPI.getWorkerReviews(workerId);
      setWorkerReviews(response.data.reviews || []);
      setAverageRating(response.data.averageRating || 0);
      setTotalReviews(response.data.totalReviews || 0);
    } catch (error) {
      console.error('Error fetching worker reviews:', error);
    }
  };

  // Handle review submission
  const handleSubmitReview = async () => {
    if (!user) {
      toast.error('Please login to submit a review');
      return;
    }

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
        workerId: id,
        rating: reviewRating,
        comment: reviewComment.trim()
      });
      
      toast.success('Review submitted successfully!');
      setShowReviewModal(false);
      setReviewRating(0);
      setReviewComment('');
      
      // Refresh reviews
      fetchWorkerReviews(id);
    } catch (error) {
      console.error('Error submitting review:', error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to submit review');
      }
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Handle write review button click
  const handleWriteReview = () => {
    if (!user) {
      toast.error('Please login to write a review');
      return;
    }
    setShowReviewModal(true);
  };

  useEffect(() => {
    if (id) {
      dispatch(fetchProfile(id));
      fetchWorkerPosts(id);
      fetchWorkerReviews(id);
    }
  }, [dispatch, id]);

  // Add debugging to see what data we're getting
  useEffect(() => {
    if (viewedProfile) {
      console.log('WorkerProfile - viewedProfile data:', viewedProfile);
      console.log('WorkerProfile - profilePicture:', viewedProfile.profilePicture);
      console.log('WorkerProfile - name:', viewedProfile.name);
      console.log('WorkerProfile - certificates:', viewedProfile.certificates);
    }
  }, [viewedProfile]);

  // Check if worker is saved when profile loads
  useEffect(() => {
    if (viewedProfile && user) {
      const workerId = viewedProfile._id || viewedProfile.id;
      if (workerId) {
        dispatch(checkIfWorkerSaved(workerId));
      }
    }
  }, [dispatch, viewedProfile, user]);

  // Update local saved state based on Redux state
  useEffect(() => {
    if (viewedProfile) {
      const workerId = viewedProfile._id || viewedProfile.id;
      setIsSaved(!!checkedWorkers[workerId]);
    }
  }, [checkedWorkers, viewedProfile]);

  // Handler functions
  const handleHireNow = () => {
    toast.success('Hire request sent successfully!');
    // Add actual hire logic here
  };

  const handleContactWorker = async () => {
    if (!user) {
      toast.error('Please login to contact the worker');
      return;
    }

    if (user.role !== 'owner') {
      toast.error('Only owners can contact workers');
      return;
    }

    // Debug logging
    console.log('handleContactWorker - viewedProfile:', viewedProfile);
    console.log('handleContactWorker - viewedProfile._id:', viewedProfile?._id);
    console.log('handleContactWorker - viewedProfile.id:', viewedProfile?.id);
    
    if (!viewedProfile) {
      toast.error('Worker profile not loaded. Please try again.');
      return;
    }
    
    // Check for both _id and id properties
    const workerId = viewedProfile._id || viewedProfile.id;
    if (!workerId) {
      toast.error('Worker profile ID not found. Please try again.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login to continue');
        return;
      }

      console.log('Creating conversation with worker:', workerId);
      
      // Use Redux action to create conversation
      const resultAction = await dispatch(createConversation({
        participantId: workerId,
        initialMessage: `Hi ${viewedProfile.firstName || viewedProfile.name}, I'm interested in your services. Could we discuss a potential project?`
      }));
      
      if (createConversation.fulfilled.match(resultAction)) {
        const conversation = resultAction.payload;
        console.log('Conversation created successfully via Redux:', conversation);
        console.log('Conversation ID:', conversation._id);
        
        // Open chat popup with the new conversation
        openChatPopup(conversation);
        toast.success('Conversation started successfully!');
      } else {
        console.error('Failed to create conversation:', resultAction.error);
        toast.error(resultAction.error?.message || 'Failed to start conversation');
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast.error('Failed to start conversation. Please try again.');
    }
  };

  const handleSaveProfile = async () => {
    if (!user) {
      toast.error('Please login to save workers');
      return;
    }

    if (!viewedProfile?._id && !viewedProfile?.id) {
      toast.error('Worker profile not found');
      return;
    }

    const workerId = viewedProfile._id || viewedProfile.id;

    try {
      if (isSaved) {
        await dispatch(removeSavedWorker(workerId)).unwrap();
        setIsSaved(false);
        toast.success('Worker removed from saved list');
      } else {
        await dispatch(saveWorker(workerId)).unwrap();
        setIsSaved(true);
        toast.success('Worker saved successfully!');
      }
    } catch (error) {
      toast.error(error || 'Failed to update saved status');
    }
  };

  // Post interaction handlers
  const handleLikePost = async (postId) => {
    if (!user) {
      toast.error('Please login to like posts');
      return;
    }

    try {
      // Optimistic update
      setWorkerPosts(prevPosts => 
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
      fetchWorkerPosts(id);
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
      
      // Debug: Log the comment data to see what's being returned
      console.log('Comment data received:', data.comment);
      console.log('Comment author:', data.comment.author);
      console.log('Comment author profilePhoto:', data.comment.author?.profilePhoto);
      
      // Update posts with new comment
      setWorkerPosts(prevPosts => 
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



  const tabs = [
    { key: 'overview', label: 'About & Experience' },
    { key: 'certificates', label: 'Document & ID Proof' },
    { key: 'portfolio', label: 'Work Portfolio' },
    { key: 'posts', label: 'Posts & Updates' },
    { key: 'reviews', label: 'Reviews' },
    { key: 'availability', label: 'Availability' }
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-red-500 text-center">
          <h2 className="text-2xl font-bold mb-2">Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!viewedProfile) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-gray-500 text-center">
          <h2 className="text-2xl font-bold mb-2">Worker Not Found</h2>
          <p>The worker profile you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const worker = viewedProfile;

  // Convert workExperience object to array format (handles both CompleteProfile and Dashboard formats)
  const formatWorkExperience = (workExperienceData) => {
    const formattedWorkExperience = [];
    
    if (workExperienceData && typeof workExperienceData === 'object' && !Array.isArray(workExperienceData)) {
      // Handle CompleteProfile format (duration, companies, freelancingHistory)
      if (workExperienceData.duration || workExperienceData.companies || workExperienceData.freelancingHistory) {
        if (workExperienceData.duration) {
          formattedWorkExperience.push({
            id: 1,
            company: 'Work Experience',
            position: 'Professional',
            startDate: workExperienceData.duration,
            endDate: 'Present',
            description: [
              workExperienceData.companies && `Companies: ${workExperienceData.companies}`,
              workExperienceData.freelancingHistory && `Freelancing: ${workExperienceData.freelancingHistory}`
            ].filter(Boolean).join('\n\n')
          });
        }
      } else {
        // Handle Dashboard format (structured objects with company, position, etc.)
        Object.keys(workExperienceData).forEach((key, index) => {
          const exp = workExperienceData[key];
          if (exp && typeof exp === 'object') {
            formattedWorkExperience.push({
              id: index + 1,
              company: exp.company || 'Company Name',
              position: exp.position || 'Position',
              startDate: exp.startDate || exp.duration || 'Start Date',
              endDate: exp.endDate || 'Present',
              description: exp.description || ''
            });
          }
        });
      }
    } else if (Array.isArray(workExperienceData)) {
      return workExperienceData;
    } else if (typeof workExperienceData === 'string' && workExperienceData.trim()) {
      // Handle simple string format from EditProfile
      formattedWorkExperience.push({
        id: 1,
        company: 'Work Experience',
        position: 'Professional',
        startDate: workExperienceData,
        endDate: 'Present',
        description: ''
      });
    }
    
    return formattedWorkExperience;
  };

  // Apply formatting to worker data by creating a copy
  let formattedWorker = worker;
  if (worker && worker.workExperience) {
    formattedWorker = {
      ...worker,
      workExperience: formatWorkExperience(worker.workExperience)
    };
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
            <img
              src={formattedWorker.profilePicture 
                ? (formattedWorker.profilePicture.startsWith('http') 
                    ? formattedWorker.profilePicture 
                    : `http://localhost:5000${formattedWorker.profilePicture}`)
                : '/default-avatar.png'
              }
              alt={formattedWorker.name}
              className="w-32 h-32 rounded-full object-cover border-4 border-blue-100 dark:border-gray-600"
              onError={(e) => {
                console.log('Profile image failed to load, using fallback');
                e.target.src = '/default-avatar.png';
              }}
            />
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{formattedWorker.name}</h1>
              <p className="text-xl text-gray-600 dark:text-gray-400 mb-2">{formattedWorker.title || 'Professional Worker'}</p>
              
              {/* Average Rating Display */}
              {averageRating > 0 && (
                <div className="flex items-center mb-3">
                  <div className="flex items-center mr-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <StarIconSolid
                        key={star}
                        className={`h-4 w-4 ${
                          star <= Math.round(averageRating)
                            ? 'text-yellow-400'
                            : 'text-gray-300 dark:text-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {averageRating.toFixed(1)}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                    ({totalReviews} review{totalReviews !== 1 ? 's' : ''})
                  </span>
                </div>
              )}
              
              {/* Languages Spoken */}
              {formattedWorker.languagesSpoken && formattedWorker.languagesSpoken.length > 0 && (
                <div className="mb-3">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Languages Spoken</h4>
                  <div className="flex flex-wrap gap-2">
                    {formattedWorker.languagesSpoken.map((language, index) => (
                      <span
                        key={index}
                        className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-3 py-1 rounded-full text-sm font-medium"
                      >
                        {language}
                      </span>
                    ))}
                  </div>
                </div>
              )}


              
              {/* Key Contact Information */}
              <div className="space-y-2 mb-3">
                <div className="flex items-center text-gray-700 dark:text-gray-300">
                  <PhoneIcon className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                  {formattedWorker.mobile || formattedWorker.phoneNumber ? (
                    <a 
                      href={`tel:${formattedWorker.mobile || formattedWorker.phoneNumber}`}
                      className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline"
                    >
                      {formattedWorker.mobile || formattedWorker.phoneNumber}
                    </a>
                  ) : (
                    <span className="font-medium text-gray-500 dark:text-gray-400">Contact number not provided</span>
                  )}


                </div>
                <div className="flex items-start text-gray-700 dark:text-gray-300">
                  <MapPinIcon className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <span className="font-medium">{formattedWorker.address || formattedWorker.location || 'Address not specified'}</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">

                <div className="flex items-center">
                  <CheckBadgeIcon className="h-4 w-4 mr-1" />
                  <span>{formattedWorker.certificates?.length || 0} documents</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                ₹{formattedWorker.hourlyRate || 0}/hour
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {formattedWorker.availability?.status || 'Available'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={handleHireNow}
              className="bg-blue-600 dark:bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors flex items-center"
            >
              <PhoneIcon className="h-4 w-4 mr-2" />
              Hire Now
            </button>

            <button
              onClick={handleContactWorker}
              className="bg-green-600 dark:bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors flex items-center"
            >
              <ChatBubbleLeftIcon className="h-4 w-4 mr-2" />
              Message Now
            </button>

            <button
              onClick={handleSaveProfile}
              className={`px-6 py-2 rounded-lg transition-colors flex items-center ${
                isSaved 
                  ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {isSaved ? (
                <HeartIconSolid className="h-4 w-4 mr-2" />
              ) : (
                <HeartIcon className="h-4 w-4 mr-2" />
              )}


              {isSaved ? 'Saved' : 'Save'}
            </button>
            <button
              onClick={handleWriteReview}
              className="bg-yellow-600 dark:bg-yellow-500 text-white px-6 py-2 rounded-lg hover:bg-yellow-700 dark:hover:bg-yellow-600 transition-colors flex items-center"
            >
              <StarIcon className="h-4 w-4 mr-2" />
              Write Review
            </button>
          </div>
        </div>

        {/* Skills Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {formattedWorker.skills && formattedWorker.skills.length > 0 ? (
              formattedWorker.skills.map((skill, index) => (
                <span
                  key={index}
                  className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm"
                >
                  {skill}
                </span>
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No skills listed.</p>
            )}


          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">About</h3>
                  <p className="text-gray-700 dark:text-gray-400 leading-relaxed">
                    {formattedWorker.description || formattedWorker.bio || 'No description available.'}
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Work Experience</h3>
                  {formattedWorker.workExperience && Array.isArray(formattedWorker.workExperience) && formattedWorker.workExperience.length > 0 ? (
                    <div className="space-y-4">
                      {formattedWorker.workExperience.map((exp, index) => (
                        <div key={index} className="border-l-4 border-blue-500 dark:border-blue-400 pl-4 py-2">
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">{exp.position}</h4>
                          <p className="text-gray-600 dark:text-gray-400">{exp.company}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-500">
                            {exp.startDate} - {exp.endDate || 'Present'}
                          </p>
                          {exp.description && (
                            <p className="text-gray-700 dark:text-gray-400 mt-2">{exp.description}</p>
                          )}


                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <CalendarIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                      <p className="text-gray-500 dark:text-gray-400 mt-2">No work experience listed yet.</p>
                    </div>
                  )}


                </div>

                {/* Additional Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Additional Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Hourly Rate</h4>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">₹{formattedWorker.hourlyRate || 0}/hour</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Response Time</h4>
                      <p className="text-gray-700 dark:text-gray-400">{formattedWorker.availability?.responseTime || 'Usually responds within 24 hours'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}



            {activeTab === 'certificates' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Certifications & Documents</h3>
                <MediaPreview 
                  certificates={formattedWorker.certificates || []}
                  showTitle={false}
                  maxItems={12}
                  onViewAll={(type) => {
                    if (type === 'certificates') {
                      navigate(`/certificates/${id}`);
                    }
                  }}
                />
              </div>
            )}



            {activeTab === 'portfolio' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Work Portfolio & Previous Projects</h3>
                
                {/* Media Preview Component */}
                <MediaPreview 
                  workPhotos={formattedWorker.workPhotos || []}
                  certificates={formattedWorker.certificates || []}
                  showTitle={false}
                  maxItems={8}
                  onViewAll={(type) => {
                    if (type === 'photos') {
                      navigate(`/work-portfolio/${id}`);
                    } else if (type === 'certificates') {
                      navigate(`/certificates/${id}`);
                    }
                  }}
                  className="mb-8"
                />


                
                {/* Portfolio Projects */}
                {formattedWorker.portfolio && Array.isArray(formattedWorker.portfolio) && formattedWorker.portfolio.length > 0 && (
                  <div className="mb-8">
                    <div className="flex items-center mb-4">
                      <div className="h-6 w-6 text-blue-500 dark:text-blue-400 mr-2">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                      <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">Featured Projects ({formattedWorker.portfolio.length})</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {formattedWorker.portfolio.map((item, index) => (
                        <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-lg transition-shadow bg-white dark:bg-gray-800">
                          <div className="flex items-center mb-3">
                            <div className="h-6 w-6 text-blue-500 dark:text-blue-400 mr-2">
                              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                              </svg>
                            </div>
                            <h4 className="font-medium text-gray-900 dark:text-gray-100">{item.title || `Project ${index + 1}`}</h4>
                          </div>
                          {item.image && (
                            <div className="mb-3">
                              <img
                                src={item.image.startsWith('http') ? item.image : `http://localhost:5000${item.image}`}
                                alt={item.title || `Project ${index + 1}`}
                                className="w-full h-40 object-cover rounded border cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => {
                              // Portfolio image viewing can be handled separately if needed
                            }}
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                            </div>
                          )}


                          {item.description && <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">{item.description}</p>}
                          {item.category && <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Category: {item.category}</p>}
                          {item.date && <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Date: {item.date}</p>}
                          {item.image && (
                            <button
                              onClick={() => {
                                // Portfolio image viewing can be handled separately if needed
                              }}
                              className="inline-block w-full text-center bg-blue-600 dark:bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors text-sm font-medium"
                            >
                              View Full Image
                            </button>
                          )}


                        </div>
                      ))}
                    </div>
                  </div>
                )}


                
                {/* Empty State */}
                {(!formattedWorker.workPhotos || formattedWorker.workPhotos.length === 0) && (!formattedWorker.portfolio || formattedWorker.portfolio.length === 0) && (
                  <div className="text-center py-16 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500 mb-4">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Portfolio Items Yet</h3>
                    <p className="text-gray-500 dark:text-gray-400">This worker hasn't uploaded any work samples or portfolio items yet.</p>
                  </div>
                )}


              </div>
            )}





            {activeTab === 'availability' && (
              <div>
                <div className="flex items-center mb-6">
                  <CalendarIcon className="h-6 w-6 text-blue-500 dark:text-blue-400 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Availability & Schedule</h3>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Working Hours */}
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                    <div className="flex items-center mb-4">
                      <CalendarIcon className="h-5 w-5 text-blue-500 dark:text-blue-400 mr-2" />
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">Working Hours</h4>
                    </div>
                    <div className="space-y-2">
                      {formattedWorker.availability?.workingHours ? (
                        <p className="text-gray-700 dark:text-gray-300 text-lg">{String(formattedWorker.availability.workingHours)}</p>
                      ) : (
                        <div className="text-gray-500 dark:text-gray-400">
                          <p>Monday - Friday: 9:00 AM - 6:00 PM</p>
                          <p>Saturday: 9:00 AM - 2:00 PM</p>
                          <p>Sunday: Closed</p>
                          <p className="text-sm mt-2 italic">Default schedule - contact for specific availability</p>
                        </div>
                      )}


                    </div>
                  </div>
                  
                  {/* Response Time */}
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                    <div className="flex items-center mb-4">
                      <ChatBubbleLeftIcon className="h-5 w-5 text-green-500 dark:text-green-400 mr-2" />
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">Response Time</h4>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-400 dark:bg-green-500 rounded-full mr-2"></div>
                      <span className="text-lg font-medium text-gray-900 dark:text-gray-100">
                        {String(formattedWorker.availability?.responseTime || 'Within 2-4 hours')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      Average time to respond to messages
                    </p>
                  </div>
                  
                  {/* Current Status */}
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                    <div className="flex items-center mb-4">
                      <CheckBadgeIcon className="h-5 w-5 text-green-500 dark:text-green-400 mr-2" />
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">Current Status</h4>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-400 dark:bg-green-500 rounded-full mr-2 animate-pulse"></div>
                      <span className="text-lg font-medium text-green-600 dark:text-green-400">
                        {String(formattedWorker.availability?.status || 'Available for Work')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      Ready to take on new projects
                    </p>
                  </div>
                  
                  {/* Contact Preference */}
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                    <div className="flex items-center mb-4">
                      <PhoneIcon className="h-5 w-5 text-blue-500 dark:text-blue-400 mr-2" />
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">Preferred Contact</h4>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <PhoneIcon className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-2" />
                        <span className="text-gray-700 dark:text-gray-300">Phone/WhatsApp</span>
                      </div>
                      <div className="flex items-center">
                        <ChatBubbleLeftIcon className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-2" />
                        <span className="text-gray-700 dark:text-gray-300">In-app messaging</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Additional Notes */}
                {formattedWorker.availability?.notes && (
                  <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">Additional Notes</h4>
                    <p className="text-blue-800 dark:text-blue-200">{String(formattedWorker.availability.notes)}</p>
                  </div>
                )}


              </div>
            )}



            {activeTab === 'reviews' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <StarIcon className="h-6 w-6 text-yellow-500 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Reviews & Ratings</h3>
                    {totalReviews > 0 && (
                      <span className="ml-2 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-sm px-2 py-1 rounded-full">
                        {totalReviews}
                      </span>
                    )}
                  </div>
                  {averageRating > 0 && (
                    <div className="flex items-center">
                      <div className="flex items-center mr-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <StarIconSolid
                            key={star}
                            className={`h-5 w-5 ${
                              star <= Math.round(averageRating)
                                ? 'text-yellow-400'
                                : 'text-gray-300 dark:text-gray-600'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {averageRating.toFixed(1)}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
                        ({totalReviews} review{totalReviews !== 1 ? 's' : ''})
                      </span>
                    </div>
                  )}
                </div>

                {workerReviews && workerReviews.length > 0 ? (
                  <div className="space-y-6">
                    {workerReviews.map((review, index) => (
                      <div key={review._id || index} className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center">
                            <img
                              src={review.reviewerProfilePicture 
                                ? (review.reviewerProfilePicture.startsWith('http') 
                                    ? review.reviewerProfilePicture 
                                    : `http://localhost:5000${review.reviewerProfilePicture}`)
                                : '/default-avatar.png'
                              }
                              alt={review.reviewerName}
                              className="w-12 h-12 rounded-full object-cover mr-4"
                            />
                            <div>
                              <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                                {review.reviewerName}
                              </h4>
                              <div className="flex items-center mt-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <StarIconSolid
                                    key={star}
                                    className={`h-4 w-4 ${
                                      star <= review.rating
                                        ? 'text-yellow-400'
                                        : 'text-gray-300 dark:text-gray-600'
                                    }`}
                                  />
                                ))}
                                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                                  {review.rating}/5
                                </span>
                              </div>
                            </div>
                          </div>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                          {review.comment}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <StarIcon className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500" />
                    <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">No Reviews Yet</h3>
                    <p className="mt-2 text-gray-500 dark:text-gray-400">
                      This worker hasn't received any reviews yet. Be the first to leave a review!
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'posts' && (
              <div>
                <div className="flex items-center mb-6">
                  <ChatBubbleLeftIcon className="h-6 w-6 text-blue-500 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recent Posts & Work Updates</h3>
                  {workerPosts && workerPosts.length > 0 && (
                    <span className="ml-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm px-2 py-1 rounded-full">
                      {workerPosts.length}
                    </span>
                  )}


                </div>
                
                {isLoadingPosts ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                  </div>
                ) : workerPosts && workerPosts.length > 0 ? (
                  <div className="space-y-6">
                    {workerPosts.map((post, index) => (
                      <div key={post._id || index} className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-center mb-4">
                          <img
                            src={formattedWorker.profilePicture 
                              ? (formattedWorker.profilePicture.startsWith('http') 
                                  ? formattedWorker.profilePicture 
                                  : `http://localhost:5000${formattedWorker.profilePicture}`)
                              : '/default-avatar.png'
                            }
                            alt={formattedWorker.name}
                            className="w-12 h-12 rounded-full object-cover mr-3 border-2 border-gray-200 dark:border-gray-600"
                            onError={(e) => {
                              console.log('Post profile image failed to load, using fallback');
                              e.target.src = '/default-avatar.png';
                            }}
                          />
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 dark:text-gray-100">{formattedWorker.name}</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {new Date(post.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                        
                        <div className="mb-4">
                          <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">{post.content}</p>
                          
                          {post.images && post.images.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {post.images.map((image, imgIndex) => (
                                <img
                                  key={imgIndex}
                                  src={image.startsWith('http') ? image : `http://localhost:5000${image}`}
                                  alt={`Post image ${imgIndex + 1}`}
                                  className="w-full h-48 object-cover rounded-lg border dark:border-gray-600 cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={() => {
                                    // Post image viewing can be handled separately if needed
                                  }}
                                />
                              ))}
                            </div>
                          )}


                        </div>
                        
                        {/* Post Actions */}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                          <div className="flex items-center space-x-6">
                            {/* Like Button */}
                            <button
                              onClick={() => handleLikePost(post._id)}
                              className="flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-red-500 transition-all duration-200 transform hover:scale-105"
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
                              className="flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-blue-500 transition-all duration-200 transform hover:scale-105"
                            >
                              <ChatBubbleLeftIcon className="h-5 w-5 mr-1" />
                              {post.comments?.length || 0} comments
                            </button>
                            
                            {/* Share Button */}
                            <button
                              onClick={() => handleSharePost(post._id)}
                              className="flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-green-500 transition-all duration-200 transform hover:scale-105"
                            >
                              <svg className="h-5 w-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                              </svg>
                              Share
                            </button>
                          </div>
                          <div className="text-xs text-gray-400 dark:text-gray-500">
                            {post.location && `📍 ${post.location}`}
                          </div>
                        </div>
                        
                        {/* Comments Section */}
                        {showComments[post._id] && (
                          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
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
                                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
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
                                    <div className="flex-1 bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                                          {comment.author?.fullName || 'Anonymous User'}
                                        </span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                          {new Date(comment.createdAt).toLocaleDateString()}
                                        </span>
                                      </div>
                                      <p className="text-sm text-gray-700 dark:text-gray-300">{comment.content}</p>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                                  No comments yet. Be the first to comment!
                                </p>
                              )}


                            </div>
                          </div>
                        )}


                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <ChatBubbleLeftIcon className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500" />
                    <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">No Posts Yet</h3>
                    <p className="mt-2 text-gray-500 dark:text-gray-400">
                      This worker hasn't shared any work updates or posts yet.
                    </p>
                  </div>
                )}


              </div>
            )}


          </div>
        </div>
      </div>
      


      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Write a Review</h3>
              <button
                onClick={() => {
                  setShowReviewModal(false);
                  setReviewRating(0);
                  setReviewComment('');
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rating
              </label>
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setReviewRating(star)}
                    className="focus:outline-none"
                  >
                    {star <= reviewRating ? (
                      <StarIconSolid className="h-8 w-8 text-yellow-400 hover:text-yellow-500" />
                    ) : (
                      <StarIcon className="h-8 w-8 text-gray-300 hover:text-yellow-400" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Comment
              </label>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Share your experience working with this professional..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 resize-none"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowReviewModal(false);
                  setReviewRating(0);
                  setReviewComment('');
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReview}
                disabled={isSubmittingReview || reviewRating === 0 || !reviewComment.trim()}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isSubmittingReview ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  'Submit Review'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkerProfile;