import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Menu, Transition } from '@headlessui/react';
import {
  Cog6ToothIcon,
  KeyIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';

const SettingsDropdown = ({ isScrolled }) => {
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({
    username: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const { user } = useSelector((state) => state.auth);

  const isGoogleUser = user?.authProvider === 'google' || user?.googleId;
  const hasPassword = user?.hasPassword || false;
  const isFirstTimeGoogleUser = isGoogleUser && !hasPassword;
  
  // Don't show settings for Google users who already have passwords
  if (isGoogleUser && hasPassword) {
    return null;
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    // Validation for first-time Google users
    if (isFirstTimeGoogleUser) {
      if (!passwordData.username.trim()) {
        setMessage({ type: 'error', text: 'Username is required' });
        setLoading(false);
        return;
      }
      if (passwordData.username.length < 3) {
        setMessage({ type: 'error', text: 'Username must be at least 3 characters' });
        setLoading(false);
        return;
      }
    }

    // Validation for existing users with passwords (non-Google users only)
    if (!isGoogleUser && !passwordData.currentPassword) {
      setMessage({ type: 'error', text: 'Current password is required' });
      setLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'New password must be at least 6 characters' });
      setLoading(false);
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const payload = {
        newPassword: passwordData.newPassword
      };

      // Include username for first-time Google users
      if (isFirstTimeGoogleUser) {
        payload.username = passwordData.username;
      }

      // Include current password for non-Google users only
      if (!isGoogleUser) {
        payload.currentPassword = passwordData.currentPassword;
      }

      await axios.put('http://localhost:5000/api/users/change-password', payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const successMessage = isFirstTimeGoogleUser 
        ? 'Account setup completed successfully!' 
        : 'Password updated successfully!';
      
      setMessage({ type: 'success', text: successMessage });
      setPasswordData({ username: '', currentPassword: '', newPassword: '', confirmPassword: '' });
      
      // Close modal after 2 seconds
      setTimeout(() => {
        setIsPasswordModalOpen(false);
        setMessage({ type: '', text: '' });
      }, 2000);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to update password' 
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const resetModal = () => {
    setPasswordData({ username: '', currentPassword: '', newPassword: '', confirmPassword: '' });
    setShowPasswords({ current: false, new: false, confirm: false });
    setMessage({ type: '', text: '' });
    setIsPasswordModalOpen(false);
  };

  const getModalTitle = () => {
    return isFirstTimeGoogleUser ? 'Complete Account Setup' : 'Change Password';
  };

  const getButtonText = () => {
    return isFirstTimeGoogleUser ? 'Complete Setup' : 'Update Password';
  };

  return (
    <>
      <Menu as="div" className="relative">
        <Menu.Button className={`flex items-center space-x-2 p-2 rounded-lg transition-colors ${
          isScrolled 
            ? 'text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400' 
            : 'text-white hover:text-primary-200'
        }`}>
          <Cog6ToothIcon className="h-5 w-5" />
          <span className="text-sm font-medium">Settings</span>
        </Menu.Button>
        
        <Transition
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Items className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 dark:ring-gray-600 focus:outline-none">
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={() => setIsPasswordModalOpen(true)}
                  className={`${
                    active ? 'bg-gray-50 dark:bg-gray-700' : ''
                  } flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700`}
                >
                  {isFirstTimeGoogleUser ? (
                    <UserIcon className="mr-3 h-4 w-4" />
                  ) : (
                    <KeyIcon className="mr-3 h-4 w-4" />
                  )}
                  {isFirstTimeGoogleUser ? 'Complete Setup' : 'Change Password'}
                </button>
              )}
            </Menu.Item>
          </Menu.Items>
        </Transition>
      </Menu>

      {/* Password Change Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={resetModal}></div>
            
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handlePasswordChange}>
                <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-primary-100 dark:bg-primary-900 sm:mx-0 sm:h-10 sm:w-10">
                      {isFirstTimeGoogleUser ? (
                        <UserIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                      ) : (
                        <KeyIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                      )}
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">
                        {getModalTitle()}
                      </h3>
                      {isFirstTimeGoogleUser && (
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                          Please create a username and password to complete your account setup.
                        </p>
                      )}
                      <div className="mt-4 space-y-4">
                        {isFirstTimeGoogleUser && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Username
                            </label>
                            <input
                              type="text"
                              value={passwordData.username}
                              onChange={(e) => setPasswordData(prev => ({ ...prev, username: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                              placeholder="Enter your preferred username"
                              required
                              minLength={3}
                            />
                          </div>
                        )}
                        
                        {!isGoogleUser && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Current Password
                            </label>
                            <div className="relative">
                              <input
                                type={showPasswords.current ? 'text' : 'password'}
                                value={passwordData.currentPassword}
                                onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white pr-10"
                                required
                              />
                              <button
                                type="button"
                                onClick={() => togglePasswordVisibility('current')}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                              >
                                {showPasswords.current ? (
                                  <EyeSlashIcon className="h-4 w-4 text-gray-400" />
                                ) : (
                                  <EyeIcon className="h-4 w-4 text-gray-400" />
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {isFirstTimeGoogleUser ? 'Password' : 'New Password'}
                          </label>
                          <div className="relative">
                            <input
                              type={showPasswords.new ? 'text' : 'password'}
                              value={passwordData.newPassword}
                              onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white pr-10"
                              required
                              minLength={6}
                            />
                            <button
                              type="button"
                              onClick={() => togglePasswordVisibility('new')}
                              className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            >
                              {showPasswords.new ? (
                                <EyeSlashIcon className="h-4 w-4 text-gray-400" />
                              ) : (
                                <EyeIcon className="h-4 w-4 text-gray-400" />
                              )}
                            </button>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Confirm New Password
                          </label>
                          <div className="relative">
                            <input
                              type={showPasswords.confirm ? 'text' : 'password'}
                              value={passwordData.confirmPassword}
                              onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white pr-10"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => togglePasswordVisibility('confirm')}
                              className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            >
                              {showPasswords.confirm ? (
                                <EyeSlashIcon className="h-4 w-4 text-gray-400" />
                              ) : (
                                <EyeIcon className="h-4 w-4 text-gray-400" />
                              )}
                            </button>
                          </div>
                        </div>
                        
                        {message.text && (
                          <div className={`flex items-center space-x-2 p-3 rounded-md ${
                            message.type === 'success' 
                              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                              : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                          }`}>
                            {message.type === 'success' ? (
                              <CheckCircleIcon className="h-5 w-5" />
                            ) : (
                              <XCircleIcon className="h-5 w-5" />
                            )}
                            <span className="text-sm">{message.text}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (isFirstTimeGoogleUser ? 'Setting up...' : 'Updating...') : getButtonText()}
                  </button>
                  <button
                    type="button"
                    onClick={resetModal}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SettingsDropdown;