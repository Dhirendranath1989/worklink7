import React, { useState, useEffect } from 'react';
import { Disclosure, Transition } from '@headlessui/react';
import { ChevronDownIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useSelector } from 'react-redux';
import { adminAPI } from '../services/api';

const FAQ = () => {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newFaq, setNewFaq] = useState({ question: '', answer: '', category: 'general' });
  const [saving, setSaving] = useState(false);
  const { isDarkMode } = useSelector((state) => state.theme) || { isDarkMode: false };
  const { user } = useSelector((state) => state.auth) || {};

  useEffect(() => {
    fetchFaqs();
  }, []);

  const fetchFaqs = async () => {
    try {
      setLoading(true);
      // Update the URL to use port 5000 for the backend
      const response = await fetch('http://localhost:5000/api/public/faq');
      const data = await response.json();
      
      if (data.success) {
        setFaqs(data.settings.faqs || []);
      } else {
        setError('Failed to load FAQs');
      }
    } catch (error) {
      console.error('Error fetching FAQs:', error);
      setError('Failed to load FAQs. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFaq = async (e) => {
    e.preventDefault();
    if (!newFaq.question.trim() || !newFaq.answer.trim()) {
      setError('Question and answer are required');
      return;
    }

    try {
      setSaving(true);
      setError('');
      const response = await adminAPI.updateSettings({
        type: 'faq',
        data: {
          question: newFaq.question,
          answer: newFaq.answer,
          category: newFaq.category,
          isActive: true
        }
      });

      if (response.data.success) {
        setNewFaq({ question: '', answer: '', category: 'general' });
        setShowCreateForm(false);
        fetchFaqs(); // Refresh the FAQ list
      } else {
        setError(response.data.message || 'Failed to create FAQ');
      }
    } catch (error) {
      console.error('Error creating FAQ:', error);
      setError('Failed to create FAQ. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const isAdmin = user && user.role === 'admin';

  // Get unique categories from FAQs
  const categories = ['all', ...new Set(faqs.map(faq => faq.category))];

  // Filter FAQs by active category
  const filteredFaqs = activeCategory === 'all' 
    ? faqs
    : faqs.filter(faq => faq.category === activeCategory);

  // Only show active FAQs
  const activeFaqs = filteredFaqs.filter(faq => faq.isActive);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 sm:px-6 lg:px-8">
        <div className={`p-4 rounded-md ${isDarkMode ? 'bg-red-900/20 text-red-200' : 'bg-red-50 text-red-800'}`}>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-24 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h1 className={`text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Frequently Asked Questions</h1>
        <p className={`mt-4 text-xl ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          Find answers to common questions about WorkLink
        </p>
        
        {/* Admin Create FAQ Button */}
        {isAdmin && (
          <div className="mt-6">
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${isDarkMode ? 'focus:ring-offset-gray-900' : 'focus:ring-offset-white'}`}
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
              {showCreateForm ? 'Cancel' : 'Create FAQ'}
            </button>
          </div>
        )}
      </div>

      {/* Create FAQ Form */}
      {isAdmin && showCreateForm && (
        <div className={`mb-8 p-6 rounded-lg ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} shadow-sm`}>
          <h2 className={`text-lg font-medium mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Create New FAQ</h2>
          <form onSubmit={handleCreateFaq} className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Category
              </label>
              <select
                value={newFaq.category}
                onChange={(e) => setNewFaq({ ...newFaq, category: e.target.value })}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
              >
                <option value="general">General</option>
                <option value="account">Account</option>
                <option value="payment">Payment</option>
                <option value="technical">Technical</option>
                <option value="support">Support</option>
              </select>
            </div>
            
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Question
              </label>
              <input
                type="text"
                value={newFaq.question}
                onChange={(e) => setNewFaq({ ...newFaq, question: e.target.value })}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                placeholder="Enter the FAQ question"
                required
              />
            </div>
            
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Answer
              </label>
              <textarea
                value={newFaq.answer}
                onChange={(e) => setNewFaq({ ...newFaq, answer: e.target.value })}
                rows={4}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                placeholder="Enter the FAQ answer"
                required
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewFaq({ question: '', answer: '', category: 'general' });
                  setError('');
                }}
                className={`px-4 py-2 text-sm font-medium rounded-md ${isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className={`px-4 py-2 text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed ${isDarkMode ? 'focus:ring-offset-gray-900' : 'focus:ring-offset-white'}`}
              >
                {saving ? 'Creating...' : 'Create FAQ'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Category Tabs */}
      {categories.length > 1 && (
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeCategory === category
                  ? isDarkMode 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-primary-100 text-primary-800'
                  : isDarkMode 
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' 
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      )}

      {/* FAQ List */}
      <div className="space-y-6">
        {activeFaqs.length === 0 ? (
          <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            No FAQs available in this category.
          </div>
        ) : (
          activeFaqs.map((faq) => (
            <Disclosure as="div" key={faq.id || faq._id} className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm rounded-lg overflow-hidden`}>
              {({ open }) => (
                <>
                  <Disclosure.Button className={`w-full px-6 py-4 text-left flex justify-between items-center ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                    <span className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {faq.question}
                    </span>
                    <ChevronDownIcon
                      className={`${open ? 'transform rotate-180' : ''} w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} transition-transform duration-200`}
                    />
                  </Disclosure.Button>
                  <Transition
                    enter="transition duration-100 ease-out"
                    enterFrom="transform scale-95 opacity-0"
                    enterTo="transform scale-100 opacity-100"
                    leave="transition duration-75 ease-out"
                    leaveFrom="transform scale-100 opacity-100"
                    leaveTo="transform scale-95 opacity-0"
                  >
                    <Disclosure.Panel className={`px-6 py-4 ${isDarkMode ? 'text-gray-300 border-t border-gray-700' : 'text-gray-600 border-t border-gray-100'}`}>
                      <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: faq.answer }} />
                    </Disclosure.Panel>
                  </Transition>
                </>
              )}
            </Disclosure>
          ))
        )}
      </div>
    </div>
  );
};

export default FAQ;