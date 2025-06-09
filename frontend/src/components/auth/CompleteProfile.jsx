import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setProfileCompleted } from '../../features/auth/authSlice';
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';

const CompleteProfile = () => {
  const { user, userType } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [ownerData, setOwnerData] = useState({
    name: '',
    profilePhoto: null,
    address: '',
    pincode: '',
    email: user?.email || '',
    mobile: ''
  });

  const [workerData, setWorkerData] = useState({
    fullName: '',
    skills: [],
    workExperience: '',
    certificates: [],
    workPhotos: [],
    availabilityStatus: 'online',
    address: '',
    pincode: '',
    languages: []
  });

  const [skillInput, setSkillInput] = useState('');
  const [languageInput, setLanguageInput] = useState('');
  const [errors, setErrors] = useState({});

  const handleOwnerChange = (e) => {
    const { name, value } = e.target;
    setOwnerData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleWorkerChange = (e) => {
    const { name, value } = e.target;
    setWorkerData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileUpload = (e, type) => {
    const files = Array.from(e.target.files);
    
    if (type === 'profilePhoto') {
      setOwnerData(prev => ({
        ...prev,
        profilePhoto: files[0]
      }));
    } else if (type === 'certificates') {
      setWorkerData(prev => ({
        ...prev,
        certificates: [...prev.certificates, ...files]
      }));
    } else if (type === 'workPhotos') {
      setWorkerData(prev => ({
        ...prev,
        workPhotos: [...prev.workPhotos, ...files]
      }));
    }
  };

  const addSkill = () => {
    if (skillInput.trim() && !workerData.skills.includes(skillInput.trim())) {
      setWorkerData(prev => ({
        ...prev,
        skills: [...prev.skills, skillInput.trim()]
      }));
      setSkillInput('');
    }
  };

  const removeSkill = (skillToRemove) => {
    setWorkerData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const addLanguage = () => {
    if (languageInput.trim() && !workerData.languages.includes(languageInput.trim())) {
      setWorkerData(prev => ({
        ...prev,
        languages: [...prev.languages, languageInput.trim()]
      }));
      setLanguageInput('');
    }
  };

  const removeLanguage = (languageToRemove) => {
    setWorkerData(prev => ({
      ...prev,
      languages: prev.languages.filter(lang => lang !== languageToRemove)
    }));
  };

  const removeFile = (index, type) => {
    if (type === 'certificates') {
      setWorkerData(prev => ({
        ...prev,
        certificates: prev.certificates.filter((_, i) => i !== index)
      }));
    } else if (type === 'workPhotos') {
      setWorkerData(prev => ({
        ...prev,
        workPhotos: prev.workPhotos.filter((_, i) => i !== index)
      }));
    }
  };

  const validateOwnerForm = () => {
    const newErrors = {};
    
    if (!ownerData.name.trim()) newErrors.name = 'Name is required';
    if (!ownerData.address.trim()) newErrors.address = 'Address is required';
    if (!ownerData.pincode.trim()) newErrors.pincode = 'Pincode is required';
    if (!ownerData.mobile.trim()) newErrors.mobile = 'Mobile number is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateWorkerForm = () => {
    const newErrors = {};
    
    if (!workerData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (workerData.skills.length === 0) newErrors.skills = 'At least one skill is required';
    if (!workerData.workExperience.trim()) newErrors.workExperience = 'Work experience is required';
    if (!workerData.address.trim()) newErrors.address = 'Address is required';
    if (!workerData.pincode.trim()) newErrors.pincode = 'Pincode is required';
    if (workerData.languages.length === 0) newErrors.languages = 'At least one language is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const isValid = userType === 'owner' ? validateOwnerForm() : validateWorkerForm();
    
    if (!isValid) return;
    
    // Save profile data to localStorage
    const profileData = userType === 'owner' ? ownerData : workerData;
    const updatedUser = {
      ...user,
      userType,
      profileData,
      profileCompleted: true
    };
    
    localStorage.setItem('user', JSON.stringify(updatedUser));
    dispatch(setProfileCompleted(true));
    
    // Navigate to dashboard
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900">
            Complete Your Profile
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {userType === 'owner' 
              ? 'Tell us about your business to get started'
              : 'Showcase your skills and experience to attract clients'
            }
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white shadow rounded-lg p-6">
          {Object.keys(errors).length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              {Object.values(errors).map((error, index) => (
                <p key={index} className="text-sm text-red-600">{error}</p>
              ))}
            </div>
          )}

          {userType === 'owner' ? (
            // Owner Form
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700">Name *</label>
                <input
                  type="text"
                  name="name"
                  value={ownerData.name}
                  onChange={handleOwnerChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Profile Photo</label>
                <div className="mt-1 flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {ownerData.profilePhoto ? (
                      <img
                        src={URL.createObjectURL(ownerData.profilePhoto)}
                        alt="Profile"
                        className="h-16 w-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center">
                        <PhotoIcon className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'profilePhoto')}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Address *</label>
                <textarea
                  name="address"
                  value={ownerData.address}
                  onChange={handleOwnerChange}
                  rows={3}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your business address"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Pincode *</label>
                  <input
                    type="text"
                    name="pincode"
                    value={ownerData.pincode}
                    onChange={handleOwnerChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter pincode"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Mobile Number *</label>
                  <input
                    type="tel"
                    name="mobile"
                    value={ownerData.mobile}
                    onChange={handleOwnerChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter mobile number"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  name="email"
                  value={ownerData.email}
                  onChange={handleOwnerChange}
                  disabled
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500"
                />
              </div>
            </>
          ) : (
            // Worker Form
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name *</label>
                <input
                  type="text"
                  name="fullName"
                  value={workerData.fullName}
                  onChange={handleWorkerChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Skills *</label>
                <div className="mt-1 flex space-x-2">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                    className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Add a skill (e.g., electrician, plumber)"
                  />
                  <button
                    type="button"
                    onClick={addSkill}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {workerData.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Work Experience *</label>
                <textarea
                  name="workExperience"
                  value={workerData.workExperience}
                  onChange={handleWorkerChange}
                  rows={4}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe your work experience, companies worked for, freelancing history..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Certificates / Licenses</label>
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileUpload(e, 'certificates')}
                  className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <div className="mt-2 space-y-2">
                  {workerData.certificates.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <span className="text-sm text-gray-600">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeFile(index, 'certificates')}
                        className="text-red-600 hover:text-red-800"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Previous Work Photos</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'workPhotos')}
                  className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {workerData.workPhotos.map((file, index) => (
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Work ${index + 1}`}
                        className="h-20 w-full object-cover rounded"
                      />
                      <button
                        type="button"
                        onClick={() => removeFile(index, 'workPhotos')}
                        className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1"
                      >
                        <XMarkIcon className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Availability Status</label>
                <select
                  name="availabilityStatus"
                  value={workerData.availabilityStatus}
                  onChange={handleWorkerChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="online">Online</option>
                  <option value="offline">Offline</option>
                  <option value="busy">Busy</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Address *</label>
                  <textarea
                    name="address"
                    value={workerData.address}
                    onChange={handleWorkerChange}
                    rows={2}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Pincode *</label>
                  <input
                    type="text"
                    name="pincode"
                    value={workerData.pincode}
                    onChange={handleWorkerChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter pincode"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Languages Spoken *</label>
                <div className="mt-1 flex space-x-2">
                  <input
                    type="text"
                    value={languageInput}
                    onChange={(e) => setLanguageInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLanguage())}
                    className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Add a language (e.g., English, Hindi)"
                  />
                  <button
                    type="button"
                    onClick={addLanguage}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {workerData.languages.map((language, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"
                    >
                      {language}
                      <button
                        type="button"
                        onClick={() => removeLanguage(language)}
                        className="ml-2 text-green-600 hover:text-green-800"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="pt-6">
            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Complete Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompleteProfile;