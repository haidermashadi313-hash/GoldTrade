require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("./models/User");

async function createAdmin() {
  try {
    console.log("🔄 Connecting MongoDB...");

    await mongoose.connect(process.env.MONGO_URI);

    console.log("✅ MongoDB Connected");

    const adminEmail = "admin@goldtrade.com";
    const adminPassword = "Admin@110";

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    let admin = await User.findOne({ email: adminEmail });

    if (admin) {
      admin.username = "GoldTradeAdmin";
      admin.password = hashedPassword;
      admin.role = "admin";
      admin.status = "Active";

      // Keep balances if account already exists
      admin.walletBalance = admin.walletBalance || 0;
      admin.usdtBalance = admin.usdtBalance || 0;
      admin.goldBalance = admin.goldBalance || 0;
      admin.totalDeposit = admin.totalDeposit || 0;
      admin.totalWithdraw = admin.totalWithdraw || 0;

      await admin.save();

      console.log("✅ Existing Admin Updated Successfully");
    } else {
      admin = await User.create({
        username: "GoldTradeAdmin",
        email: adminEmail,
        password: hashedPassword,
        role: "admin",
        status: "Active",

        walletBalance: 0,
        usdtBalance: 0,
        goldBalance: 0,

        goldAveragePrice: 0,
        goldProfitLoss: 0,

        totalDeposit: 0,
        totalWithdraw: 0,
      });

      console.log("✅ New Admin Account Created");
    }

    console.log("==================================");
    console.log("👤 Username :", admin.username);
    console.log("📧 Email    :", admin.email);
    console.log("🔑 Password :", adminPassword);
    console.log("🛡️ Role     :", admin.role);
    console.log("🟢 Status   :", admin.status);
    console.log("==================================");

    await mongoose.disconnect();

    console.log("✅ MongoDB Disconnected");
    process.exit(0);
  } catch (err) {
    console.error("==================================");
    console.error("❌ CREATE ADMIN ERROR");
    console.error(err.message);
    console.error("==================================");
    process.exit(1);
  }
}

createAdmin();