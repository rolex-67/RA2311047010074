const axios = require('axios');
require('dotenv').config();

const EVAL_URL = 'http://20.207.122.201/evaluation-service';

async function getAuthToken() {
    console.log('Fetching Authorization Token...');
    
    // We can just hardcode the client credentials here to be 100% sure it works
    const clientID = "01d5b690-1945-4551-8c07-b99c38d082b3";
    const clientSecret = "zUqmNEKQPufQXtyG";

    // Replace with exactly what you used in registration
    const payload = {
        "email": "nd9844@srmist.edu.in", 
        "name": "Nipun Dewangan",
        "rollNo": "RA2311047010074",
        "accessCode": "QkbpxH",
        "clientID": clientID,
        "clientSecret": clientSecret
    };

    try {
        const response = await axios.post(`${EVAL_URL}/auth`, payload);
        console.log('\n✅ Authentication Successful!');
        console.log('--------------------------------------------------');
        console.log('Your Access Token (Valid for a limited time):');
        console.log(response.data.access_token);
        console.log('--------------------------------------------------');
        
        // Let's write the token directly to the root .env file automatically for the user!
        const fs = require('fs');
        const path = require('path');
        const envPath = path.join(__dirname, '..', '.env');
        fs.writeFileSync(envPath, `ACCESS_TOKEN=${response.data.access_token}\n`, { flag: 'w' });
        console.log(`\n🎉 I have automatically saved the ACCESS_TOKEN to your root .env file (${envPath})!`);
        console.log('You can now run the scheduler and priority inbox scripts directly.');
        
    } catch (error) {
        console.error('\n❌ Authentication Failed!');
        console.error(error?.response?.data || error.message);
    }
}

getAuthToken();
