import React from 'react';
import { Link } from 'react-router-dom';
import {
  UserGroupIcon,
  MagnifyingGlassIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  StarIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

const HowItWorks = () => {
  const steps = [
    {
      id: 1,
      title: 'Sign Up & Create Profile',
      description: 'Register as a worker or job owner. Complete your profile with skills, experience, and portfolio.',
      icon: UserGroupIcon,
      color: 'bg-blue-500'
    },
    {
      id: 2,
      title: 'Search & Connect',
      description: 'Browse available jobs or skilled workers. Use filters to find the perfect match.',
      icon: MagnifyingGlassIcon,
      color: 'bg-green-500'
    },
    {
      id: 3,
      title: 'Communicate & Negotiate',
      description: 'Chat directly with potential matches. Discuss requirements, timeline, and pricing.',
      icon: ChatBubbleLeftRightIcon,
      color: 'bg-purple-500'
    },
    {
      id: 4,
      title: 'Complete & Review',
      description: 'Work gets done safely and efficiently. Rate and review each other for future reference.',
      icon: CheckCircleIcon,
      color: 'bg-orange-500'
    }
  ];

  const features = [
    {
      title: 'Verified Professionals',
      description: 'All workers go through a verification process including skill assessment and background checks.',
      icon: ShieldCheckIcon
    },
    {
      title: 'Quality Assurance',
      description: 'Rating and review system ensures high-quality work and reliable service.',
      icon: StarIcon
    },
    {
      title: 'Secure Payments',
      description: 'Safe and secure payment processing with escrow protection for both parties.',
      icon: CheckCircleIcon
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-2xl font-bold text-blue-600">
              WorkLink
            </Link>
            <div className="flex space-x-4">
              <Link to="/login" className="text-gray-600 hover:text-blue-600">
                Login
              </Link>
              <Link to="/register" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            How WorkLink Works
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
            Connecting skilled workers with job opportunities in just a few simple steps
          </p>
        </div>
      </div>

      {/* Steps Section */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Simple Process, Amazing Results
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our platform makes it easy to find work or hire skilled professionals
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.id} className="relative">
                  {/* Connection Line */}
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-16 left-full w-full h-0.5 bg-gray-300 z-0" />
                  )}
                  
                  <div className="relative bg-white rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow">
                    <div className={`${step.color} w-12 h-12 rounded-full flex items-center justify-center mb-4 mx-auto`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-semibold text-gray-500 mb-2">
                        STEP {step.id}
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-3">
                        {step.title}
                      </h3>
                      <p className="text-gray-600">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose WorkLink?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We provide a safe, reliable, and efficient platform for all your work needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="text-center">
                  <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto">
                    <Icon className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of workers and job owners who trust WorkLink for their professional needs
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/register" 
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Sign Up as Worker
            </Link>
            <Link 
              to="/register" 
              className="bg-white text-gray-900 px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Post a Job
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2024 WorkLink. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HowItWorks;