require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

async function resetPassword() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const hashedPassword = await bcrypt.hash("Hashi12345", 10);

    const result = await User.updateOne(
      { username: "hashi" },
      { $set: { password: hashedPassword, status: "Active" } }
    );

    console.log("✅ Password Reset Successfully");
    console.log(result);

    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
}

resetPassword();