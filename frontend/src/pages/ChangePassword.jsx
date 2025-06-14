import React from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import ChangePassword from '../components/ChangePassword';

const ChangePasswordPage = () => {
  const { user } = useSelector((state) => state.auth);
  
  // Determine if user has a password (for Google users who might not have one)
  const userHasPassword = user?.hasPassword === true;
  
  // Determine the dashboard route based on user type
  const getDashboardRoute = () => {
    const userType = user?.userType || user?.role;
    switch (userType) {
      case 'admin':
        return '/admin/dashboard';
      case 'owner':
        return '/owner/dashboard';
      case 'worker':
      default:
        return '/worker/dashboard';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to={getDashboardRoute()}
            className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors duration-200 mb-4"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Dashboard
          </Link>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Account Security
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your account password and security settings
            </p>
          </div>
        </div>

        {/* Password Change Component */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <ChangePassword userHasPassword={userHasPassword} />
        </div>

        {/* Security Tips */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
            Password Security Tips
          </h3>
          <ul className="space-y-2 text-blue-800 dark:text-blue-200">
            <li className="flex items-start">
              <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              Use at least 8 characters with a mix of letters, numbers, and symbols
            </li>
            <li className="flex items-start">
              <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              Avoid using personal information like your name or birthdate
            </li>
            <li className="flex items-start">
              <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              Don't reuse passwords from other accounts
            </li>
            <li className="flex items-start">
              <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              Consider using a password manager for better security
            </li>
          </ul>
        </div>

        {/* Account Type Info */}
        {user && (
          <div className="mt-6 bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Account Type
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                  {user.userType || user.role || 'Worker'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Login Method
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {userHasPassword ? 'Email & Password' : 'Social Login'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChangePasswordPage;