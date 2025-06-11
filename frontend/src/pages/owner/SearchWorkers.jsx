import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaSearch, FaMapMarkerAlt, FaStar, FaHeart, FaRegHeart } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { workerSearchAPI } from '../../services/api';
import WorkerCard from '../../components/WorkerCard';
import LoadingSpinner from '../../components/LoadingSpinner';

const SearchWorkers = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useState({
    skill: '',
    location: ''
  });
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 0,
    total: 0,
    hasMore: false
  });

  // Handle URL parameters on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const skill = urlParams.get('skill') || '';
    const locationParam = urlParams.get('location') || '';
    
    if (skill || locationParam) {
      setSearchParams({
        skill,
        location: locationParam
      });
      
      // Automatically perform search if parameters are present
      setTimeout(() => {
        handleSearchWithParams({ skill, location: locationParam });
      }, 100);
    }
  }, [location.search]);

  // Helper function to search with specific parameters
  const handleSearchWithParams = async (params, page = 1) => {
    if (!params.skill.trim() && !params.location.trim()) {
      return;
    }

    setLoading(true);
    
    try {
      const searchData = {
        ...params,
        page,
        limit: 20
      };
      
      const response = await workerSearchAPI.searchWorkers(searchData);
      
      if (response.data.success) {
        if (page === 1) {
          setWorkers(response.data.workers);
        } else {
          setWorkers(prev => [...prev, ...response.data.workers]);
        }
        
        setPagination({
          page: response.data.page,
          totalPages: response.data.totalPages,
          total: response.data.total,
          hasMore: response.data.hasMore
        });
        
        setHasSearched(true);
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to search workers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSearchParams(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSearch = async (page = 1) => {
    console.log('handleSearch called with page:', page);
    console.log('searchParams:', searchParams);
    
    if (!searchParams.skill.trim() && !searchParams.location.trim()) {
      toast.error('Please enter either skill or location to search for workers');
      return;
    }

    setLoading(true);
    console.log('Setting loading to true');
    
    try {
      const params = {
        ...searchParams,
        page,
        limit: 20
      };
      
      console.log('API call params:', params);
      const response = await workerSearchAPI.searchWorkers(params);
      console.log('API response:', response);
      
      if (response.data.success) {
        console.log('Search successful, workers found:', response.data.workers.length);
        if (page === 1) {
          setWorkers(response.data.workers);
        } else {
          setWorkers(prev => [...prev, ...response.data.workers]);
        }
        
        setPagination({
          page: response.data.page,
          totalPages: response.data.totalPages,
          total: response.data.total,
          hasMore: response.data.hasMore
        });
        
        setHasSearched(true);
        console.log('State updated successfully');
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to search workers. Please try again.');
    } finally {
      setLoading(false);
      console.log('Setting loading to false');
    }
  };

  const handleLoadMore = () => {
    if (pagination.hasMore && !loading) {
      handleSearch(pagination.page + 1);
    }
  };

  const handleWorkerClick = (workerId) => {
    navigate(`/worker-profile/${workerId}`);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Find Skilled Workers
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Search for workers by skills and location to find the perfect match for your project
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Skills Input */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Skills
              </label>
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  name="skill"
                  value={searchParams.skill}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder="e.g., plumber, graphic designer, electrician"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>
            </div>

            {/* Location Input */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Location
              </label>
              <div className="relative">
                <FaMapMarkerAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  name="location"
                  value={searchParams.location}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder="e.g., Bhubaneswar, Hyderabad"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>
            </div>

            {/* Search Button */}
            <div className="flex items-end">
              <button
                onClick={() => handleSearch()}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <FaSearch />
                    <span>Search Workers</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Results Section */}
        {hasSearched && (
          <div>
            {/* Results Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {pagination.total > 0 ? (
                  `Found ${pagination.total} worker${pagination.total !== 1 ? 's' : ''}`
                ) : (
                  'No workers found in your area'
                )}
              </h2>
            </div>

            {/* Workers Grid */}
            {workers.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                  {workers.map((worker) => (
                    <WorkerCard
                      key={worker._id}
                      worker={worker}
                      onClick={() => handleWorkerClick(worker._id)}
                    />
                  ))}
                </div>

                {/* Load More Button */}
                {pagination.hasMore && (
                  <div className="text-center">
                    <button
                      onClick={handleLoadMore}
                      disabled={loading}
                      className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 text-white font-medium py-3 px-8 rounded-lg transition-colors duration-200"
                    >
                      {loading ? 'Loading...' : 'Load More Workers'}
                    </button>
                  </div>
                )}
              </>
            ) : (
              hasSearched && !loading && (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">
                    <FaSearch />
                  </div>
                  <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                    No workers found in your area
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    Try adjusting your search criteria or expanding your location range
                  </p>
                  <button
                    onClick={() => {
                      setSearchParams({ skill: '', location: '' });
                      setWorkers([]);
                      setHasSearched(false);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200"
                  >
                    Clear Search
                  </button>
                </div>
              )
            )}
          </div>
        )}

        {/* Initial State */}
        {!hasSearched && !loading && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">
              <FaSearch />
            </div>
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
              Start your search
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Enter both skill and location to search for workers. We'll find workers who have the specified skill and are located in your specified area.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchWorkers;