import React from 'react';
import { Link } from 'react-router-dom';
import SEOMetaTags from '../components/common/SEOMetaTags';
import { generateSEOConfig } from '../utils/seoConfig';
import {
  MagnifyingGlassIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  ClockIcon,
  StarIcon,
  MapPinIcon,
  CheckCircleIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

const Home = () => {
  const features = [
    {
      icon: MagnifyingGlassIcon,
      title: 'Smart Matching',
      description: 'Our AI-powered system matches you with the perfect workers or jobs based on skills, location, and preferences.',
    },
    {
      icon: ShieldCheckIcon,
      title: 'Verified Profiles',
      description: 'All workers go through our verification process including skill tests, background checks, and reviews.',
    },
    {
      icon: ClockIcon,
      title: 'Real-time Updates',
      description: 'Get instant notifications for job matches and updates. Stay connected 24/7.',
    },
    {
      icon: UserGroupIcon,
      title: 'Community Driven',
      description: 'Join thousands of satisfied workers and owners. Build your reputation through reviews and ratings.',
    },
  ];

  const stats = [
    { label: 'Active Workers', value: '50,000+' },
    { label: 'Jobs Completed', value: '100,000+' },
    { label: 'Cities Covered', value: '500+' },
    { label: 'Customer Rating', value: '4.8/5' },
  ];

  const popularSkills = [
    'Electrician', 'Plumber', 'Carpenter', 'Painter', 'AC Repair',
    'Home Cleaning', 'Gardening', 'Appliance Repair', 'Tile Work', 'Pest Control'
  ];

  const testimonials = [
    {
      name: 'Rajesh Kumar',
      role: 'Electrician',
      location: 'Mumbai',
      rating: 5,
      comment: 'WorkLink helped me find consistent work and build my client base. The platform is easy to use and payments are always on time.',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    },
    {
      name: 'Priya Sharma',
      role: 'Homeowner',
      location: 'Delhi',
      rating: 5,
      comment: 'Found an amazing carpenter through WorkLink. The quality of work was excellent and the whole process was seamless.',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    },
    {
      name: 'Amit Patel',
      role: 'Plumber',
      location: 'Bangalore',
      rating: 5,
      comment: 'The best platform for skilled workers. Great support team and fair pricing. Highly recommended!',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    },
  ];

  const seoConfig = generateSEOConfig('home');

  return (
    <div className="min-h-screen">
      <SEOMetaTags {...seoConfig} />
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-600 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.1%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[80vh]">
            {/* Left Content */}
            <div className="text-white">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                Connecting
                <span className="text-accent-400"> Skills </span>
                with
                <span className="text-accent-400"> Needs</span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-100 mb-8 leading-relaxed">
                Find skilled local workers or discover your next opportunity. 
                Join India's fastest-growing platform for local services.
              </p>
              
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link
                  to="/register?type=owner"
                  className="btn-primary text-lg px-8 py-4 text-center"
                >
                  Find Workers
                  <ArrowRightIcon className="ml-2 h-5 w-5" />
                </Link>
                <Link
                  to="/register?type=worker"
                  className="btn-secondary text-lg px-8 py-4 text-center border-2 border-white text-white hover:bg-white hover:text-primary-600"
                >
                  Find Work
                </Link>
              </div>

              {/* Quick Search */}
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <p className="text-sm text-gray-200 mb-3">Popular searches:</p>
                <div className="flex flex-wrap gap-2">
                  {popularSkills.slice(0, 5).map((skill) => (
                    <Link
                      key={skill}
                      to={`/workers?skill=${skill.toLowerCase()}`}
                      className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-full text-sm text-white transition-colors"
                    >
                      {skill}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Content - Hero Image/Illustration */}
            <div className="relative">
              <div className="relative z-10">
                <img
                  src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&h=600&fit=crop"
                  alt="Workers collaborating"
                  className="rounded-2xl shadow-2xl"
                />
                {/* Floating Cards */}
                <div className="absolute -top-4 -left-4 bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">1.6 Lakh Workers Registered</span>
                  </div>
                </div>
                <div className="absolute -bottom-4 -right-4 bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-2">
                    <StarIcon className="h-5 w-5 text-yellow-400 fill-current" />
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">4.8 Rating</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary-600 dark:text-primary-400 mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600 dark:text-gray-300 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Why Choose WorkLink?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              We're revolutionizing how local services work with cutting-edge technology 
              and a commitment to quality.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center group">
                <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-primary-200 dark:group-hover:bg-primary-800/50 transition-colors">
                  <feature.icon className="h-8 w-8 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Get started in just a few simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* For Owners */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-8 text-center">
                For Property Owners
              </h3>
              <div className="space-y-6">
                {[
                  { step: 1, title: 'Post Your Requirement', desc: 'Describe your job with photos, budget, and timeline' },
                  { step: 2, title: 'Get Matched', desc: 'Receive proposals from verified workers in your area' },
                  { step: 3, title: 'Choose & Connect', desc: 'Review profiles and hire the best worker' },
                  { step: 4, title: 'Get Work Done', desc: 'Track progress and make secure payments' },
                ].map((item) => (
                  <div key={item.step} className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-primary-600 dark:bg-primary-500 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {item.step}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{item.title}</h4>
                      <p className="text-gray-600 dark:text-gray-300">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* For Workers */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-8 text-center">
                For Workers
              </h3>
              <div className="space-y-6">
                {[
                  { step: 1, title: 'Create Your Profile', desc: 'Showcase your skills, experience, and portfolio' },
                  { step: 2, title: 'Get Verified', desc: 'Complete skill tests and verification process' },
                  { step: 3, title: 'Receive Job Alerts', desc: 'Get notified about relevant opportunities nearby' },
                  { step: 4, title: 'Grow Your Business', desc: 'Build reputation and earn more with great reviews' },
                ].map((item) => (
                  <div key={item.step} className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-secondary-600 dark:bg-secondary-500 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {item.step}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{item.title}</h4>
                      <p className="text-gray-600 dark:text-gray-300">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              What Our Users Say
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Join thousands of satisfied workers and owners
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center mb-4">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover mr-4"
                  />
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">{testimonial.name}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{testimonial.role}</p>
                    <div className="flex items-center mt-1">
                      <MapPinIcon className="h-3 w-3 text-gray-400 dark:text-gray-500 mr-1" />
                      <span className="text-xs text-gray-500 dark:text-gray-400">{testimonial.location}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center mb-3">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <StarIcon key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 dark:text-gray-300 italic">"{testimonial.comment}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-secondary-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-gray-100 mb-8">
            Join WorkLink today and experience the future of local services
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register?type=worker"
              className="btn-secondary bg-white text-primary-600 hover:bg-gray-100 text-lg px-8 py-4"
            >
              Start as Worker
            </Link>
            <Link
              to="/register?type=owner"
              className="btn-primary bg-accent-500 hover:bg-accent-600 text-lg px-8 py-4"
            >
              Hire Workers
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;