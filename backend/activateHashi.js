// activateHashi.js
const mongoose = require("mongoose");
require("dotenv").config();

const User = require("./models/User");

async function activateUser() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const result = await User.updateOne(
      { username: "hashi" },
      {
        $set: {
          status: "Active",
        },
      }
    );

    console.log("✅ User Activated Successfully");
    console.log(result);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

activateUser();