import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Save, Plus, Edit, Trash2, Eye, EyeOff, AlertCircle, CheckCircle, KeyIcon } from 'lucide-react';
import { adminAPI } from '../../services/api';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('faq');
  const [faqs, setFaqs] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // FAQ form state
  const [faqForm, setFaqForm] = useState({
    question: '',
    answer: '',
    category: 'general',
    isActive: true
  });
  const [editingFaq, setEditingFaq] = useState(null);
  
  // Announcement form state
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    content: '',
    type: 'info',
    isActive: true,
    expiresAt: ''
  });
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getSettings();
      
      if (response.data.success) {
        setFaqs(response.data.settings.faqs || []);
        setAnnouncements(response.data.settings.announcements || []);
      } else {
        showMessage('error', response.data.message || 'Failed to load settings');
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      showMessage('error', 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  // FAQ Functions
  const handleFaqSubmit = async (e) => {
    e.preventDefault();
    if (!faqForm.question.trim() || !faqForm.answer.trim()) {
      showMessage('error', 'Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      
      let response;
      if (editingFaq) {
        response = await adminAPI.updateSettings({ type: 'faq', id: editingFaq._id, data: faqForm });
      } else {
        response = await adminAPI.updateSettings({ type: 'faq', data: faqForm });
      }
      
      if (response.data.success) {
        await fetchSettings();
        resetFaqForm();
        showMessage('success', editingFaq ? 'FAQ updated successfully' : 'FAQ added successfully');
      } else {
        showMessage('error', response.data.message || 'Failed to save FAQ');
      }
    } catch (error) {
      console.error('Error saving FAQ:', error);
      showMessage('error', 'Failed to save FAQ');
    } finally {
      setSaving(false);
    }
  };

  const editFaq = (faq) => {
    setFaqForm({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      isActive: faq.isActive
    });
    setEditingFaq(faq);
  };

  const deleteFaq = async (faqId) => {
    if (!window.confirm('Are you sure you want to delete this FAQ?')) return;
    
    try {
      const response = await adminAPI.updateSettings({ type: 'faq', id: faqId, action: 'delete' });
      
      if (response.data.success) {
        await fetchSettings();
        showMessage('success', 'FAQ deleted successfully');
      } else {
        showMessage('error', response.data.message || 'Failed to delete FAQ');
      }
    } catch (error) {
      console.error('Error deleting FAQ:', error);
      showMessage('error', 'Failed to delete FAQ');
    }
  };

  const toggleFaqStatus = async (faqId, currentStatus) => {
    try {
      const response = await adminAPI.updateSettings({ type: 'faq', id: faqId, action: 'toggle' });
      
      if (response.data.success) {
        await fetchSettings();
        showMessage('success', `FAQ ${currentStatus ? 'hidden' : 'published'} successfully`);
      } else {
        showMessage('error', response.data.message || 'Failed to update FAQ status');
      }
    } catch (error) {
      console.error('Error toggling FAQ status:', error);
      showMessage('error', 'Failed to update FAQ status');
    }
  };

  const resetFaqForm = () => {
    setFaqForm({
      question: '',
      answer: '',
      category: 'general',
      isActive: true
    });
    setEditingFaq(null);
  };

  // Announcement Functions
  const handleAnnouncementSubmit = async (e) => {
    e.preventDefault();
    if (!announcementForm.title.trim() || !announcementForm.content.trim()) {
      showMessage('error', 'Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      
      let response;
      if (editingAnnouncement) {
        response = await adminAPI.updateSettings({ type: 'announcement', id: editingAnnouncement._id, data: announcementForm });
      } else {
        response = await adminAPI.updateSettings({ type: 'announcement', data: announcementForm });
      }
      
      if (response.data.success) {
        await fetchSettings();
        resetAnnouncementForm();
        showMessage('success', editingAnnouncement ? 'Announcement updated successfully' : 'Announcement added successfully');
      } else {
        showMessage('error', response.data.message || 'Failed to save announcement');
      }
    } catch (error) {
      console.error('Error saving announcement:', error);
      showMessage('error', 'Failed to save announcement');
    } finally {
      setSaving(false);
    }
  };

  const editAnnouncement = (announcement) => {
    setAnnouncementForm({
      title: announcement.title,
      content: announcement.content,
      type: announcement.type,
      isActive: announcement.isActive,
      expiresAt: announcement.expiresAt ? new Date(announcement.expiresAt).toISOString().split('T')[0] : ''
    });
    setEditingAnnouncement(announcement);
  };

  const deleteAnnouncement = async (announcementId) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;
    
    try {
      const response = await adminAPI.updateSettings({ type: 'announcement', id: announcementId, action: 'delete' });
      
      if (response.data.success) {
        await fetchSettings();
        showMessage('success', 'Announcement deleted successfully');
      } else {
        showMessage('error', response.data.message || 'Failed to delete announcement');
      }
    } catch (error) {
      console.error('Error deleting announcement:', error);
      showMessage('error', 'Failed to delete announcement');
    }
  };

  const toggleAnnouncementStatus = async (announcementId, currentStatus) => {
    try {
      const response = await adminAPI.updateSettings({ type: 'announcement', id: announcementId, action: 'toggle' });
      
      if (response.data.success) {
        await fetchSettings();
        showMessage('success', `Announcement ${currentStatus ? 'hidden' : 'published'} successfully`);
      } else {
        showMessage('error', response.data.message || 'Failed to update announcement status');
      }
    } catch (error) {
      console.error('Error toggling announcement status:', error);
      showMessage('error', 'Failed to update announcement status');
    }
  };

  const resetAnnouncementForm = () => {
    setAnnouncementForm({
      title: '',
      content: '',
      type: 'info',
      isActive: true,
      expiresAt: ''
    });
    setEditingAnnouncement(null);
  };

  const getAnnouncementTypeColor = (type) => {
    switch (type) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">System Settings</h1>
        <p className="text-gray-600 dark:text-gray-300">Manage FAQ and announcements</p>
      </div>

      {/* Message Alert */}
      {message.text && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 
          'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.type === 'success' ? 
            <CheckCircle className="w-5 h-5" /> : 
            <AlertCircle className="w-5 h-5" />
          }
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('faq')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'faq'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              FAQ Management
            </button>
            <button
              onClick={() => setActiveTab('announcements')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'announcements'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              Announcements
            </button>
            <button
              onClick={() => setActiveTab('account')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'account'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              Account Settings
            </button>
          </nav>
        </div>
      </div>

      {/* FAQ Tab */}
      {activeTab === 'faq' && (
        <div className="space-y-6">
          {/* FAQ Form */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {editingFaq ? 'Edit FAQ' : 'Add New FAQ'}
            </h3>
            <form onSubmit={handleFaqSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category
                  </label>
                  <select
                    value={faqForm.category}
                    onChange={(e) => setFaqForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="general">General</option>
                    <option value="workers">For Workers</option>
                    <option value="owners">For Owners</option>
                    <option value="payments">Payments</option>
                    <option value="technical">Technical</option>
                  </select>
                </div>
                <div className="flex items-center">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={faqForm.isActive}
                      onChange={(e) => setFaqForm(prev => ({ ...prev, isActive: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Active</span>
                  </label>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Question *
                </label>
                <input
                  type="text"
                  value={faqForm.question}
                  onChange={(e) => setFaqForm(prev => ({ ...prev, question: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="Enter the question..."
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Answer *
                </label>
                <textarea
                  value={faqForm.answer}
                  onChange={(e) => setFaqForm(prev => ({ ...prev, answer: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="Enter the answer..."
                  required
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : (editingFaq ? 'Update FAQ' : 'Add FAQ')}
                </button>
                {editingFaq && (
                  <button
                    type="button"
                    onClick={resetFaqForm}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* FAQ List */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Existing FAQs</h3>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {faqs.length === 0 ? (
                <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                  No FAQs found. Add your first FAQ above.
                </div>
              ) : (
                faqs.map((faq) => (
                  <div key={faq._id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                            {faq.category}
                          </span>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            faq.isActive ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                          }`}>
                            {faq.isActive ? 'Active' : 'Hidden'}
                          </span>
                        </div>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                          {faq.question}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {faq.answer}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => toggleFaqStatus(faq._id, faq.isActive)}
                          className={`p-1 rounded ${
                            faq.isActive ? 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200' : 'text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300'
                          }`}
                          title={faq.isActive ? 'Hide FAQ' : 'Show FAQ'}
                        >
                          {faq.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => editFaq(faq)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 p-1 rounded"
                          title="Edit FAQ"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteFaq(faq._id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 p-1 rounded"
                          title="Delete FAQ"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Announcements Tab */}
      {activeTab === 'announcements' && (
        <div className="space-y-6">
          {/* Announcement Form */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {editingAnnouncement ? 'Edit Announcement' : 'Add New Announcement'}
            </h3>
            <form onSubmit={handleAnnouncementSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Type
                  </label>
                  <select
                    value={announcementForm.type}
                    onChange={(e) => setAnnouncementForm(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="info">Info</option>
                    <option value="success">Success</option>
                    <option value="warning">Warning</option>
                    <option value="error">Error</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Expires On (Optional)
                  </label>
                  <input
                    type="date"
                    value={announcementForm.expiresAt}
                    onChange={(e) => setAnnouncementForm(prev => ({ ...prev, expiresAt: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div className="flex items-center">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={announcementForm.isActive}
                      onChange={(e) => setAnnouncementForm(prev => ({ ...prev, isActive: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Active</span>
                  </label>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={announcementForm.title}
                  onChange={(e) => setAnnouncementForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="Enter announcement title..."
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Content *
                </label>
                <textarea
                  value={announcementForm.content}
                  onChange={(e) => setAnnouncementForm(prev => ({ ...prev, content: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="Enter announcement content..."
                  required
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : (editingAnnouncement ? 'Update Announcement' : 'Add Announcement')}
                </button>
                {editingAnnouncement && (
                  <button
                    type="button"
                    onClick={resetAnnouncementForm}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Announcements List */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Existing Announcements</h3>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {announcements.length === 0 ? (
                <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                  No announcements found. Add your first announcement above.
                </div>
              ) : (
                announcements.map((announcement) => (
                  <div key={announcement._id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            getAnnouncementTypeColor(announcement.type)
                          }`}>
                            {announcement.type}
                          </span>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            announcement.isActive ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                          }`}>
                            {announcement.isActive ? 'Active' : 'Hidden'}
                          </span>
                          {announcement.expiresAt && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Expires: {formatDate(announcement.expiresAt)}
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                          {announcement.title}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {announcement.content}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => toggleAnnouncementStatus(announcement._id, announcement.isActive)}
                          className={`p-1 rounded ${
                            announcement.isActive ? 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200' : 'text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300'
                          }`}
                          title={announcement.isActive ? 'Hide Announcement' : 'Show Announcement'}
                        >
                          {announcement.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => editAnnouncement(announcement)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 p-1 rounded"
                          title="Edit Announcement"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteAnnouncement(announcement._id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 p-1 rounded"
                          title="Delete Announcement"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Account Settings Tab */}
      {activeTab === 'account' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Account Management
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                    Password Settings
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Change your account password for security
                  </p>
                </div>
                <Link
                  to="/change-password"
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <KeyIcon className="w-4 h-4" />
                  Change Password
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;