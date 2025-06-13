// Using built-in fetch (Node.js 18+)

async function debugWorkerFields() {
  try {
    // First, get a list of workers to find a valid worker ID
    console.log('Getting worker list...');
    const searchResponse = await fetch('http://localhost:5000/api/workers/search?skill=electrician', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    const searchData = await searchResponse.json();
    
    if (searchData.success && searchData.workers.length > 0) {
      const workerId = searchData.workers[0]._id;
      console.log('Testing worker profile for ID:', workerId);
      
      // Test the worker profile endpoint
      const profileResponse = await fetch(`http://localhost:5000/api/workers/${workerId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const profileData = await profileResponse.json();
      
      if (profileData.success) {
        console.log('\n=== FULL WORKER OBJECT ===');
        console.log(JSON.stringify(profileData.worker, null, 2));
        
        console.log('\n=== LOCATION ANALYSIS ===');
        console.log('worker.location:', profileData.worker.location);
        console.log('worker.address:', profileData.worker.address);
        console.log('worker.pincode:', profileData.worker.pincode);
        console.log('worker.zipCode:', profileData.worker.zipCode);
        console.log('worker.location?.zipCode:', profileData.worker.location?.zipCode);
      } else {
        console.log('Error:', profileData.message);
      }
    } else {
      console.log('No workers found in search');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

debugWorkerFields();