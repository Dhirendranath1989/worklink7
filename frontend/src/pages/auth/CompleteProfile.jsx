import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { setProfileCompleted, setCredentials, logout } from '../../features/auth/authSlice';
import api from '../../services/api';
import { userService } from '../../services/userService';
import { auth, uploadFile } from '../../services/firebase';

const CompleteProfile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated, token } = useSelector((state) => state.auth);
  
  // Debug logging
  console.log('CompleteProfile - User state:', user);
  console.log('CompleteProfile - Is authenticated:', isAuthenticated);
  console.log('CompleteProfile - Token exists:', !!token);
  console.log('CompleteProfile - Token value:', token);
  console.log('CompleteProfile - localStorage token:', localStorage.getItem('token'));
  console.log('CompleteProfile - localStorage user:', localStorage.getItem('user'));
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated || !user) {
      console.log('User not authenticated, redirecting to login');
      navigate('/login');
      return;
    }
  }, [isAuthenticated, user, navigate]);
  
  const [userType, setUserType] = useState('');
  const [formData, setFormData] = useState({
    // Common fields
    fullName: user?.fullName || (user?.firstName && user?.lastName ? user.firstName + ' ' + user.lastName : '') || '',
    email: user?.email || auth.currentUser?.email || '',
    mobile: user?.mobile || '',
    address: user?.address || '',
    pincode: user?.pincode || '',
    profilePhoto: null,
    
    // Owner specific
    businessName: '',
    
    // Worker specific
    skills: [],
    workExperience: {
      duration: '',
      companies: '',
      freelancingHistory: ''
    },
    certificates: [],
    workPhotos: [],
    availabilityStatus: 'online',
    languagesSpoken: [],
    hourlyRate: '',
    description: ''
  });
  
  const [skillInput, setSkillInput] = useState('');
  const [languageInput, setLanguageInput] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Predefined skills for suggestions
  const predefinedSkills = [
    'Electrician', 'Plumber', 'Painter', 'Carpenter', 'Mason', 'Welder',
    'AC Technician', 'Appliance Repair', 'Cleaning', 'Gardening',
    'Home Renovation', 'Interior Design', 'Pest Control', 'Security'
  ];

  // Common languages
  const commonLanguages = [
    'English', 'Hindi', 'Bengali', 'Telugu', 'Marathi', 'Tamil',
    'Gujarati', 'Urdu', 'Kannada', 'Odia', 'Malayalam', 'Punjabi'
  ];

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e, fieldName) => {
    const files = Array.from(e.target.files);
    if (fieldName === 'profilePhoto') {
      setFormData(prev => ({ ...prev, [fieldName]: files[0] }));
    } else {
      setFormData(prev => ({ ...prev, [fieldName]: [...prev[fieldName], ...files] }));
    }
  };

  const addSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skillInput.trim()]
      }));
      setSkillInput('');
    }
  };

  const removeSkill = (skillToRemove) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const addLanguage = () => {
    if (languageInput.trim() && !formData.languagesSpoken.includes(languageInput.trim())) {
      setFormData(prev => ({
        ...prev,
        languagesSpoken: [...prev.languagesSpoken, languageInput.trim()]
      }));
      setLanguageInput('');
    }
  };

  const removeLanguage = (languageToRemove) => {
    setFormData(prev => ({
      ...prev,
      languagesSpoken: prev.languagesSpoken.filter(lang => lang !== languageToRemove)
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!userType) newErrors.userType = 'Please select user type';
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.mobile.trim()) newErrors.mobile = 'Mobile number is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.pincode.trim()) newErrors.pincode = 'Pincode is required';
    
    if (userType === 'worker') {
      if (formData.skills.length === 0) newErrors.skills = 'At least one skill is required';
      if (!formData.workExperience.duration.trim()) newErrors.duration = 'Work experience duration is required';
      if (formData.languagesSpoken.length === 0) newErrors.languages = 'At least one language is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Replace the handleSubmit function around line 300-400
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      console.log('Form validation failed');
      return;
    }
    
    if (!userType) {
      console.error('User type not selected');
      toast.error('Please select whether you are an Owner or Worker');
      return;
    }
    
    console.log('Form validation passed, user type:', userType);
    setIsSubmitting(true);
    
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No authenticated user found');
      }
      
      // Exclude File objects from profileData for Firestore
      const { profilePhoto, certificates, workPhotos, ...formDataWithoutFiles } = formData;
      
      // Clean and validate data before sending to Firestore
      const cleanFormData = {};
      Object.keys(formDataWithoutFiles).forEach(key => {
        const value = formDataWithoutFiles[key];
        // Only include defined, non-null values
        if (value !== undefined && value !== null && value !== '') {
          cleanFormData[key] = value;
        }
      });
      
      const profileData = {
        userType,
        ...cleanFormData,
        profileCompleted: true,
        email: user?.email || currentUser.email || formData.email,
        uid: currentUser.uid,
        profileCompletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Validate that email is not undefined
      if (!profileData.email) {
        throw new Error('Email is required but not found in user data');
      }
      
      // Remove any remaining undefined or null values
      Object.keys(profileData).forEach(key => {
        if (profileData[key] === undefined || profileData[key] === null) {
          delete profileData[key];
        }
      });
      
      console.log('Submitting profile data to Firestore:', profileData);
      
      // Validate essential data
      if (!profileData.fullName || !profileData.mobile || !profileData.address) {
        throw new Error('Missing required profile information');
      }
      
      // Handle file uploads to Firebase Storage
      const fileUploadPromises = [];
      
      // Upload profile photo if exists
      if (formData.profilePhoto) {
        const profilePhotoPromise = uploadFile(formData.profilePhoto, `profiles/${currentUser.uid}/profilePhoto`)
          .then(url => ({ profilePhotoURL: url }))
          .catch(error => {
            console.error('Error uploading profile photo:', error);
            return { profilePhotoURL: null };
          });
        fileUploadPromises.push(profilePhotoPromise);
      }
      
      // Upload certificates if exist
      if (formData.certificates && formData.certificates.length > 0) {
        const certificatesPromise = Promise.all(
          formData.certificates.map((cert, index) => 
            uploadFile(cert, `profiles/${currentUser.uid}/certificates/cert_${index}`)
              .catch(error => {
                console.error(`Error uploading certificate ${index}:`, error);
                return null;
              })
          )
        ).then(urls => ({ certificateURLs: urls.filter(url => url !== null) }));
        fileUploadPromises.push(certificatesPromise);
      }
      
      // Upload work photos if exist
      if (formData.workPhotos && formData.workPhotos.length > 0) {
        const workPhotosPromise = Promise.all(
          formData.workPhotos.map((photo, index) => 
            uploadFile(photo, `profiles/${currentUser.uid}/workPhotos/photo_${index}`)
              .catch(error => {
                console.error(`Error uploading work photo ${index}:`, error);
                return null;
              })
          )
        ).then(urls => ({ workPhotoURLs: urls.filter(url => url !== null) }));
        fileUploadPromises.push(workPhotosPromise);
      }
      
      // Wait for all file uploads to complete
      const uploadResults = await Promise.all(fileUploadPromises);
      
      // Merge upload results into profile data
      const fileURLs = uploadResults.reduce((acc, result) => ({ ...acc, ...result }), {});
      const finalProfileData = { ...profileData, ...fileURLs };
      
      console.log('File uploads completed:', fileURLs);
      
      // Save to Firestore with file URLs
      await userService.saveUserProfile(currentUser.uid, finalProfileData);
      console.log('Profile saved to Firestore successfully');
      
      // Mark profile as completed in Firestore
      await userService.markProfileCompleted(currentUser.uid, userType);
      console.log('Profile marked as completed in Firestore');
      
      // Also save to backend API for consistency
      try {
        console.log('Saving profile data to backend API...');
        
        // Prepare FormData for backend API
        const backendFormData = new FormData();
        
        // Add all text fields
        Object.keys(cleanFormData).forEach(key => {
          const value = cleanFormData[key];
          if (typeof value === 'object' && value !== null) {
            backendFormData.append(key, JSON.stringify(value));
          } else {
            backendFormData.append(key, value);
          }
        });
        
        // Add userType
        backendFormData.append('userType', userType);
        
        // Add files if they exist
        if (formData.profilePhoto) {
          backendFormData.append('profilePhoto', formData.profilePhoto);
        }
        
        if (formData.certificates && formData.certificates.length > 0) {
          formData.certificates.forEach(cert => {
            backendFormData.append('certificates', cert);
          });
        }
        
        if (formData.workPhotos && formData.workPhotos.length > 0) {
          formData.workPhotos.forEach(photo => {
            backendFormData.append('workPhotos', photo);
          });
        }
        
        // Call backend API
        const backendResponse = await fetch('http://localhost:5000/api/auth/complete-profile', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: backendFormData
        });
        
        if (backendResponse.ok) {
          const backendResult = await backendResponse.json();
          console.log('Backend profile save successful:', backendResult);
          
          // Update Redux state with backend response
          const updatedUser = {
            ...user,
            ...backendResult.user,
            profileCompleted: true,
            userType: userType
          };
          
          // Update localStorage
          localStorage.setItem('user', JSON.stringify(updatedUser));
          
          // Update Redux state
          dispatch(setCredentials({ user: updatedUser, token: localStorage.getItem('token') }));
          dispatch(setProfileCompleted(true));
        } else {
          console.error('Backend API call failed:', await backendResponse.text());
          // Still update Redux with Firebase data as fallback
          const updatedUser = {
            ...user,
            ...profileData,
            profileCompleted: true,
            userType: userType
          };
          
          localStorage.setItem('user', JSON.stringify(updatedUser));
          dispatch(setCredentials({ user: updatedUser, token: localStorage.getItem('token') }));
          dispatch(setProfileCompleted(true));
        }
      } catch (backendError) {
        console.error('Backend API error:', backendError);
        // Still update Redux with Firebase data as fallback
        const updatedUser = {
          ...user,
          ...profileData,
          profileCompleted: true,
          userType: userType
        };
        
        localStorage.setItem('user', JSON.stringify(updatedUser));
        dispatch(setCredentials({ user: updatedUser, token: localStorage.getItem('token') }));
        dispatch(setProfileCompleted(true));
      }
      
      console.log('Redux state updated with:', {
        user: updatedUser,
        profileCompleted: true,
        userType: userType
      });
      
      // Show success message
      toast.success('Profile completed successfully!');
      
      console.log('Profile completed successfully, navigating to dashboard...');
      
      // Wait a moment to ensure all updates are processed
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Navigate to appropriate dashboard
      if (userType === 'owner') {
        console.log('Navigating to owner dashboard');
        navigate('/owner/dashboard', { replace: true });
      } else if (userType === 'worker') {
        console.log('Navigating to worker dashboard');
        navigate('/worker/dashboard', { replace: true });
      } else {
        console.log('Unknown user type, navigating to home');
        navigate('/', { replace: true });
      }
      
    } catch (error) {
      console.error('Profile completion error:', error);
      
      let errorMessage = 'Failed to complete profile';
      
      if (error.message === 'Missing required profile information') {
        errorMessage = 'Please fill in all required fields (Full Name, Mobile, Address)';
      }
      
      if (error.message === 'No authenticated user found') {
        errorMessage = 'Authentication error. Please log in again.';
      }
      
      // Handle Firestore connection errors
      if (error.code === 'unavailable' || error.code === 'deadline-exceeded') {
        errorMessage = 'Connection issue. Please check your internet connection and try again.';
      }
      
      if (error.code === 'permission-denied') {
        errorMessage = 'Permission denied. Please ensure you are properly authenticated.';
      }
      
      if (error.message && error.message.includes('WebChannel')) {
        errorMessage = 'Network connection error. Please try again in a moment.';
        navigate('/login');
        return;
      } else if (error.code === 'permission-denied') {
        errorMessage = 'Permission denied. Please check your account permissions.';
      } else if (error.code === 'unavailable') {
        errorMessage = 'Service temporarily unavailable. Please try again later.';
      } else {
        errorMessage = error.message || 'Failed to complete profile';
      }
      
      toast.error(errorMessage);
      setErrors({ submit: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderOwnerForm = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Full Name *
          </label>
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:focus:ring-blue-400"
            placeholder="Enter your full name"
          />
          {errors.fullName && <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.fullName}</p>}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Business Name
          </label>
          <input
            type="text"
            name="businessName"
            value={formData.businessName}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:focus:ring-blue-400"
            placeholder="Enter business name (optional)"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email *
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:focus:ring-blue-400 disabled:opacity-50"
            placeholder="Enter your email"
            disabled
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Mobile Number *
          </label>
          <input
            type="tel"
            name="mobile"
            value={formData.mobile}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:focus:ring-blue-400"
            placeholder="Enter your mobile number"
          />
          {errors.mobile && <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.mobile}</p>}
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Address *
        </label>
        <textarea
          name="address"
          value={formData.address}
          onChange={handleInputChange}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:focus:ring-blue-400"
          placeholder="Enter your complete address"
        />
        {errors.address && <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.address}</p>}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Pincode *
          </label>
          <input
            type="text"
            name="pincode"
            value={formData.pincode}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:focus:ring-blue-400"
            placeholder="Enter pincode"
          />
          {errors.pincode && <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.pincode}</p>}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Profile Photo
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleFileChange(e, 'profilePhoto')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:focus:ring-blue-400"
          />
        </div>
      </div>
    </div>
  );

  const renderWorkerForm = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Full Name *
          </label>
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:focus:ring-blue-400"
            placeholder="Enter your full name"
          />
          {errors.fullName && <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.fullName}</p>}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Mobile Number *
          </label>
          <input
            type="tel"
            name="mobile"
            value={formData.mobile}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:focus:ring-blue-400"
            placeholder="Enter your mobile number"
          />
          {errors.mobile && <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.mobile}</p>}
        </div>
      </div>
      
      {/* Skills Section */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Skills * (e.g., electrician, plumber, painter)
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:focus:ring-blue-400"
            placeholder="Type a skill and press Add"
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
          />
          <button
            type="button"
            onClick={addSkill}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
          >
            Add
          </button>
        </div>
        
        {/* Skill suggestions */}
        <div className="mb-2">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Quick add:</p>
          <div className="flex flex-wrap gap-1">
            {predefinedSkills.map(skill => (
              <button
                key={skill}
                type="button"
                onClick={() => {
                  if (!formData.skills.includes(skill)) {
                    setFormData(prev => ({ ...prev, skills: [...prev.skills, skill] }));
                  }
                }}
                className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50"
                disabled={formData.skills.includes(skill)}
              >
                {skill}
              </button>
            ))}
          </div>
        </div>
        
        {/* Selected skills */}
        <div className="flex flex-wrap gap-2">
          {formData.skills.map(skill => (
            <span
              key={skill}
              className="inline-flex items-center px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm"
            >
              {skill}
              <button
                type="button"
                onClick={() => removeSkill(skill)}
                className="ml-2 text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        {errors.skills && <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.skills}</p>}
      </div>
      
      {/* Work Experience */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Work Experience</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Duration *
            </label>
            <input
              type="text"
              name="workExperience.duration"
              value={formData.workExperience.duration}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:focus:ring-blue-400"
              placeholder="e.g., 5 years"
            />
            {errors.duration && <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.duration}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Hourly Rate (₹)
            </label>
            <input
              type="number"
              name="hourlyRate"
              value={formData.hourlyRate}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:focus:ring-blue-400"
              placeholder="e.g., 500"
            />
          </div>
        </div>
        
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Companies/Previous Employers
          </label>
          <textarea
            name="workExperience.companies"
            value={formData.workExperience.companies}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:focus:ring-blue-400"
            placeholder="List companies or employers you've worked with"
          />
        </div>
        
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Freelancing History
          </label>
          <textarea
            name="workExperience.freelancingHistory"
            value={formData.workExperience.freelancingHistory}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:focus:ring-blue-400"
            placeholder="Describe your freelancing experience"
          />
        </div>
      </div>
      
      {/* Languages */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Languages Spoken *
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={languageInput}
            onChange={(e) => setLanguageInput(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:focus:ring-blue-400"
            placeholder="Type a language and press Add"
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLanguage())}
          />
          <button
            type="button"
            onClick={addLanguage}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
          >
            Add
          </button>
        </div>
        
        {/* Language suggestions */}
        <div className="mb-2">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Quick add:</p>
          <div className="flex flex-wrap gap-1">
            {commonLanguages.map(language => (
              <button
                key={language}
                type="button"
                onClick={() => {
                  if (!formData.languagesSpoken.includes(language)) {
                    setFormData(prev => ({ ...prev, languagesSpoken: [...prev.languagesSpoken, language] }));
                  }
                }}
                className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50"
                disabled={formData.languagesSpoken.includes(language)}
              >
                {language}
              </button>
            ))}
          </div>
        </div>
        
        {/* Selected languages */}
        <div className="flex flex-wrap gap-2">
          {formData.languagesSpoken.map(language => (
            <span
              key={language}
              className="inline-flex items-center px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm"
            >
              {language}
              <button
                type="button"
                onClick={() => removeLanguage(language)}
                className="ml-2 text-green-600 dark:text-green-300 hover:text-green-800 dark:hover:text-green-100"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        {errors.languages && <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.languages}</p>}
      </div>
      
      {/* Address and Pincode */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Address *
          </label>
          <textarea
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:focus:ring-blue-400"
            placeholder="Enter your complete address"
          />
          {errors.address && <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.address}</p>}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Pincode *
          </label>
          <input
            type="text"
            name="pincode"
            value={formData.pincode}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:focus:ring-blue-400"
            placeholder="Enter pincode"
          />
          {errors.pincode && <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.pincode}</p>}
        </div>
      </div>
      
      {/* Availability Status */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Availability Status
        </label>
        <select
          name="availabilityStatus"
          value={formData.availabilityStatus}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:focus:ring-blue-400"
        >
          <option value="online">Online - Available for work</option>
          <option value="busy">Busy - Currently working</option>
          <option value="offline">Offline - Not available</option>
        </select>
      </div>
      
      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Professional Description
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:focus:ring-blue-400"
          placeholder="Describe your professional experience and what makes you unique"
        />
      </div>
      
      {/* File Uploads */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Profile Photo
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleFileChange(e, 'profilePhoto')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:focus:ring-blue-400"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Certificates/Licenses
          </label>
          <input
            type="file"
            accept="image/*,.pdf"
            multiple
            onChange={(e) => handleFileChange(e, 'certificates')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:focus:ring-blue-400"
          />
          {formData.certificates.length > 0 && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {formData.certificates.length} file(s) selected
            </p>
          )}
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Previous Work Photos
        </label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleFileChange(e, 'workPhotos')}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:focus:ring-blue-400"
        />
        {formData.workPhotos.length > 0 && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {formData.workPhotos.length} photo(s) selected
          </p>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Complete Your Profile</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Please provide the following information to complete your profile
            </p>
          </div>
          
          {/* User Type Selection */}
          {!userType && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">I am a:</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setUserType('owner')}
                  className="p-6 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900 transition-colors dark:bg-gray-700"
                >
                  <div className="text-center">
                    <div className="text-4xl mb-2">🏠</div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Property Owner</h3>
                    <p className="text-gray-600 dark:text-gray-300">I need to hire workers for my property</p>
                  </div>
                </button>
                
                <button
                  type="button"
                  onClick={() => setUserType('worker')}
                  className="p-6 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900 transition-colors dark:bg-gray-700"
                >
                  <div className="text-center">
                    <div className="text-4xl mb-2">🔧</div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Service Worker</h3>
                    <p className="text-gray-600 dark:text-gray-300">I provide services to property owners</p>
                  </div>
                </button>
              </div>
              {errors.userType && <p className="text-red-500 dark:text-red-400 text-sm mt-2 text-center">{errors.userType}</p>}
            </div>
          )}
          
          {/* Profile Form */}
          {userType && (
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {userType === 'owner' ? 'Property Owner Information' : 'Service Worker Information'}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setUserType('')}
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                  >
                    Change Type
                  </button>
                </div>
              </div>
              
              {userType === 'owner' ? renderOwnerForm() : renderWorkerForm()}
              
              {errors.submit && (
                <div className="mt-6 p-4 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-md">
                  <p className="text-red-600 dark:text-red-400">{errors.submit}</p>
                </div>
              )}
              
              <div className="mt-8 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-600 dark:hover:bg-blue-700"
                >
                  {isSubmitting ? 'Completing Profile...' : 'Complete Profile'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompleteProfile;