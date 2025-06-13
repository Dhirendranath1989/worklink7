// Using built-in fetch (Node.js 18+)

async function testAllWorkers() {
  try {
    // Test search with just skill parameter to see all workers
    const response = await fetch('http://localhost:5000/api/workers/search?skill=electrician', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Total workers found:', data.total);
    
    if (data.success && data.workers.length > 0) {
      console.log('\nFirst worker data:');
      console.log('Name:', data.workers[0].fullName);
      console.log('Skills:', data.workers[0].skills);
      console.log('Location object:', data.workers[0].location);
      
      console.log('\nAll workers location data:');
      data.workers.forEach((worker, index) => {
        console.log(`Worker ${index + 1} (${worker.fullName}):`, worker.location);
      });
    } else {
      console.log('No workers found or error occurred');
      console.log('Response:', data);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAllWorkers();