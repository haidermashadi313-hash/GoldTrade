const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const User = require("./models/User");

async function resetPassword() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const hash = await bcrypt.hash("123123", 10);

    const result = await User.updateOne(
      { username: "imran1122" },
      { $set: { password: hash } }
    );

    console.log("RESULT:", result);

    await mongoose.disconnect();
    console.log("Password reset successful.");
  } catch (err) {
    console.error(err);
  }
}

resetPassword();