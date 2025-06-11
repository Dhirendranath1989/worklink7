const axios = require('axios');

async function testWorkerAPI() {
  console.log('Starting API test...');
  try {
    console.log('Making request to API...');
    // Test the worker profile endpoint
    const response = await axios.get('http://localhost:5000/api/workers/6849380e6da4161ea10d1c03');
    
    console.log('API Response Status:', response.status);
    console.log('Worker Data:');
    console.log('- Name:', response.data.worker?.name);
    console.log('- WorkPhotos:', response.data.worker?.workPhotos);
    console.log('- WorkPhotos Length:', response.data.worker?.workPhotos ? response.data.worker.workPhotos.length : 0);
    console.log('- Certificates:', response.data.worker?.certificates);
    console.log('- Certificates Length:', response.data.worker?.certificates ? response.data.worker.certificates.length : 0);
    console.log('- Documents:', response.data.worker?.documents);
    console.log('- Documents Length:', response.data.worker?.documents ? response.data.worker.documents.length : 0);
    
    if (response.data.worker?.workPhotos?.length > 0) {
      console.log('First work photo URL:', response.data.worker.workPhotos[0]);
    }
    if (response.data.worker?.certificates && response.data.worker.certificates.length > 0) {
      console.log('First certificate URL:', response.data.worker.certificates[0]);
    }
    if (response.data.worker?.documents && response.data.worker.documents.length > 0) {
      console.log('First document URL:', response.data.worker.documents[0]);
    }
    
  } catch (error) {
    console.error('Error testing API:', error.message);
    console.error('Full error:', error);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    } else if (error.request) {
      console.error('Request was made but no response received:', error.request);
    } else {
      console.error('Error setting up request:', error.message);
    }
  }
}

testWorkerAPI();