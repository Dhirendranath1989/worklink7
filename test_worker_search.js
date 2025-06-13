// Using built-in fetch (Node.js 18+)

async function testWorkerSearch() {
  try {
    // Test search with location parameter
    const response = await fetch('http://localhost:5000/api/workers/search?skill=plumber&location=Bhubaneswar', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    if (data.success && data.workers.length > 0) {
      console.log('\nFirst worker location data:');
      console.log('Location object:', data.workers[0].location);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testWorkerSearch();