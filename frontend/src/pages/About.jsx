import React from 'react';
import { Link } from 'react-router-dom';
import SEOMetaTags from '../components/common/SEOMetaTags';
import { generateSEOConfig } from '../utils/seoConfig';
import {
  UserGroupIcon,
  ShieldCheckIcon,
  ClockIcon,
  CurrencyDollarIcon,
  StarIcon,
  CheckCircleIcon,
  HeartIcon,
  LightBulbIcon,
  TrophyIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';

const About = () => {
  const stats = [
    { label: 'Active Workers', value: '10,000+', icon: UserGroupIcon },
    { label: 'Jobs Completed', value: '50,000+', icon: CheckCircleIcon },
    { label: 'Cities Covered', value: '100+', icon: MapPinIcon },
    { label: 'Customer Satisfaction', value: '4.8/5', icon: StarIcon }
  ];

  const values = [
    {
      icon: ShieldCheckIcon,
      title: 'Trust & Safety',
      description: 'All workers are verified with background checks and skill assessments to ensure quality and safety.'
    },
    {
      icon: ClockIcon,
      title: 'Quick Response',
      description: 'Get connected with skilled workers within hours, not days. Emergency services available 24/7.'
    },
    {
      icon: CurrencyDollarIcon,
      title: 'Fair Pricing',
      description: 'Transparent pricing with no hidden costs. Compare quotes and choose what works best for you.'
    },
    {
      icon: StarIcon,
      title: 'Quality Assurance',
      description: 'Rating and review system ensures high-quality work. Money-back guarantee on unsatisfactory work.'
    }
  ];

  const team = [
    {
      name: 'Tanaya Kara',
      role: 'Founder',
      image: '/api/placeholder/150/150',
      description: 'Former tech executive with 15+ years in building scalable platforms.'
    },
    {
      name: 'Dhirendranath Thakur',
      role: 'Head of Operations',
      image: '/api/placeholder/150/150',
      description: 'Expert in service operations and quality management with 12+ years experience.'
    },
    {
      name: 'Jaydev Kara',
      role: 'Head of Technology',
      image: '/api/placeholder/150/150',
      description: 'Full-stack developer and architect passionate about solving real-world problems.'
    },
    {
      name: 'Jayanti Thakur',
      role: 'Head of Customer Success',
      image: '/api/placeholder/150/150',
      description: 'Customer experience specialist focused on building lasting relationships.'
    }
  ];

  const milestones = [
    {
      year: '2020',
      title: 'Company Founded',
      description: 'Started with a vision to connect skilled workers with property owners seamlessly.'
    },
    {
      year: '2021',
      title: 'First 1000 Workers',
      description: 'Reached our first milestone of 1000 verified workers across 10 cities.'
    },
    {
      year: '2022',
      title: 'Mobile App Launch',
      description: 'Launched mobile applications for both Android and iOS platforms.'
    },
    {
      year: '2023',
      title: '50,000 Jobs Completed',
      description: 'Celebrated completing 50,000+ successful jobs with 4.8+ average rating.'
    },
    {
      year: '2024',
      title: 'AI-Powered Matching',
      description: 'Introduced AI-powered worker-job matching for better success rates.'
    }
  ];

  const seoConfig = generateSEOConfig('about');

  return (
    <div className="min-h-screen bg-white">
      <SEOMetaTags {...seoConfig} />
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-2xl font-bold text-blue-600">
              WorkLink
            </Link>
            <div className="flex items-center space-x-4">
              <Link to="/find-work" className="text-gray-600 hover:text-blue-600">
                Find Work
              </Link>
              <Link to="/post-work" className="text-gray-600 hover:text-blue-600">
                Post Work
              </Link>
              <Link to="/how-it-works" className="text-gray-600 hover:text-blue-600">
                How It Works
              </Link>
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
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              About <span className="text-blue-600">WorkLink</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              We're on a mission to revolutionize how property owners connect with skilled workers, 
              making home services more accessible, reliable, and affordable for everyone.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/register" 
                className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Join Our Platform
              </Link>
              <Link 
                to="/how-it-works" 
                className="border border-blue-600 text-blue-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-50 transition-colors"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <stat.icon className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Our Story */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  WorkLink was born out of a simple frustration: finding reliable, skilled workers for home 
                  maintenance and improvement projects was unnecessarily difficult and time-consuming.
                </p>
                <p>
                  Our founders experienced firsthand the challenges of connecting with trustworthy professionals 
                  who could deliver quality work at fair prices. Traditional methods often involved word-of-mouth 
                  recommendations, lengthy searches, and uncertainty about pricing and quality.
                </p>
                <p>
                  We envisioned a platform that would bridge this gap, creating a seamless ecosystem where 
                  property owners could easily find skilled workers, and workers could access a steady stream 
                  of opportunities to grow their businesses.
                </p>
                <p>
                  Today, WorkLink has grown into India's leading platform for home services, connecting thousands 
                  of skilled professionals with property owners across the country.
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="bg-blue-600 rounded-lg p-8 text-white">
                <LightBulbIcon className="w-16 h-16 mb-6" />
                <h3 className="text-2xl font-bold mb-4">Our Vision</h3>
                <p className="text-blue-100">
                  To become the most trusted platform for home services in India, empowering skilled workers 
                  and making quality home maintenance accessible to every property owner.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Our Values */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Values</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              These core values guide everything we do and shape how we serve our community
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div key={index} className="text-center">
                <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <value.icon className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Journey</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Key milestones in our mission to transform the home services industry
            </p>
          </div>
          <div className="relative">
            <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-blue-200"></div>
            <div className="space-y-12">
              {milestones.map((milestone, index) => (
                <div key={index} className={`flex items-center ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}>
                  <div className={`w-1/2 ${index % 2 === 0 ? 'pr-8 text-right' : 'pl-8 text-left'}`}>
                    <div className="bg-white rounded-lg shadow-md p-6">
                      <div className="text-blue-600 font-bold text-lg mb-2">{milestone.year}</div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{milestone.title}</h3>
                      <p className="text-gray-600">{milestone.description}</p>
                    </div>
                  </div>
                  <div className="relative z-10">
                    <div className="w-4 h-4 bg-blue-600 rounded-full border-4 border-white shadow"></div>
                  </div>
                  <div className="w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Meet Our Team</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              The passionate individuals working to make WorkLink the best platform for home services
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <div key={index} className="text-center">
                <div className="w-32 h-32 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <UserGroupIcon className="w-16 h-16 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-1">{member.name}</h3>
                <div className="text-blue-600 font-medium mb-2">{member.role}</div>
                <p className="text-gray-600 text-sm">{member.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Impact Section */}
      <div className="py-16 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <HeartIcon className="w-16 h-16 text-white mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-white mb-6">Making a Difference</h2>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto mb-8">
            Beyond connecting workers and property owners, we're building a community that supports 
            skill development, fair wages, and economic empowerment for thousands of families.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-white">
            <div>
              <TrophyIcon className="w-12 h-12 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">₹50+ Crores</h3>
              <p className="text-blue-100">Earned by workers on our platform</p>
            </div>
            <div>
              <UserGroupIcon className="w-12 h-12 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">5000+</h3>
              <p className="text-blue-100">Workers trained and certified</p>
            </div>
            <div>
              <CheckCircleIcon className="w-12 h-12 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">98%</h3>
              <p className="text-blue-100">Customer satisfaction rate</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Ready to Join WorkLink?</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Whether you're a skilled worker looking for opportunities or a property owner needing 
            reliable services, WorkLink is here to help you succeed.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/register?type=worker" 
              className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Join as Worker
            </Link>
            <Link 
              to="/register?type=owner" 
              className="border border-blue-600 text-blue-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Join as Property Owner
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-bold text-blue-400 mb-4">WorkLink</h3>
              <p className="text-gray-300 mb-4">
                Connecting skilled workers with property owners across India.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-300 hover:text-white">
                  <span className="sr-only">Facebook</span>
                  📘
                </a>
                <a href="#" className="text-gray-300 hover:text-white">
                  <span className="sr-only">Twitter</span>
                  🐦
                </a>
                <a href="#" className="text-gray-300 hover:text-white">
                  <span className="sr-only">LinkedIn</span>
                  💼
                </a>
              </div>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">For Workers</h4>
              <ul className="space-y-2 text-gray-300">
                <li><Link to="/find-work" className="hover:text-white">Find Work</Link></li>
                <li><Link to="/register" className="hover:text-white">Sign Up</Link></li>
                <li><a href="#" className="hover:text-white">Worker Resources</a></li>
                <li><a href="#" className="hover:text-white">Training Programs</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">For Property Owners</h4>
              <ul className="space-y-2 text-gray-300">
                <li><Link to="/post-work" className="hover:text-white">Post Work</Link></li>
                <li><Link to="/register" className="hover:text-white">Sign Up</Link></li>
                <li><a href="#" className="hover:text-white">Safety Guidelines</a></li>
                <li><a href="#" className="hover:text-white">Pricing Guide</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Contact Us</a></li>
                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-300">
            <p>&copy; 2025 WorkLink. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default About;