// Using built-in fetch (Node.js 18+)

async function testWorkerProfile() {
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
      console.log('Profile response status:', profileResponse.status);
      
      if (profileData.success) {
        console.log('\nWorker Profile Data:');
        console.log('Name:', profileData.worker.name);
        console.log('Skills:', profileData.worker.skills);
        console.log('Location object:', JSON.stringify(profileData.worker.location, null, 2));
        
        console.log('\nAddress breakdown:');
        console.log('  Address:', profileData.worker.location.address);
        console.log('  City:', profileData.worker.location.city);
        console.log('  District:', profileData.worker.location.district);
        console.log('  Block:', profileData.worker.location.block);
        console.log('  State:', profileData.worker.location.state);
        console.log('  Pincode:', profileData.worker.location.pincode);
        console.log('  ZipCode:', profileData.worker.location.zipCode);
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

testWorkerProfile();