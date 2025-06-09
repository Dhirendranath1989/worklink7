import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { setProfileCompleted, setCredentials } from '../../features/auth/authSlice';
import { userService } from '../../services/userService';
import { auth, uploadFile } from '../../services/firebase';
import {
  PhotoIcon,
  DocumentIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
  UserIcon,
  BriefcaseIcon
} from '@heroicons/react/24/outline';

const CompleteProfile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated, token } = useSelector((state) => state.auth);
  
  // State management
  const [currentStep, setCurrentStep] = useState(1);
  const [userType, setUserType] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [errors, setErrors] = useState({});
  
  // Form data state
  const [formData, setFormData] = useState({
    // Common fields
    fullName: '',
    mobile: '',
    address: '',
    pincode: '',
    profilePhoto: null,
    
    // Worker specific
    skills: [],
    workExperience: '',
    certificates: [],
    workPhotos: [],
    hourlyRate: '',
    description: '',
    languagesSpoken: [],
    
    // Owner specific
    businessName: '',
    businessType: ''
  });
  
  // Predefined options
  const skillOptions = [
    'Electrician', 'Plumber', 'Painter', 'Carpenter', 'Mason', 'Welder',
    'AC Technician', 'Appliance Repair', 'Cleaning', 'Gardening',
    'Home Renovation', 'Interior Design', 'Pest Control', 'Security',
    'Roofing', 'Flooring', 'Tiling', 'Glass Work', 'Locksmith'
  ];
  
  const languageOptions = [
    'English', 'Hindi', 'Bengali', 'Telugu', 'Marathi', 'Tamil',
    'Gujarati', 'Urdu', 'Kannada', 'Odia', 'Malayalam', 'Punjabi'
  ];
  
  const businessTypes = [
    'Individual', 'Small Business', 'Construction Company', 'Property Management',
    'Real Estate', 'Hospitality', 'Retail', 'Manufacturing', 'Other'
  ];
  
  // Authentication check
  useEffect(() => {
    if (!isAuthenticated || !user) {
      console.log('User not authenticated, redirecting to login');
      navigate('/login');
      return;
    }
    
    // Check if profile is already completed
    if (user.profileCompleted) {
      console.log('Profile already completed, redirecting to dashboard');
      const dashboardPath = user.userType === 'owner' ? '/owner/dashboard' : '/worker/dashboard';
      navigate(dashboardPath, { replace: true });
      return;
    }
    
    // Initialize form with user data
    setFormData(prev => ({
      ...prev,
      fullName: user.fullName || (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : ''),
      mobile: user.mobile || '',
      address: user.address || '',
      pincode: user.pincode || ''
    }));
  }, [isAuthenticated, user, navigate]);
  
  // Validation functions
  const validateStep1 = () => {
    const newErrors = {};
    
    if (!userType) {
      newErrors.userType = 'Please select your role';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const validateStep2 = () => {
    const newErrors = {};
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    
    if (!formData.mobile.trim()) {
      newErrors.mobile = 'Mobile number is required';
    } else if (!/^[6-9]\d{9}$/.test(formData.mobile)) {
      newErrors.mobile = 'Please enter a valid 10-digit mobile number';
    }
    
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }
    
    if (!formData.pincode.trim()) {
      newErrors.pincode = 'Pincode is required';
    } else if (!/^\d{6}$/.test(formData.pincode)) {
      newErrors.pincode = 'Please enter a valid 6-digit pincode';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const validateStep3 = () => {
    const newErrors = {};
    
    if (userType === 'worker') {
      if (formData.skills.length === 0) {
        newErrors.skills = 'Please select at least one skill';
      }
      
      if (!formData.workExperience.trim()) {
        newErrors.workExperience = 'Work experience is required';
      }
      
      if (!formData.hourlyRate.trim()) {
        newErrors.hourlyRate = 'Hourly rate is required';
      } else if (isNaN(formData.hourlyRate) || parseFloat(formData.hourlyRate) <= 0) {
        newErrors.hourlyRate = 'Please enter a valid hourly rate';
      }
    } else if (userType === 'owner') {
      if (!formData.businessType) {
        newErrors.businessType = 'Please select your business type';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // File handling
  const handleFileChange = (e, fieldName, multiple = false) => {
    const files = Array.from(e.target.files);
    
    if (!multiple && files.length > 1) {
      toast.error('Please select only one file');
      return;
    }
    
    // Validate file types and sizes
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    const validFiles = files.filter(file => {
      if (!validTypes.includes(file.type)) {
        toast.error(`${file.name} is not a valid file type`);
        return false;
      }
      if (file.size > maxSize) {
        toast.error(`${file.name} is too large (max 5MB)`);
        return false;
      }
      return true;
    });
    
    if (validFiles.length === 0) return;
    
    setFormData(prev => ({
      ...prev,
      [fieldName]: multiple ? validFiles : validFiles[0]
    }));
  };
  
  // Form handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  const handleSkillToggle = (skill) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };
  
  const handleLanguageToggle = (language) => {
    setFormData(prev => ({
      ...prev,
      languagesSpoken: prev.languagesSpoken.includes(language)
        ? prev.languagesSpoken.filter(l => l !== language)
        : [...prev.languagesSpoken, language]
    }));
  };
  
  // Navigation
  const handleNext = () => {
    let isValid = false;
    
    switch (currentStep) {
      case 1:
        isValid = validateStep1();
        break;
      case 2:
        isValid = validateStep2();
        break;
      case 3:
        isValid = validateStep3();
        break;
      default:
        isValid = true;
    }
    
    if (isValid) {
      setCurrentStep(prev => prev + 1);
    }
  };
  
  const handlePrevious = () => {
    setCurrentStep(prev => prev - 1);
  };
  
  // File upload with progress
  const uploadFileWithProgress = async (file, path, progressKey) => {
    try {
      setUploadProgress(prev => ({ ...prev, [progressKey]: 0 }));
      
      const url = await uploadFile(file, path, (progress) => {
        setUploadProgress(prev => ({ ...prev, [progressKey]: progress }));
      });
      
      setUploadProgress(prev => ({ ...prev, [progressKey]: 100 }));
      return url;
    } catch (error) {
      console.error(`Error uploading ${progressKey}:`, error);
      setUploadProgress(prev => ({ ...prev, [progressKey]: -1 }));
      throw error;
    }
  };
  
  // Skip profile completion
  const handleSkip = async () => {
    try {
      setIsSubmitting(true);
      
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No authenticated user found');
      }
      
      // Ensure user has selected a role before skipping
      if (!userType) {
        toast.error('Please select your role before skipping.');
        setIsSubmitting(false);
        return;
      }
      
      // Create minimal profile data for skipped profile
      const minimalProfileData = {
        uid: currentUser.uid,
        email: user.email || currentUser.email,
        fullName: user.fullName || user.displayName || 'User',
        profileCompleted: true,
        profileSkipped: true,
        userType: userType,
        profileCompletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Update Redux state
      const updatedUser = {
        ...user,
        ...minimalProfileData,
        profileCompleted: true,
        profileSkipped: true,
        userType: userType
      };
      
      // Update Redux state
      dispatch(setCredentials({ user: updatedUser, token }));
      dispatch(setProfileCompleted(true));
      
      // Update localStorage
      localStorage.setItem('user', JSON.stringify(updatedUser));
      localStorage.setItem('profileCompleted', 'true');
      localStorage.setItem('userType', userType);
      
      toast.success('Profile setup skipped. You can complete it later from your dashboard.');
      
      // Navigate to dashboard based on user selection
      const dashboardPath = userType === 'owner' ? '/owner/dashboard' : '/worker/dashboard';
      console.log('🚀 Navigating to dashboard (skip):', dashboardPath);
      console.log('🔍 User type (skip):', userType);
      console.log('🔍 Updated user (skip):', updatedUser);
      
      // Use a longer timeout to ensure Redux state is updated
      setTimeout(() => {
        console.log('🚀 Executing navigation to (skip):', dashboardPath);
        navigate(dashboardPath, { replace: true });
      }, 500);
      
    } catch (error) {
      console.error('Profile skip error:', error);
      toast.error('Failed to skip profile setup. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Form submission
  const handleSubmit = async () => {
    if (!validateStep3()) return;
    
    setIsSubmitting(true);
    
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No authenticated user found');
      }
      
      // Prepare FormData for backend API
      const formDataToSend = new FormData();
      
      // Add basic profile data
      const profileData = {
        fullName: formData.fullName.trim(),
        mobile: formData.mobile.trim(),
        address: formData.address.trim(),
        pincode: formData.pincode.trim(),
        userType: userType
      };
      
      // Add user type specific data
      if (userType === 'worker') {
        profileData.skills = formData.skills;
        profileData.workExperience = formData.workExperience.trim();
        profileData.hourlyRate = parseFloat(formData.hourlyRate);
        profileData.description = formData.description.trim();
        profileData.languagesSpoken = formData.languagesSpoken;
        profileData.availabilityStatus = 'online';
      } else if (userType === 'owner') {
        profileData.businessName = formData.businessName.trim();
        profileData.businessType = formData.businessType;
      }
      
      // Add profile data as JSON string
      formDataToSend.append('profileData', JSON.stringify(profileData));
      
      // Add files
      if (formData.profilePhoto) {
        formDataToSend.append('profilePhoto', formData.profilePhoto);
      }
      
      if (userType === 'worker') {
        // Add certificates
        formData.certificates.forEach((cert, index) => {
          formDataToSend.append('certificates', cert);
        });
        
        // Add work photos
        formData.workPhotos.forEach((photo, index) => {
          formDataToSend.append('workPhotos', photo);
        });
      }
      
      // Get auth token from Redux state
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      // Call backend API
      const response = await fetch('http://localhost:5000/api/auth/complete-profile', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to complete profile');
      }
      
      console.log('✅ Profile completed successfully via backend API');
      
      // Update Redux state with the response data
      const updatedUser = {
        ...user,
        ...result.user,
        profileCompleted: true,
        userType: userType
      };
      
      // Update Redux state
      dispatch(setCredentials({ user: updatedUser, token }));
      dispatch(setProfileCompleted(true));
      
      // Show success message
      toast.success('Profile completed successfully!');
      
      // Navigate to dashboard immediately
      const dashboardPath = userType === 'owner' ? '/owner/dashboard' : '/worker/dashboard';
      console.log('🚀 Navigating to dashboard:', dashboardPath);
      console.log('🔍 User type:', userType);
      console.log('🔍 Updated user:', updatedUser);
      
      navigate(dashboardPath, { replace: true });
      
    } catch (error) {
      console.error('Profile completion error:', error);
      
      let errorMessage = 'Failed to complete profile';
      
      if (error.code === 'permission-denied') {
        errorMessage = 'Permission denied. Please check your account permissions.';
      } else if (error.code === 'unavailable') {
        errorMessage = 'Service temporarily unavailable. Please try again later.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Render step indicator
  const renderStepIndicator = () => {
    const steps = [
      { number: 1, title: 'Role Selection' },
      { number: 2, title: 'Basic Info' },
      { number: 3, title: userType === 'worker' ? 'Skills & Experience' : 'Business Details' },
      { number: 4, title: 'Review & Submit' }
    ];
    
    return (
      <div className="flex items-center justify-center mb-8">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
              currentStep >= step.number
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400'
            }`}>
              {currentStep > step.number ? (
                <CheckCircleIcon className="w-6 h-6" />
              ) : (
                step.number
              )}
            </div>
            <div className="ml-2 mr-4">
              <p className={`text-sm font-medium ${
                currentStep >= step.number ? 'text-blue-600' : 'text-gray-500 dark:text-gray-400'
              }`}>
                {step.title}
              </p>
            </div>
            {index < steps.length - 1 && (
              <ArrowRightIcon className="w-4 h-4 text-gray-400 dark:text-gray-500 mr-4" />
            )}
          </div>
        ))}
      </div>
    );
  };
  
  // Render role selection step
  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Choose Your Role</h2>
        <p className="text-gray-600 dark:text-gray-300">Select how you want to use WorkLink</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button
          type="button"
          onClick={() => setUserType('worker')}
          className={`p-6 border-2 rounded-lg text-left transition-all ${
            userType === 'worker'
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
          }`}
        >
          <UserIcon className="w-12 h-12 text-blue-600 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">I'm a Worker</h3>
          <p className="text-gray-600 dark:text-gray-300">I want to find work opportunities and connect with clients</p>
        </button>
        
        <button
          type="button"
          onClick={() => setUserType('owner')}
          className={`p-6 border-2 rounded-lg text-left transition-all ${
            userType === 'owner'
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
          }`}
        >
          <BriefcaseIcon className="w-12 h-12 text-blue-600 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">I'm an Owner</h3>
          <p className="text-gray-600 dark:text-gray-300">I want to hire workers and post job requirements</p>
        </button>
      </div>
      
      {errors.userType && (
        <p className="text-red-500 text-sm text-center">{errors.userType}</p>
      )}
      
      {/* Skip Button - Show after role selection */}
      {userType && (
        <div className="text-center mt-6">
          <button
            type="button"
            onClick={handleSkip}
            disabled={isSubmitting}
            className={`px-6 py-2 border border-gray-400 dark:border-gray-600 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400 ${
              isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            title="Skip profile completion and go to dashboard"
          >
            {isSubmitting ? 'Processing...' : 'Skip Profile Setup'}
          </button>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            You can complete your profile later from your dashboard
          </p>
        </div>
      )}
    </div>
  );
  
  // Render basic info step
  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Basic Information</h2>
        <p className="text-gray-600 dark:text-gray-300">Tell us about yourself</p>
      </div>
      
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
            className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.fullName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="Enter your full name"
          />
          {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
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
            className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.mobile ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="Enter your mobile number"
          />
          {errors.mobile && <p className="text-red-500 text-sm mt-1">{errors.mobile}</p>}
        </div>
        
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Address *
          </label>
          <textarea
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            rows={3}
            className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.address ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="Enter your complete address"
          />
          {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
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
            className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.pincode ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="Enter your pincode"
          />
          {errors.pincode && <p className="text-red-500 text-sm mt-1">{errors.pincode}</p>}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Profile Photo
          </label>
          <div className="flex items-center space-x-4">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(e, 'profilePhoto')}
              className="hidden"
              id="profilePhoto"
            />
            <label
              htmlFor="profilePhoto"
              className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <PhotoIcon className="w-5 h-5 mr-2" />
              Choose Photo
            </label>
            {formData.profilePhoto && (
              <span className="text-sm text-green-600">
                {formData.profilePhoto.name}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
  
  // Render worker details step
  const renderWorkerStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Skills & Experience</h2>
        <p className="text-gray-600 dark:text-gray-300">Tell us about your professional skills</p>
      </div>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Skills *
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {skillOptions.map((skill) => (
              <button
                key={skill}
                type="button"
                onClick={() => handleSkillToggle(skill)}
                className={`px-3 py-2 text-sm border rounded-md transition-all ${
                  formData.skills.includes(skill)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-400'
                }`}
              >
                {skill}
              </button>
            ))}
          </div>
          {errors.skills && <p className="text-red-500 text-sm mt-1">{errors.skills}</p>}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Work Experience *
            </label>
            <textarea
              name="workExperience"
              value={formData.workExperience}
              onChange={handleInputChange}
              rows={4}
              className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.workExperience ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="Describe your work experience..."
            />
            {errors.workExperience && <p className="text-red-500 text-sm mt-1">{errors.workExperience}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Hourly Rate (₹) *
            </label>
            <input
              type="number"
              name="hourlyRate"
              value={formData.hourlyRate}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.hourlyRate ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="Enter your hourly rate"
            />
            {errors.hourlyRate && <p className="text-red-500 text-sm mt-1">{errors.hourlyRate}</p>}
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Tell clients about yourself and your services..."
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Languages Spoken
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {languageOptions.map((language) => (
              <button
                key={language}
                type="button"
                onClick={() => handleLanguageToggle(language)}
                className={`px-3 py-2 text-sm border rounded-md transition-all ${
                  formData.languagesSpoken.includes(language)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-400'
                }`}
              >
                {language}
              </button>
            ))}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Certificates
            </label>
            <input
              type="file"
              multiple
              accept="image/*,.pdf"
              onChange={(e) => handleFileChange(e, 'certificates', true)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {formData.certificates.length > 0 && (
              <p className="text-sm text-green-600 mt-1">
                {formData.certificates.length} file(s) selected
              </p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Work Photos
            </label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => handleFileChange(e, 'workPhotos', true)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {formData.workPhotos.length > 0 && (
              <p className="text-sm text-green-600 mt-1">
                {formData.workPhotos.length} photo(s) selected
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
  
  // Render owner details step
  const renderOwnerStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Business Details</h2>
        <p className="text-gray-600 dark:text-gray-300">Tell us about your business</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Business Name
          </label>
          <input
            type="text"
            name="businessName"
            value={formData.businessName}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your business name (optional)"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Business Type *
          </label>
          <select
            name="businessType"
            value={formData.businessType}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.businessType ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
          >
            <option value="">Select business type</option>
            {businessTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          {errors.businessType && <p className="text-red-500 text-sm mt-1">{errors.businessType}</p>}
        </div>
      </div>
    </div>
  );
  
  // Render review step
  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Review & Submit</h2>
        <p className="text-gray-600 dark:text-gray-300">Please review your information before submitting</p>
      </div>
      
      <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Profile Summary</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Role</p>
            <p className="font-medium text-gray-900 dark:text-white capitalize">{userType}</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Full Name</p>
            <p className="font-medium text-gray-900 dark:text-white">{formData.fullName}</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Mobile</p>
            <p className="font-medium text-gray-900 dark:text-white">{formData.mobile}</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Pincode</p>
            <p className="font-medium text-gray-900 dark:text-white">{formData.pincode}</p>
          </div>
          
          {userType === 'worker' && (
            <>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Skills</p>
                <p className="font-medium text-gray-900 dark:text-white">{formData.skills.join(', ')}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Hourly Rate</p>
                <p className="font-medium text-gray-900 dark:text-white">₹{formData.hourlyRate}/hour</p>
              </div>
            </>
          )}
          
          {userType === 'owner' && (
            <>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Business Type</p>
                <p className="font-medium text-gray-900 dark:text-white">{formData.businessType}</p>
              </div>
              
              {formData.businessName && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Business Name</p>
                  <p className="font-medium text-gray-900 dark:text-white">{formData.businessName}</p>
                </div>
              )}
            </>
          )}
        </div>
        
        <div className="mt-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Address</p>
          <p className="font-medium text-gray-900 dark:text-white">{formData.address}</p>
        </div>
      </div>
      
      {/* Upload Progress */}
      {Object.keys(uploadProgress).length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">Upload Progress</h4>
          {Object.entries(uploadProgress).map(([key, progress]) => (
            <div key={key} className="mb-2">
              <div className="flex justify-between text-sm">
                <span className="text-blue-700 dark:text-blue-300">{key}</span>
                <span className="text-blue-700 dark:text-blue-300">
                  {progress === -1 ? 'Failed' : `${progress}%`}
                </span>
              </div>
              <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    progress === -1 ? 'bg-red-500' : 'bg-blue-600'
                  }`}
                  style={{ width: `${Math.max(0, progress)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
  
  // Main render
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 p-8">
          {renderStepIndicator()}
          
          <form onSubmit={(e) => e.preventDefault()}>
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && (userType === 'worker' ? renderWorkerStep3() : renderOwnerStep3())}
            {currentStep === 4 && renderStep4()}
            
            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <button
                type="button"
                onClick={handlePrevious}
                disabled={currentStep === 1}
                className={`px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 ${
                  currentStep === 1
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                Previous
              </button>
              
              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className={`px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}
                  }`}
                >
                  {isSubmitting ? 'Submitting...' : 'Complete Profile'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CompleteProfile;