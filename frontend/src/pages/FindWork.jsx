import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import SEOMetaTags from '../components/common/SEOMetaTags';
import { generateSEOConfig } from '../utils/seoConfig';
import {
  MagnifyingGlassIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  ClockIcon,
  StarIcon,
  FunnelIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';
import { useSelector } from 'react-redux';

const FindWork = () => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [budgetFilter, setBudgetFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Mock job data
  const [jobs] = useState([
    {
      id: 1,
      title: 'Bathroom Renovation',
      description: 'Complete bathroom renovation including plumbing, tiling, and electrical work.',
      category: 'Plumbing',
      location: 'Mumbai, Maharashtra',
      budget: '₹25,000 - ₹35,000',
      duration: '5-7 days',
      postedBy: 'Rajesh Kumar',
      rating: 4.8,
      urgency: 'High',
      skills: ['Plumbing', 'Tiling', 'Electrical'],
      postedDate: '2 hours ago'
    },
    {
      id: 2,
      title: 'House Painting - 3BHK',
      description: 'Interior and exterior painting for a 3BHK apartment. Quality materials provided.',
      category: 'Painting',
      location: 'Delhi, Delhi',
      budget: '₹15,000 - ₹20,000',
      duration: '3-4 days',
      postedBy: 'Priya Sharma',
      rating: 4.9,
      urgency: 'Medium',
      skills: ['Painting', 'Wall Preparation'],
      postedDate: '5 hours ago'
    },
    {
      id: 3,
      title: 'Electrical Wiring Installation',
      description: 'New electrical wiring installation for a 2BHK flat. Safety compliance required.',
      category: 'Electrical',
      location: 'Bangalore, Karnataka',
      budget: '₹12,000 - ₹18,000',
      duration: '2-3 days',
      postedBy: 'Amit Patel',
      rating: 4.7,
      urgency: 'High',
      skills: ['Electrical Wiring', 'Safety Compliance'],
      postedDate: '1 day ago'
    },
    {
      id: 4,
      title: 'Kitchen Cabinet Installation',
      description: 'Custom kitchen cabinet installation with modern fittings and hardware.',
      category: 'Carpentry',
      location: 'Pune, Maharashtra',
      budget: '₹30,000 - ₹40,000',
      duration: '4-5 days',
      postedBy: 'Sneha Reddy',
      rating: 4.6,
      urgency: 'Low',
      skills: ['Carpentry', 'Cabinet Installation'],
      postedDate: '2 days ago'
    },
    {
      id: 5,
      title: 'AC Installation & Service',
      description: 'Installation of 3 split ACs with annual maintenance contract.',
      category: 'AC Technician',
      location: 'Chennai, Tamil Nadu',
      budget: '₹8,000 - ₹12,000',
      duration: '1-2 days',
      postedBy: 'Karthik Iyer',
      rating: 4.8,
      urgency: 'High',
      skills: ['AC Installation', 'Maintenance'],
      postedDate: '3 hours ago'
    },
    {
      id: 6,
      title: 'Garden Landscaping',
      description: 'Complete garden makeover with plants, irrigation system, and decorative elements.',
      category: 'Gardening',
      location: 'Hyderabad, Telangana',
      budget: '₹20,000 - ₹30,000',
      duration: '7-10 days',
      postedBy: 'Meera Gupta',
      rating: 4.5,
      urgency: 'Medium',
      skills: ['Landscaping', 'Irrigation', 'Plant Care'],
      postedDate: '1 day ago'
    }
  ]);

  const categories = [
    'All Categories',
    'Plumbing',
    'Electrical',
    'Painting',
    'Carpentry',
    'AC Technician',
    'Cleaning',
    'Gardening',
    'Appliance Repair',
    'Security'
  ];

  const budgetRanges = [
    'All Budgets',
    'Under ₹10,000',
    '₹10,000 - ₹20,000',
    '₹20,000 - ₹30,000',
    '₹30,000 - ₹50,000',
    'Above ₹50,000'
  ];

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'High': return 'bg-red-100 text-red-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesLocation = !locationFilter || job.location.toLowerCase().includes(locationFilter.toLowerCase());
    const matchesCategory = !categoryFilter || categoryFilter === 'All Categories' || job.category === categoryFilter;
    
    return matchesSearch && matchesLocation && matchesCategory;
  });

  const seoConfig = generateSEOConfig('job-search');

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <SEOMetaTags {...seoConfig} />
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-2xl font-bold text-blue-600">
              WorkLink
            </Link>
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  <span className="text-gray-600">Welcome, {String(user?.firstName || 'User')}</span>
                  <Link 
                    to={user?.userType === 'worker' ? '/worker/dashboard' : '/owner/dashboard'} 
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Dashboard
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-gray-600 hover:text-blue-600">
                    Login
                  </Link>
                  <Link to="/register" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search for jobs, skills, or keywords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Location Filter */}
            <div className="relative">
              <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Location"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="w-full lg:w-48 pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <FunnelIcon className="w-5 h-5" />
              Filters
            </button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Budget Range
                  </label>
                  <select
                    value={budgetFilter}
                    onChange={(e) => setBudgetFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {budgetRanges.map(range => (
                      <option key={range} value={range}>
                        {range}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setLocationFilter('');
                      setCategoryFilter('');
                      setBudgetFilter('');
                    }}
                    className="w-full px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Available Jobs ({filteredJobs.length})
          </h1>
          <div className="flex items-center gap-2">
            <AdjustmentsHorizontalIcon className="w-5 h-5 text-gray-400" />
            <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option>Sort by: Newest</option>
              <option>Sort by: Budget (High to Low)</option>
              <option>Sort by: Budget (Low to High)</option>
              <option>Sort by: Urgency</option>
            </select>
          </div>
        </div>

        {/* Job Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredJobs.map(job => (
            <div key={job.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {job.title}
                  </h3>
                  <p className="text-gray-600 mb-3 line-clamp-2">
                    {job.description}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(job.urgency)}`}>
                  {job.urgency}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {job.skills.map(skill => (
                  <span key={skill} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    {skill}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <MapPinIcon className="w-4 h-4" />
                  {job.location}
                </div>
                <div className="flex items-center gap-1">
                  <CurrencyDollarIcon className="w-4 h-4" />
                  {job.budget}
                </div>
                <div className="flex items-center gap-1">
                  <ClockIcon className="w-4 h-4" />
                  {job.duration}
                </div>
                <div className="flex items-center gap-1">
                  <StarIcon className="w-4 h-4" />
                  {job.rating} rating
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-gray-500">
                  Posted by <span className="font-medium">{job.postedBy}</span> • {job.postedDate}
                </div>
                <div className="flex gap-2">
                  <button className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
                    View Details
                  </button>
                  {isAuthenticated && user?.userType === 'worker' ? (
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      Apply Now
                    </button>
                  ) : (
                    <Link 
                      to="/register" 
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Sign Up to Apply
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* No Results */}
        {filteredJobs.length === 0 && (
          <div className="text-center py-12">
            <MagnifyingGlassIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No jobs found
            </h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search criteria or filters
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setLocationFilter('');
                setCategoryFilter('');
                setBudgetFilter('');
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FindWork;