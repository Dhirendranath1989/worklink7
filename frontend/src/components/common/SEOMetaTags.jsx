import { Helmet } from 'react-helmet-async';

const SEOMetaTags = ({
  title = 'WorkLink - Connecting Skills with Needs',
  description = 'Find skilled local workers or discover your next opportunity. Join India\'s fastest-growing platform for local services with 50,000+ verified workers.',
  keywords = 'local workers, skilled workers, jobs, services, electrician, plumber, carpenter, home services, India, local services platform',
  canonicalUrl,
  ogImage = '/og-image.jpg',
  twitterImage = '/twitter-image.jpg',
  type = 'website',
  author = 'WorkLink',
  publishedTime,
  modifiedTime,
  section,
  tags,
  locale = 'en_IN',
  siteName = 'WorkLink',
  twitterHandle = '@worklink_in',
  structuredData,
  noindex = false,
  nofollow = false
}) => {
  // Generate robots content
  const robotsContent = [
    noindex ? 'noindex' : 'index',
    nofollow ? 'nofollow' : 'follow'
  ].join(', ');

  // Default structured data for local business
  const defaultStructuredData = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "WorkLink",
    "description": "India's fastest-growing platform connecting skilled local workers with opportunities",
    "url": "https://worklinkindia.com",
    "logo": "https://worklinkindia.com/logo.png",
    "image": "https://worklinkindia.com/og-image.jpg",
    "telephone": "+91-9938545805",
    "address": {
      "@type": "LocalBusiness",
      "addressCountry": "IN",
      "addressRegion": "India"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "20.5937",
      "longitude": "78.9629"
    },
    "areaServed": {
      "@type": "Country",
      "name": "India"
    },
    "serviceType": [
      "Local Services Platform",
      "Worker Marketplace",
      "Home Services",
      "Skilled Labor Services"
    ],
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "reviewCount": "10000",
      "bestRating": "5",
      "worstRating": "1"
    },
    "priceRange": "₹₹",
    "openingHours": "Mo-Su 00:00-23:59",
    "sameAs": [
      "https://www.facebook.com/worklink",
      "https://www.twitter.com/worklink_in",
      "https://www.linkedin.com/company/worklink",
      "https://www.instagram.com/worklink_official"
    ]
  };

  const finalStructuredData = structuredData || defaultStructuredData;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={author} />
      <meta name="robots" content={robotsContent} />
      <meta name="googlebot" content={robotsContent} />
      
      {/* Canonical URL */}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      
      {/* Language and Locale */}
      <meta name="language" content="English" />
      <meta httpEquiv="content-language" content="en-IN" />
      
      {/* Open Graph Meta Tags */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content={locale} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={`${title} - WorkLink Platform`} />
      
      {/* Article specific Open Graph tags */}
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
      {section && <meta property="article:section" content={section} />}
      {tags && tags.map((tag, index) => (
        <meta key={index} property="article:tag" content={tag} />
      ))}
      
      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={twitterHandle} />
      <meta name="twitter:creator" content={twitterHandle} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={twitterImage} />
      <meta name="twitter:image:alt" content={`${title} - WorkLink Platform`} />
      
      {/* Additional SEO Meta Tags */}
      <meta name="theme-color" content="#3B82F6" />
      <meta name="msapplication-TileColor" content="#3B82F6" />
      <meta name="application-name" content="WorkLink" />
      <meta name="apple-mobile-web-app-title" content="WorkLink" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      
      {/* Geo Meta Tags for Local SEO */}
      <meta name="geo.region" content="IN" />
      <meta name="geo.country" content="India" />
      <meta name="geo.placename" content="India" />
      <meta name="ICBM" content="20.5937, 78.9629" />
      
      {/* Business/Local SEO Meta Tags */}
      <meta name="rating" content="4.8" />
      <meta name="distribution" content="global" />
      <meta name="target" content="all" />
      <meta name="audience" content="all" />
      <meta name="coverage" content="Worldwide" />
      <meta name="directory" content="submission" />
      <meta name="category" content="Local Services, Marketplace, Home Services" />
      
      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(finalStructuredData)}
      </script>
      
      {/* Preconnect to external domains for performance */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://images.unsplash.com" />
      
      {/* DNS Prefetch for better performance */}
      <link rel="dns-prefetch" href="//www.google-analytics.com" />
      <link rel="dns-prefetch" href="//www.googletagmanager.com" />
      <link rel="dns-prefetch" href="//fonts.googleapis.com" />
      <link rel="dns-prefetch" href="//fonts.gstatic.com" />
    </Helmet>
  );
};

export default SEOMetaTags;