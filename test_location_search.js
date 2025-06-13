// Using built-in fetch (Node.js 18+)

async function testLocationSearch() {
  try {
    console.log('Testing location search with "Kalahandi"...');
    
    // Test search with location parameter that exists in the database
    const response = await fetch('http://localhost:5000/api/workers/search?skill=electrician&location=Kalahandi', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Total workers found:', data.total);
    
    if (data.success && data.workers.length > 0) {
      console.log('\nWorkers found:');
      data.workers.forEach((worker, index) => {
        console.log(`Worker ${index + 1}: ${worker.fullName}`);
        console.log('  Address:', worker.location.address);
        console.log('  City:', worker.location.city);
        console.log('  District:', worker.location.district);
        console.log('  State:', worker.location.state);
        console.log('  Skills:', worker.skills);
        console.log('');
      });
    } else {
      console.log('No workers found');
      console.log('Response:', data);
    }
    
    console.log('\n--- Testing with "Odisha" ---');
    
    // Test search with state name
    const response2 = await fetch('http://localhost:5000/api/workers/search?skill=electrician&location=Odisha', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    const data2 = await response2.json();
    console.log('Response status:', response2.status);
    console.log('Total workers found:', data2.total);
    
    if (data2.success && data2.workers.length > 0) {
      console.log('\nWorkers found in Odisha:');
      data2.workers.forEach((worker, index) => {
        console.log(`Worker ${index + 1}: ${worker.fullName} - ${worker.location.city}, ${worker.location.state}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testLocationSearch();