require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const username = "imran1122";
    const newPassword = "123123D";

    const hash = await bcrypt.hash(newPassword, 10);

    // Direct Mongo update (Mongoose middleware bypass)
    const result = await User.collection.updateOne(
      { username: username.toLowerCase() },
      { $set: { password: hash } }
    );

    console.log("Update Result:", result);

    const user = await User.findOne({ username: username.toLowerCase() });

    const ok = await bcrypt.compare(newPassword, user.password);

    console.log("Password Match:", ok);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();