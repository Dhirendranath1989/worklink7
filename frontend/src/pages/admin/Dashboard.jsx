import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Users,
  Briefcase,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Eye,
  CheckCircle,
  XCircle,
  UserCheck,
  Ban,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Award
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const AdminDashboard = () => {
  const [stats, setStats] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [owners, setOwners] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [pendingReports, setPendingReports] = useState([]);
  const [popularSkills, setPopularSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('workers');
  const [currentPage, setCurrentPage] = useState({ workers: 1, owners: 1, all: 1 });
  const [totalPages, setTotalPages] = useState({ workers: 1, owners: 1, all: 1 });
  
  const { token } = useSelector((state) => state.auth);
  const { isDarkMode } = useTheme();
  const usersPerPage = 10;

  useEffect(() => {
    fetchDashboardData();
  }, [token]);

  useEffect(() => {
    fetchUsersByType();
  }, [token, activeTab, currentPage]);

  const fetchDashboardData = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      setError('');
      
      // Fetch dashboard stats
      const statsResponse = await fetch('/api/admin/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!statsResponse.ok) {
        throw new Error(`Stats API error: ${statsResponse.status}`);
      }
      
      const statsData = await statsResponse.json();
      console.log('Stats data:', statsData);
      
      // Fetch pending reports
      const reportsResponse = await fetch('/api/admin/reports?status=pending&limit=5', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Note: Reports endpoint might not be implemented yet
      let reportsData = { reports: [] };
      if (reportsResponse.ok) {
        reportsData = await reportsResponse.json();
        console.log('Reports data:', reportsData);
      } else {
        console.log('Reports endpoint not available yet');
      }

      // Fetch popular skills
      const skillsResponse = await fetch('/api/admin/popular-skills', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      let skillsData = { skills: [] };
      if (skillsResponse.ok) {
        skillsData = await skillsResponse.json();
        console.log('Skills data:', skillsData);
      } else {
        console.log('Popular skills endpoint not available yet');
      }

      // Update stats with fetched data (excluding Platform Revenue)
      setStats([
        {
          title: 'Total Users',
          value: statsData.totalUsers || '0',
          change: '+12%',
          changeType: 'positive',
          icon: Users
        },
        {
          title: 'Workers',
          value: statsData.totalWorkers || '0',
          change: '+8%',
          changeType: 'positive',
          icon: Users
        },
        {
          title: 'Owners',
          value: statsData.totalOwners || '0',
          change: '+15%',
          changeType: 'positive',
          icon: Users
        },
        {
          title: 'Pending Reports',
          value: statsData.pendingReports || '0',
          change: '-5%',
          changeType: 'negative',
          icon: AlertTriangle
        }
      ]);
      
      setPendingReports(reportsData.reports || [
        {
          id: 1,
          type: 'User Report',
          reporter: 'John Doe',
          reason: 'Inappropriate behavior',
          severity: 'High',
          createdAt: new Date().toLocaleDateString()
        },
        {
          id: 2,
          type: 'Job Report',
          reporter: 'Jane Smith',
          reason: 'Fake job posting',
          severity: 'Medium',
          createdAt: new Date().toLocaleDateString()
        }
      ]);
      
      setPopularSkills(skillsData.skills || [
        { name: 'Plumbing', count: 45 },
        { name: 'Electrical', count: 38 },
        { name: 'Carpentry', count: 32 },
        { name: 'Painting', count: 28 },
        { name: 'Cleaning', count: 25 }
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsersByType = async () => {
    if (!token) return;
    
    try {
      const page = currentPage[activeTab];
      let userType = 'all';
      if (activeTab === 'workers') userType = 'worker';
      else if (activeTab === 'owners') userType = 'owner';
      
      const response = await fetch(`/api/admin/users?page=${page}&limit=${usersPerPage}&userType=${userType}&sortBy=createdAt&sortOrder=desc`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const users = data.users || [];
        const pagination = data.pagination || {};
        
        if (activeTab === 'workers') {
          setWorkers(users);
        } else if (activeTab === 'owners') {
          setOwners(users);
        } else {
          setAllUsers(users);
        }
        
        setTotalPages(prev => ({
          ...prev,
          [activeTab]: pagination.totalPages || 1
        }));
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/toggle-status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        fetchUsersByType();
        fetchDashboardData(); // Refresh stats
      }
    } catch (error) {
      console.error('Error toggling user status:', error);
    }
  };

  const deleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        const response = await fetch(`/api/admin/users/${userId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          fetchUsersByType();
          fetchDashboardData(); // Refresh stats
        }
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const handleReportAction = async (reportId, action) => {
    try {
      const response = await fetch(`/api/admin/reports/${reportId}/${action}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        fetchDashboardData(); // Refresh reports
      }
    } catch (error) {
      console.error('Error handling report:', error);
    }
  };

  const changePage = (tab, direction) => {
    const newPage = currentPage[tab] + direction;
    if (newPage >= 1 && newPage <= totalPages[tab]) {
      setCurrentPage(prev => ({
        ...prev,
        [tab]: newPage
      }));
    }
  };

  const getCurrentUsers = () => {
    switch (activeTab) {
      case 'workers': return workers;
      case 'owners': return owners;
      case 'all': return allUsers;
      default: return [];
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getUserStatusColor = (isActive, isVerified) => {
    if (!isActive) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    if (isVerified) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
  };

  const getUserStatusText = (isActive, isVerified) => {
    if (!isActive) return 'Blocked';
    if (isVerified) return 'Verified';
    return 'Pending';
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'suspended':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getRoleColor = (role) => {
    switch (role.toLowerCase()) {
      case 'worker':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'owner':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'admin':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className="mb-8">
        <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Admin Dashboard
        </h1>
        <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mt-1`}>
          Monitor and manage the platform.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className={`mb-6 ${isDarkMode ? 'bg-red-900 border-red-700' : 'bg-red-50 border-red-200'} border rounded-lg p-4`}>
          <p className={`${isDarkMode ? 'text-red-200' : 'text-red-800'}`}>{error}</p>
          <button 
            onClick={fetchDashboardData}
            className={`mt-2 ${isDarkMode ? 'text-red-300 hover:text-red-100' : 'text-red-600 hover:text-red-800'} text-sm font-medium`}
          >
            Try Again
          </button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg shadow-sm border p-6`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{stat.title}</p>
                  <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {loading ? '...' : stat.value}
                  </p>
                  <p className={`text-sm ${
                    stat.changeType === 'positive' 
                      ? (isDarkMode ? 'text-green-400' : 'text-green-600') 
                      : (isDarkMode ? 'text-red-400' : 'text-red-600')
                  }`}>
                    {loading ? '...' : stat.change}
                  </p>
                </div>
                <div className={`p-3 ${isDarkMode ? 'bg-blue-900' : 'bg-blue-50'} rounded-lg`}>
                  <Icon className={`h-6 w-6 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* User Management Tables */}
        <div className="lg:col-span-2">
          <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg shadow-sm border`}>
            {/* Tab Navigation */}
            <div className={`px-6 py-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>User Management</h2>
                <Link
                  to="/admin/user-management"
                  className={`${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'} text-sm font-medium`}
                >
                  View all
                </Link>
              </div>
              <div className="flex space-x-1">
                {['workers', 'owners', 'all'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      activeTab === tab
                        ? (isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white')
                        : (isDarkMode ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100')
                    }`}
                  >
                    {tab === 'all' ? 'All Users' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            
            {/* User Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} border-b ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                  <tr>
                    <th className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                      User
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                      Status
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                      Joined
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                  {loading ? (
                    <tr>
                      <td colSpan="4" className={`px-6 py-4 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Loading users...
                      </td>
                    </tr>
                  ) : getCurrentUsers().length === 0 ? (
                    <tr>
                      <td colSpan="4" className={`px-6 py-4 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        No users found
                      </td>
                    </tr>
                  ) : (
                    getCurrentUsers().map((user) => (
                      <tr key={user._id} className={`${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className={`flex-shrink-0 h-10 w-10 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'} rounded-full flex items-center justify-center`}>
                              <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                {user.fullName?.charAt(0) || user.firstName?.charAt(0) || 'U'}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {user.fullName || `${user.firstName} ${user.lastName}`}
                              </div>
                              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{user.email}</div>
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                user.userType === 'worker' 
                                  ? (isDarkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800') 
                                  : (isDarkMode ? 'bg-purple-900 text-purple-200' : 'bg-purple-100 text-purple-800')
                              }`}>
                                {user.userType || user.role}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            getUserStatusColor(user.isActive, user.isVerified)
                          }`}>
                            {getUserStatusText(user.isActive, user.isVerified)}
                          </span>
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => toggleUserStatus(user._id, user.isActive)}
                              className={`p-1 rounded ${
                                user.isActive
                                  ? (isDarkMode ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-900')
                                  : (isDarkMode ? 'text-green-400 hover:text-green-300' : 'text-green-600 hover:text-green-900')
                              }`}
                              title={user.isActive ? 'Block User' : 'Unblock User'}
                            >
                              {user.isActive ? <Ban className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => deleteUser(user._id)}
                              className={`p-1 rounded ${isDarkMode ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-900'}`}
                              title="Delete User"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <Link 
                              to="/admin/user-management"
                              className={`p-1 rounded ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'}`}
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {totalPages[activeTab] > 1 && (
              <div className={`px-4 py-3 flex items-center justify-between border-t ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'} sm:px-6`}>
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => changePage(activeTab, -1)}
                    disabled={currentPage[activeTab] === 1}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md ${
                      isDarkMode 
                        ? 'border-gray-600 text-gray-300 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed'
                        : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                    }`}
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => changePage(activeTab, 1)}
                    disabled={currentPage[activeTab] === totalPages[activeTab]}
                    className={`ml-3 relative inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md ${
                      isDarkMode 
                        ? 'border-gray-600 text-gray-300 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed'
                        : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                    }`}
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Page <span className="font-medium">{currentPage[activeTab]}</span> of{' '}
                      <span className="font-medium">{totalPages[activeTab]}</span>
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => changePage(activeTab, -1)}
                        disabled={currentPage[activeTab] === 1}
                        className={`relative inline-flex items-center px-2 py-2 rounded-l-md border text-sm font-medium ${
                          isDarkMode 
                            ? 'border-gray-600 bg-gray-700 text-gray-400 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed'
                            : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                        }`}
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => changePage(activeTab, 1)}
                        disabled={currentPage[activeTab] === totalPages[activeTab]}
                        className={`relative inline-flex items-center px-2 py-2 rounded-r-md border text-sm font-medium ${
                          isDarkMode 
                            ? 'border-gray-600 bg-gray-700 text-gray-400 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed'
                            : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                        }`}
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Popular Skills */}
          <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg shadow-sm border`}>
            <div className={`px-6 py-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} flex items-center`}>
                <Award className={`h-5 w-5 mr-2 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
                Popular Skills
              </h2>
            </div>
            <div className="p-6">
              {loading ? (
                <div className={`text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Loading skills...
                </div>
              ) : popularSkills.length === 0 ? (
                <div className={`text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  No skills data available
                </div>
              ) : (
                <div className="space-y-3">
                  {popularSkills.map((skill, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {skill.name}
                      </span>
                      <div className="flex items-center">
                        <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mr-2`}>
                          {skill.count}
                        </span>
                        <div className={`w-16 h-2 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full`}>
                          <div 
                            className={`h-2 ${isDarkMode ? 'bg-blue-500' : 'bg-blue-600'} rounded-full`}
                            style={{ width: `${(skill.count / Math.max(...popularSkills.map(s => s.count))) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Pending Reports */}
          <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg shadow-sm border`}>
            <div className={`px-6 py-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} flex items-center`}>
                  <AlertTriangle className={`h-5 w-5 mr-2 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
                  Pending Reports
                </h2>
                <Link
                  to="/admin/reports"
                  className={`${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'} text-sm font-medium`}
                >
                  View all
                </Link>
              </div>
            </div>
            <div className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {loading ? (
                <div className={`px-6 py-8 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Loading pending reports...
                </div>
              ) : pendingReports.length === 0 ? (
                <div className={`px-6 py-8 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  No pending reports
                </div>
              ) : (
                pendingReports.map((report) => (
                  <div key={report.id} className={`px-6 py-4 ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{report.type}</h3>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mt-1`}>Reporter: {report.reporter}</p>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Reason: {report.reason}</p>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                          {report.createdAt instanceof Date 
                            ? report.createdAt.toLocaleDateString()
                            : report.createdAt
                          }
                        </p>
                      </div>
                      <div className="flex flex-col items-end space-y-2 ml-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          getSeverityColor(report.severity)
                        }`}>
                          {report.severity}
                        </span>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleReportAction(report.id, 'approve')}
                            className={`p-1 rounded ${isDarkMode ? 'text-green-400 hover:text-green-300' : 'text-green-600 hover:text-green-500'}`}
                            title="Approve Report"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleReportAction(report.id, 'reject')}
                            className={`p-1 rounded ${isDarkMode ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-500'}`}
                            title="Reject Report"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                          <Link 
                            to="/admin/reports"
                            className={`p-1 rounded ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'}`}
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className={`mt-8 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg shadow-sm border p-6`}>
        <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Link
            to="/admin/user-management"
            className={`flex items-center p-4 rounded-lg border transition-colors ${
              isDarkMode 
                ? 'border-gray-600 hover:bg-gray-700 hover:border-gray-500' 
                : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
            }`}
          >
            <Users className={`h-6 w-6 mr-3 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            <div>
              <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Manage Users</p>
              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>View and manage user accounts</p>
            </div>
          </Link>
          <Link
            to="/admin/reports"
            className={`flex items-center p-4 rounded-lg border transition-colors ${
              isDarkMode 
                ? 'border-gray-600 hover:bg-gray-700 hover:border-gray-500' 
                : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
            }`}
          >
            <AlertTriangle className={`h-6 w-6 mr-3 ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`} />
            <div>
              <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Handle Reports</p>
              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Review user reports</p>
            </div>
          </Link>
          <Link
            to="/admin/analytics"
            className={`flex items-center p-4 rounded-lg border transition-colors ${
              isDarkMode 
                ? 'border-gray-600 hover:bg-gray-700 hover:border-gray-500' 
                : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
            }`}
          >
            <TrendingUp className={`h-6 w-6 mr-3 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
            <div>
              <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Analytics</p>
              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>View platform insights</p>
            </div>
          </Link>
          <Link
            to="/admin/settings"
            className={`flex items-center p-4 rounded-lg border transition-colors ${
              isDarkMode 
                ? 'border-gray-600 hover:bg-gray-700 hover:border-gray-500' 
                : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
            }`}
          >
            <Calendar className={`h-6 w-6 mr-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
            <div>
              <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Settings</p>
              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Manage FAQ and announcements</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;