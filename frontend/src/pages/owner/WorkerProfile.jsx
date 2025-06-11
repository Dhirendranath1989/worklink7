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
  FaEye
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import { workerSearchAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';

const WorkerProfile = () => {
  const { workerId } = useParams();
  const navigate = useNavigate();
  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    fetchWorkerProfile();
  }, [workerId]);

  useEffect(() => {
    if (activeTab === 'posts') {
      fetchWorkerPosts();
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
        setPosts(response.data.posts);
      }
    } catch (error) {
      console.error('Error fetching worker posts:', error);
      toast.error('Failed to load worker posts');
    } finally {
      setPostsLoading(false);
    }
  };

  const handleSaveToggle = async () => {
    try {
      if (isSaved) {
        // Remove from saved workers
        setIsSaved(false);
        toast.success('Worker removed from favorites');
      } else {
        // Save worker
        setIsSaved(true);
        toast.success('Worker saved to favorites');
      }
    } catch (error) {
      console.error('Error toggling save:', error);
      toast.error('Failed to update favorites');
    }
  };

  const handleContact = () => {
    // Implement chat functionality
    toast.info('Chat functionality will be implemented');
  };

  const handleReview = () => {
    // Implement review functionality
    toast.info('Review functionality will be implemented');
  };

  const handleHire = () => {
    // Implement hire functionality
    toast.info('Hire functionality will be implemented');
  };

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

  const formatLocation = (location) => {
    if (!location) return 'Location not specified';
    
    const parts = [];
    if (location.address) parts.push(location.address);
    if (location.city) parts.push(location.city);
    if (location.state) parts.push(location.state);
    if (location.zipCode) parts.push(location.zipCode);
    
    return parts.length > 0 ? parts.join(', ') : 'Location not specified';
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FaBriefcase },
    { id: 'photos', label: 'Work Photos', icon: FaEye },
    { id: 'documents', label: 'Documents', icon: FaDownload },
    { id: 'posts', label: 'Posts', icon: FaComment }
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
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            Back to Search
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate('/search-workers')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <FaArrowLeft className="mr-2" />
            Back to Search
          </button>
          
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center space-x-4">
              {/* Profile Photo */}
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200">
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
                    <span className="text-white text-2xl font-bold">
                      {worker.name?.charAt(0)?.toUpperCase() || 'W'}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Basic Info */}
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-3xl font-bold text-gray-900">{worker.name}</h1>
                  {worker.isVerified && (
                    <FaCheckCircle className="text-blue-500 text-xl" title="Verified Worker" />
                  )}
                </div>
                
                {/* Rating */}
                <div className="flex items-center mt-2">
                  <div className="flex items-center space-x-1">
                    {renderStars(worker.averageRating || 0)}
                  </div>
                  <span className="ml-2 text-lg font-medium text-gray-900">
                    {worker.averageRating ? worker.averageRating.toFixed(1) : '0.0'}
                  </span>
                  <span className="ml-1 text-gray-600">
                    ({worker.totalReviews || 0} reviews)
                  </span>
                </div>
                
                {/* Location */}
                <div className="flex items-center mt-2 text-gray-600">
                  <FaMapMarkerAlt className="mr-2" />
                  <span>{formatLocation(worker.location)}</span>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 mt-4 lg:mt-0">
              <button
                onClick={handleContact}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <FaComment />
                <span>Contact</span>
              </button>
              
              <button
                onClick={handleReview}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <FaStar />
                <span>Review</span>
              </button>
              
              <button
                onClick={handleHire}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <FaBriefcase />
                <span>Hire Now</span>
              </button>
              
              <button
                onClick={handleSaveToggle}
                className={`px-6 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                  isSaved
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
              >
                {isSaved ? <FaHeart /> : <FaRegHeart />}
                <span>{isSaved ? 'Saved' : 'Save'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200 mt-6">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
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
            <WorkPhotosTab worker={worker} />
          )}
          
          {activeTab === 'documents' && (
            <DocumentsTab worker={worker} />
          )}
          
          {activeTab === 'posts' && (
            <PostsTab posts={posts} loading={postsLoading} />
          )}
        </div>
      </div>
    </div>
  );
};

// Overview Tab Component
const OverviewTab = ({ worker }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Main Info */}
      <div className="lg:col-span-2 space-y-6">
        {/* Bio */}
        {worker.bio && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">About</h3>
            <p className="text-gray-700 leading-relaxed">{worker.bio}</p>
          </div>
        )}
        
        {/* Skills */}
        {worker.skills && worker.skills.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills</h3>
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
        {worker.workExperience && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Work Experience</h3>
            <p className="text-gray-700 leading-relaxed">{worker.workExperience}</p>
          </div>
        )}
      </div>
      
      {/* Sidebar */}
      <div className="space-y-6">
        {/* Contact Info */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
          <div className="space-y-3">
            {worker.email && (
              <div className="flex items-center text-gray-600">
                <FaEnvelope className="mr-3 text-gray-400" />
                <span>{worker.email}</span>
              </div>
            )}
            {worker.phone && (
              <div className="flex items-center text-gray-600">
                <FaPhone className="mr-3 text-gray-400" />
                <span>{worker.phone}</span>
              </div>
            )}
            {worker.website && (
              <div className="flex items-center text-gray-600">
                <FaGlobe className="mr-3 text-gray-400" />
                <a href={worker.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  {worker.website}
                </a>
              </div>
            )}
          </div>
        </div>
        
        {/* Pricing & Availability */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing & Availability</h3>
          <div className="space-y-3">
            {worker.hourlyRate && (
              <div>
                <span className="text-gray-600">Hourly Rate:</span>
                <div className="text-2xl font-bold text-green-600">₹{worker.hourlyRate}/hr</div>
              </div>
            )}
            {worker.availability && (
              <div>
                <span className="text-gray-600">Availability:</span>
                <div className="text-gray-900 font-medium">{worker.availability}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Work Photos Tab Component
const WorkPhotosTab = ({ worker }) => {
  if (!worker.workPhotos || worker.workPhotos.length === 0) {
    return (
      <div className="text-center py-12">
        <FaEye className="mx-auto text-gray-400 text-6xl mb-4" />
        <h3 className="text-xl font-medium text-gray-900 mb-2">No work photos available</h3>
        <p className="text-gray-600">This worker hasn't uploaded any work photos yet.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {worker.workPhotos.map((photo, index) => (
        <div key={index} className="bg-white rounded-lg shadow-sm overflow-hidden">
          <img
            src={photo}
            alt={`Work photo ${index + 1}`}
            className="w-full h-64 object-cover"
            onError={(e) => {
              e.target.src = '/api/placeholder/400/300';
            }}
          />
        </div>
      ))}
    </div>
  );
};

// Documents Tab Component
const DocumentsTab = ({ worker }) => {
  if (!worker.certificates || worker.certificates.length === 0) {
    return (
      <div className="text-center py-12">
        <FaDownload className="mx-auto text-gray-400 text-6xl mb-4" />
        <h3 className="text-xl font-medium text-gray-900 mb-2">No documents available</h3>
        <p className="text-gray-600">This worker hasn't uploaded any certificates or documents yet.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {worker.certificates.map((cert, index) => (
        <div key={index} className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-center">
            <FaDownload className="mx-auto text-gray-400 text-4xl mb-4" />
            <h4 className="font-medium text-gray-900 mb-2">Certificate {index + 1}</h4>
            <a
              href={cert}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              View Document
            </a>
          </div>
        </div>
      ))}
    </div>
  );
};

// Posts Tab Component
const PostsTab = ({ posts, loading }) => {
  if (loading) {
    return (
      <div className="text-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <div className="text-center py-12">
        <FaComment className="mx-auto text-gray-400 text-6xl mb-4" />
        <h3 className="text-xl font-medium text-gray-900 mb-2">No posts available</h3>
        <p className="text-gray-600">This worker hasn't shared any posts yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {posts.map((post, index) => (
        <div key={index} className="bg-white rounded-lg shadow-sm p-6">
          <h4 className="font-medium text-gray-900 mb-2">{post.title}</h4>
          <p className="text-gray-700">{post.content}</p>
          <div className="mt-4 text-sm text-gray-500">
            {new Date(post.createdAt).toLocaleDateString()}
          </div>
        </div>
      ))}
    </div>
  );
};

export default WorkerProfile;