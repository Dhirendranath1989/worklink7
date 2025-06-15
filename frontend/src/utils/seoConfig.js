// SEO Configuration for WorkLink Platform
// Based on market research and 2024 SEO best practices

export const seoConfig = {
  // Default/Global SEO settings
  default: {
    siteName: 'WorkLink',
    siteUrl: 'https://www.worklinkindia.com',
    twitterHandle: '@worklink_in',
    locale: 'en_IN',
    author: 'WorkLink',
    ogImage: '/og-image.jpg',
    twitterImage: '/twitter-image.jpg'
  },

  // Page-specific SEO configurations
  pages: {
    home: {
      title: 'WorkLink - India\'s #1 Local Services Platform | Find Skilled Workers & Jobs',
      description: 'Connect with 50,000+ verified skilled workers across 500+ cities in India. Find electricians, plumbers, carpenters & more. Join India\'s fastest-growing local services marketplace with 4.8★ rating.',
      keywords: 'local workers India, skilled workers, home services, electrician near me, plumber near me, carpenter, painter, AC repair, appliance repair, local jobs, worker marketplace, verified professionals, home maintenance',
      canonicalUrl: 'https://www.worklinkindia.com',
      structuredData: {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "WorkLink",
        "url": "https://www.worklinkindia.com",
        "description": "India's fastest-growing platform connecting skilled local workers with opportunities",
        "potentialAction": {
          "@type": "SearchAction",
          "target": "https://www.worklinkindia.com/search?q={search_term_string}",
          "query-input": "required name=search_term_string"
        },
        "sameAs": [
          "https://www.facebook.com/worklink",
          "https://www.twitter.com/worklink_in",
          "https://www.linkedin.com/company/worklink",
          "https://www.instagram.com/worklink_official"
        ]
      }
    },

    workerSearch: {
      title: 'Find Skilled Workers Near You | Verified Professionals | WorkLink',
      description: 'Browse 50,000+ verified skilled workers in your area. Compare ratings, reviews & prices. Book electricians, plumbers, carpenters & more. Instant quotes available.',
      keywords: 'find workers, skilled professionals, local workers, verified workers, electrician, plumber, carpenter, painter, home services, worker search, professional services',
      canonicalUrl: 'https://www.worklinkindia.com/workers'
    },

    workerProfile: {
      title: '{workerName} - {skill} in {location} | WorkLink',
      description: 'Hire {workerName}, a verified {skill} in {location}. View portfolio, ratings & reviews. {experience}+ years experience. Book now for quality service.',
      keywords: '{skill}, {location}, verified professional, experienced worker, quality service, portfolio, ratings, reviews'
    },

    jobSearch: {
      title: 'Find Local Jobs & Opportunities | Work Near You | WorkLink',
      description: 'Discover local job opportunities for skilled workers. Browse jobs in construction, home services, maintenance & more. Apply instantly and grow your career.',
      keywords: 'local jobs, skilled worker jobs, construction jobs, home service jobs, maintenance jobs, worker opportunities, apply jobs, career growth',
      canonicalUrl: 'https://www.worklinkindia.com/jobs'
    },

    workerRegistration: {
      title: 'Join as Skilled Worker | Start Earning Today | WorkLink',
      description: 'Register as a skilled worker on WorkLink. Get verified, showcase your skills & start earning. Join 50,000+ workers already earning through our platform.',
      keywords: 'worker registration, skilled worker signup, earn money, freelance work, local jobs, worker verification, professional profile',
      canonicalUrl: 'https://www.worklinkindia.com/register?type=worker'
    },

    ownerRegistration: {
      title: 'Hire Skilled Workers | Post Jobs | WorkLink for Owners',
      description: 'Find and hire verified skilled workers for your projects. Post jobs, get instant quotes, compare profiles. Trusted by thousands of property owners.',
      keywords: 'hire workers, post jobs, find professionals, home services, property maintenance, skilled labor, verified workers, instant quotes',
      canonicalUrl: 'https://www.worklinkindia.com/register?type=owner'
    },

    workerDashboard: {
      title: 'Worker Dashboard | Manage Jobs & Profile | WorkLink',
      description: 'Manage your worker profile, view job applications, track earnings & update availability. Your complete workspace for growing your service business.',
      keywords: 'worker dashboard, manage profile, job applications, earnings, availability, service business',
      noindex: true // Private dashboard
    },

    ownerDashboard: {
      title: 'Owner Dashboard | Manage Jobs & Workers | WorkLink',
      description: 'Post jobs, manage applications, track project progress & make payments. Your complete platform for hiring skilled workers.',
      keywords: 'owner dashboard, post jobs, manage workers, project tracking, payments',
      noindex: true // Private dashboard
    },

    about: {
      title: 'About WorkLink | India\'s Leading Local Services Platform',
      description: 'Learn about WorkLink\'s mission to connect skilled workers with opportunities across India. Our story, values & commitment to quality local services.',
      keywords: 'about worklink, company story, mission, local services platform, skilled workers, India, quality services',
      canonicalUrl: 'https://www.worklinkindia.com/about'
    },

    contact: {
      title: 'Contact WorkLink | Customer Support & Help',
      description: 'Get in touch with WorkLink support team. Contact us for help with your account, technical issues, or business inquiries. 24/7 customer support.',
      keywords: 'contact worklink, customer support, help, technical support, business inquiries, contact information',
      canonicalUrl: 'https://www.worklinkindia.com/contact'
    },

    privacy: {
      title: 'Privacy Policy | WorkLink',
      description: 'Read WorkLink\'s privacy policy. Learn how we collect, use & protect your personal information on our platform.',
      keywords: 'privacy policy, data protection, personal information, user privacy',
      canonicalUrl: 'https://www.worklinkindia.com/privacy'
    },

    terms: {
      title: 'Terms of Service | WorkLink',
      description: 'Read WorkLink\'s terms of service. Understand the rules and guidelines for using our platform.',
      keywords: 'terms of service, user agreement, platform rules, guidelines',
      canonicalUrl: 'https://www.worklinkindia.com/terms'
    },

    // Location-based pages
    cityPage: {
      title: 'Skilled Workers in {city} | Local Services | WorkLink',
      description: 'Find verified skilled workers in {city}. Browse electricians, plumbers, carpenters & more. {workerCount}+ professionals available. Book instantly.',
      keywords: 'workers in {city}, {city} services, local workers {city}, skilled professionals {city}, home services {city}'
    },

    // Service-based pages
    servicePage: {
      title: '{service} Services | Verified Professionals | WorkLink',
      description: 'Find verified {service} professionals near you. Compare ratings, prices & reviews. {professionalCount}+ {service}s available. Book quality service today.',
      keywords: '{service}, {service} near me, {service} services, professional {service}, verified {service}, quality {service}'
    },

    // Blog/Content pages
    blog: {
      title: 'WorkLink Blog | Tips, Guides & Industry Insights',
      description: 'Expert tips, guides & insights for skilled workers and property owners. Learn about home maintenance, career growth & industry trends.',
      keywords: 'home maintenance tips, worker guides, industry insights, career advice, property maintenance, skilled worker tips',
      canonicalUrl: 'https://www.worklinkindia.com/blog'
    },

    blogPost: {
      title: '{postTitle} | WorkLink Blog',
      description: '{postExcerpt}',
      keywords: '{postKeywords}',
      type: 'article',
      section: 'Blog',
      publishedTime: '{publishedDate}',
      modifiedTime: '{modifiedDate}'
    }
  },

  // Common keywords for the platform
  commonKeywords: [
    'local workers',
    'skilled workers',
    'home services',
    'verified professionals',
    'India',
    'local services platform',
    'worker marketplace',
    'quality service',
    'trusted professionals',
    'instant booking'
  ],

  // Service categories for SEO
  services: {
    electrician: {
      keywords: 'electrician, electrical work, wiring, electrical repair, electrical installation, power issues, electrical maintenance',
      description: 'Professional electrician services'
    },
    plumber: {
      keywords: 'plumber, plumbing, pipe repair, water leakage, bathroom fitting, kitchen plumbing, drainage issues',
      description: 'Expert plumbing services'
    },
    carpenter: {
      keywords: 'carpenter, woodwork, furniture repair, cabinet making, door installation, wooden flooring',
      description: 'Skilled carpentry services'
    },
    painter: {
      keywords: 'painter, painting, wall painting, interior painting, exterior painting, home painting',
      description: 'Professional painting services'
    },
    'ac-repair': {
      keywords: 'AC repair, air conditioner, AC installation, AC maintenance, cooling system, HVAC',
      description: 'AC repair and maintenance services'
    },
    'home-cleaning': {
      keywords: 'home cleaning, house cleaning, deep cleaning, regular cleaning, sanitization',
      description: 'Professional home cleaning services'
    },
    gardening: {
      keywords: 'gardening, landscaping, plant care, garden maintenance, lawn care',
      description: 'Garden and landscaping services'
    },
    'appliance-repair': {
      keywords: 'appliance repair, washing machine repair, refrigerator repair, microwave repair',
      description: 'Home appliance repair services'
    }
  },

  // Major cities for local SEO
  cities: [
    'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad',
    'Jaipur', 'Surat', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane', 'Bhopal',
    'Visakhapatnam', 'Pimpri-Chinchwad', 'Patna', 'Vadodara', 'Ghaziabad', 'Ludhiana',
    'Agra', 'Nashik', 'Faridabad', 'Meerut', 'Rajkot', 'Kalyan-Dombivli', 'Vasai-Virar',
    'Varanasi', 'Srinagar', 'Dhanbad', 'Jodhpur', 'Amritsar', 'Raipur', 'Allahabad',
    'Coimbatore', 'Jabalpur', 'Gwalior', 'Vijayawada', 'Madurai', 'Guwahati', 'Chandigarh',
    'Hubli-Dharwad', 'Mysore', 'Tiruchirappalli', 'Bareilly', 'Aligarh', 'Tiruppur',
    'Moradabad', 'Jalandhar', 'Bhubaneswar', 'Salem', 'Mira-Bhayandar', 'Warangal',
    'Guntur', 'Bhiwandi', 'Saharanpur', 'Gorakhpur', 'Bikaner', 'Amravati', 'Noida',
    'Jamshedpur', 'Bhilai', 'Cuttack', 'Firozabad', 'Kochi', 'Nellore', 'Bhavnagar',
    'Dehradun', 'Durgapur', 'Asansol', 'Rourkela', 'Nanded', 'Kolhapur', 'Ajmer',
    'Akola', 'Gulbarga', 'Jamnagar', 'Ujjain', 'Loni', 'Siliguri', 'Jhansi',
    'Ulhasnagar', 'Jammu', 'Sangli-Miraj & Kupwad', 'Mangalore', 'Erode', 'Belgaum',
    'Ambattur', 'Tirunelveli', 'Malegaon', 'Gaya', 'Jalgaon', 'Udaipur', 'Maheshtala'
  ]
};

// Helper function to generate dynamic meta tags
export const generateSEOConfig = (pageType, dynamicData = {}) => {
  const baseConfig = seoConfig.pages[pageType] || seoConfig.pages.home;
  const config = { ...seoConfig.default, ...baseConfig };

  // Replace dynamic placeholders
  if (dynamicData) {
    Object.keys(config).forEach(key => {
      if (typeof config[key] === 'string') {
        config[key] = config[key].replace(/\{(\w+)\}/g, (match, placeholder) => {
          return dynamicData[placeholder] || match;
        });
      }
    });
  }

  return config;
};

// Helper function to generate location-based SEO
export const generateLocationSEO = (city, service = null) => {
  if (service) {
    const serviceConfig = seoConfig.services[service];
    return {
      title: `${serviceConfig?.description || service} in ${city} | WorkLink`,
      description: `Find verified ${service} professionals in ${city}. Compare ratings, prices & reviews. Book quality ${service} service today.`,
      keywords: `${serviceConfig?.keywords || service}, ${service} in ${city}, ${city} ${service}, local ${service} ${city}`
    };
  }

  return generateSEOConfig('cityPage', { city, workerCount: '500+' });
};

// Helper function to generate service-based SEO
export const generateServiceSEO = (service, location = null) => {
  const serviceConfig = seoConfig.services[service];
  const locationText = location ? ` in ${location}` : '';
  
  return {
    title: `${serviceConfig?.description || service}${locationText} | WorkLink`,
    description: `Find verified ${service} professionals${locationText}. Compare ratings, prices & reviews. Book quality service today.`,
    keywords: serviceConfig?.keywords || service
  };
};

export default seoConfig;