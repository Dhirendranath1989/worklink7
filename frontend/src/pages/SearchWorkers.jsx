import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { MagnifyingGlassIcon, MapPinIcon, HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { searchWorkers, saveSearch } from '../features/jobs/jobsSlice';
import { saveWorker, removeSavedWorker, checkIfWorkerSaved } from '../features/savedWorkers/savedWorkersSlice';
import { toast } from 'react-hot-toast';

const SearchWorkers = () => {
  const dispatch = useDispatch();
  const { searchResults, loading } = useSelector((state) => state.jobs);
  const { checkedWorkers } = useSelector((state) => state.savedWorkers);
  const { user } = useSelector((state) => state.auth);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    location: '',
    skills: [],
    rating: 0,
    experience: '',
    availability: 'all'
  });

  // Check saved status for all search results
  useEffect(() => {
    if (searchResults && searchResults.length > 0 && user) {
      searchResults.forEach(worker => {
        if (!checkedWorkers[worker.id]) {
          dispatch(checkIfWorkerSaved(worker.id));
        }
      });
    }
  }, [searchResults, user, dispatch, checkedWorkers]);

  const handleSaveWorker = async (workerId) => {
    if (!user) {
      toast.error('Please log in to save workers');
      return;
    }

    try {
      const isSaved = checkedWorkers[workerId];
      if (isSaved) {
        await dispatch(removeSavedWorker(workerId)).unwrap();
        toast.success('Worker removed from saved list');
      } else {
        await dispatch(saveWorker(workerId)).unwrap();
        toast.success('Worker saved successfully');
      }
    } catch (error) {
      toast.error('Failed to update saved worker');
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    try {
      const searchParams = {
        skills: searchQuery,
        location: filters.location,
        minRate: filters.minRate,
        maxRate: filters.maxRate
      };
      await dispatch(searchWorkers(searchParams)).unwrap();
    } catch (error) {
      toast.error('Search failed. Please try again.');
    }
  };

  const handleSaveSearch = async () => {
    try {
      await dispatch(saveSearch({ query: searchQuery, filters })).unwrap();
      toast.success('Search saved successfully!');
    } catch (error) {
      toast.error('Failed to save search.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Find Skilled Workers</h1>
        <p className="text-gray-600">Search for qualified professionals in your area</p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="bg-white rounded-lg shadow-sm border p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Skills
            </label>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g., electrician, plumber, carpenter"
                className="pl-10 w-full rounded-lg border-gray-300 focus:border-primary-500 focus:ring-primary-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <div className="relative">
              <MapPinIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={filters.location}
                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                placeholder="City, State"
                className="pl-10 w-full rounded-lg border-gray-300 focus:border-primary-500 focus:ring-primary-500"
              />
            </div>
          </div>
          

        </div>
        
        <div className="flex flex-wrap gap-4 items-end">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
          >
            {loading ? 'Searching...' : 'Search Workers'}
          </button>
          
          <button
            type="button"
            onClick={handleSaveSearch}
            className="btn-outline"
          >
            Save Search
          </button>
        </div>
      </form>

      {/* Search Results */}
      {searchResults && searchResults.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {searchResults.map((worker) => (
            <div key={worker._id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-center mb-4">
                <img
                  src={worker.profilePicture 
                    ? (worker.profilePicture.startsWith('http') 
                        ? worker.profilePicture 
                        : `http://localhost:5000${worker.profilePicture}`)
                    : '/default-avatar.png'
                  }
                  alt={worker.name}
                  className="w-12 h-12 rounded-full object-cover mr-3"
                  onError={(e) => {
                    e.target.src = '/default-avatar.png';
                  }}
                />
                <div>
                  <h3 className="font-semibold text-gray-900">{worker.name}</h3>
                  <p className="text-sm text-gray-600">{worker.title || worker.profession || 'Professional'}</p>
                </div>
              </div>
              

              
              <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                {worker.description || worker.bio || 'No description available'}
              </p>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {worker.skills?.slice(0, 3).map((skill, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-primary-100 text-primary-800 text-xs rounded-full"
                  >
                    {skill}
                  </span>
                ))}
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">
                  ₹{worker.hourlyRate}/hr
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSaveWorker(worker.id)}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                    title={checkedWorkers[worker.id] ? 'Remove from saved' : 'Save worker'}
                  >
                    {checkedWorkers[worker.id] ? (
                      <HeartSolidIcon className="h-5 w-5 text-red-500" />
                    ) : (
                      <HeartIcon className="h-5 w-5 text-gray-400 hover:text-red-500" />
                    )}
                  </button>
                  <button className="btn-primary text-sm px-4 py-2">
                    View Profile
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {searchResults && searchResults.length === 0 && (
        <div className="text-center py-12">
          <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No workers found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search criteria or location.
          </p>
        </div>
      )}
    </div>
  );
};

export default SearchWorkers;