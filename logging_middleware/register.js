const axios = require("axios");

const EVAL_URL = "http://20.207.122.201/evaluation-service";

async function register() {
  console.log("Registering with Test Server...");

  // REPLACE THESE WITH YOUR ACTUAL DETAILS!
  const payload = {
    email: "nd9844@srmist.edu.in",
    name: "Nipun Dewangan",
    mobileNo: "7233847174",
    githubUsername: "rolex-67",
    rollNo: "RA2311047010074",
    accessCode: "QkbpxH",
  };

  try {
    const response = await axios.post(`${EVAL_URL}/register`, payload);
    console.log("\n✅ Registration Successful!");
    console.log("--------------------------------------------------");
    console.log(
      "Save these credentials immediately! You cannot retrieve them again.",
    );
    console.log(response.data);
    console.log("--------------------------------------------------");
    console.log(
      "\nNext Step: Put the clientID and clientSecret into a .env file and run `npm run auth`",
    );
  } catch (error) {
    console.error("\n❌ Registration Failed!");
    console.error(error?.response?.data || error.message);
  }
}

register();
