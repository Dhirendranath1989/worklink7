import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setUserType } from '../../features/auth/authSlice';
import { UserIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline';

const Onboarding = () => {
  const [selectedType, setSelectedType] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleTypeSelection = (type) => {
    setSelectedType(type);
  };

  const handleContinue = () => {
    if (selectedType) {
      dispatch(setUserType(selectedType));
      navigate('/complete-profile');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Welcome to WorkLink!
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Let's get you started. What best describes you?
          </p>
        </div>

        <div className="mt-8 space-y-4">
          <div
            onClick={() => handleTypeSelection('owner')}
            className={`relative cursor-pointer rounded-lg border p-6 shadow-sm focus:outline-none ${
              selectedType === 'owner'
                ? 'border-blue-500 ring-2 ring-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserIcon className={`h-8 w-8 ${
                  selectedType === 'owner' ? 'text-blue-600' : 'text-gray-400'
                }`} />
              </div>
              <div className="ml-4">
                <h3 className={`text-lg font-medium ${
                  selectedType === 'owner' ? 'text-blue-900' : 'text-gray-900'
                }`}>
                  I'm a Business Owner
                </h3>
                <p className={`text-sm ${
                  selectedType === 'owner' ? 'text-blue-700' : 'text-gray-500'
                }`}>
                  I need to hire skilled workers for my projects
                </p>
              </div>
            </div>
            {selectedType === 'owner' && (
              <div className="absolute top-4 right-4">
                <div className="h-4 w-4 rounded-full bg-blue-600 flex items-center justify-center">
                  <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            )}
          </div>

          <div
            onClick={() => handleTypeSelection('worker')}
            className={`relative cursor-pointer rounded-lg border p-6 shadow-sm focus:outline-none ${
              selectedType === 'worker'
                ? 'border-blue-500 ring-2 ring-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <WrenchScrewdriverIcon className={`h-8 w-8 ${
                  selectedType === 'worker' ? 'text-blue-600' : 'text-gray-400'
                }`} />
              </div>
              <div className="ml-4">
                <h3 className={`text-lg font-medium ${
                  selectedType === 'worker' ? 'text-blue-900' : 'text-gray-900'
                }`}>
                  I'm a Skilled Worker
                </h3>
                <p className={`text-sm ${
                  selectedType === 'worker' ? 'text-blue-700' : 'text-gray-500'
                }`}>
                  I want to find work opportunities and showcase my skills
                </p>
              </div>
            </div>
            {selectedType === 'worker' && (
              <div className="absolute top-4 right-4">
                <div className="h-4 w-4 rounded-full bg-blue-600 flex items-center justify-center">
                  <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8">
          <button
            onClick={handleContinue}
            disabled={!selectedType}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;