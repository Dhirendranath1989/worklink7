import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  UserGroupIcon,
  BriefcaseIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState('overview');

  const stats = [
    {
      name: 'Total Users',
      value: '2,847',
      icon: UserGroupIcon,
      change: '+12%',
      changeType: 'positive'
    },
    {
      name: 'Active Jobs',
      value: '156',
      icon: BriefcaseIcon,
      change: '+8%',
      changeType: 'positive'
    },
    {
      name: 'Platform Revenue',
      value: '$45,231',
      icon: CurrencyDollarIcon,
      change: '+15%',
      changeType: 'positive'
    },
    {
      name: 'Pending Reports',
      value: '23',
      icon: ExclamationTriangleIcon,
      change: '-5%',
      changeType: 'negative'
    }
  ];

  const recentUsers = [
    {
      id: 1,
      name: 'John Smith',
      email: 'john@example.com',
      role: 'worker',
      status: 'active',
      joinedAt: '2024-01-10',
      verified: true
    },
    {
      id: 2,
      name: 'Sarah Johnson',
      email: 'sarah@example.com',
      role: 'owner',
      status: 'active',
      joinedAt: '2024-01-09',
      verified: false
    },
    {
      id: 3,
      name: 'Mike Davis',
      email: 'mike@example.com',
      role: 'worker',
      status: 'suspended',
      joinedAt: '2024-01-08',
      verified: true
    }
  ];

  const pendingReports = [
    {
      id: 1,
      type: 'User Report',
      reporter: 'Jane Doe',
      reported: 'John Smith',
      reason: 'Inappropriate behavior',
      createdAt: '2 hours ago',
      severity: 'high'
    },
    {
      id: 2,
      type: 'Job Report',
      reporter: 'Mike Wilson',
      reported: 'Fake Job Posting',
      reason: 'Fraudulent job posting',
      createdAt: '5 hours ago',
      severity: 'medium'
    },
    {
      id: 3,
      type: 'Payment Dispute',
      reporter: 'Alice Brown',
      reported: 'Payment Issue',
      reason: 'Payment not received',
      createdAt: '1 day ago',
      severity: 'low'
    }
  ];

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleColor = (role) => {
    switch (role.toLowerCase()) {
      case 'worker':
        return 'bg-blue-100 text-blue-800';
      case 'owner':
        return 'bg-purple-100 text-purple-800';
      case 'admin':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Admin Dashboard
        </h1>
        <p className="text-gray-600 mt-1">
          Monitor and manage the platform.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Icon className="h-8 w-8 text-primary-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                </div>
              </div>
              <div className="mt-4">
                <span className={`text-sm font-medium ${
                  stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.change}
                </span>
                <span className="text-sm text-gray-500 ml-1">from last month</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Users */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent Users</h2>
              <Link
                to="/admin/users"
                className="text-primary-600 hover:text-primary-500 text-sm font-medium"
              >
                View all
              </Link>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {recentUsers.map((user) => (
              <div key={user.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h3 className="text-sm font-medium text-gray-900">{user.name}</h3>
                      {user.verified && (
                        <ShieldCheckIcon className="h-4 w-4 text-green-500 ml-2" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    <p className="text-sm text-gray-500">Joined: {user.joinedAt}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      getRoleColor(user.role)
                    }`}>
                      {user.role}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      getStatusColor(user.status)
                    }`}>
                      {user.status}
                    </span>
                    <button className="text-primary-600 hover:text-primary-500">
                      <EyeIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Reports */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Pending Reports</h2>
              <Link
                to="/admin/reports"
                className="text-primary-600 hover:text-primary-500 text-sm font-medium"
              >
                View all
              </Link>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {pendingReports.map((report) => (
              <div key={report.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900">{report.type}</h3>
                    <p className="text-sm text-gray-600">Reporter: {report.reporter}</p>
                    <p className="text-sm text-gray-600">Reason: {report.reason}</p>
                    <p className="text-sm text-gray-500">{report.createdAt}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      getSeverityColor(report.severity)
                    }`}>
                      {report.severity}
                    </span>
                    <div className="flex space-x-1">
                      <button className="text-green-600 hover:text-green-500">
                        <CheckCircleIcon className="h-5 w-5" />
                      </button>
                      <button className="text-red-600 hover:text-red-500">
                        <XCircleIcon className="h-5 w-5" />
                      </button>
                      <button className="text-primary-600 hover:text-primary-500">
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

      {/* Quick Actions */}
      <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Link
            to="/admin/users"
            className="flex items-center p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <UserGroupIcon className="h-6 w-6 text-primary-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-900">Manage Users</p>
              <p className="text-sm text-gray-600">View and moderate users</p>
            </div>
          </Link>
          <Link
            to="/admin/jobs"
            className="flex items-center p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <BriefcaseIcon className="h-6 w-6 text-primary-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-900">Manage Jobs</p>
              <p className="text-sm text-gray-600">Monitor job postings</p>
            </div>
          </Link>
          <Link
            to="/admin/reports"
            className="flex items-center p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <ExclamationTriangleIcon className="h-6 w-6 text-primary-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-900">Handle Reports</p>
              <p className="text-sm text-gray-600">Review user reports</p>
            </div>
          </Link>
          <Link
            to="/admin/analytics"
            className="flex items-center p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <ChartBarIcon className="h-6 w-6 text-primary-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-900">Analytics</p>
              <p className="text-sm text-gray-600">View platform metrics</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;