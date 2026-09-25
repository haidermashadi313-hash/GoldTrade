const mongoose = require("mongoose");
require("dotenv").config();

const Settings = require("./models/Settings");

async function createSettings() {
  await mongoose.connect(process.env.MONGO_URI);

  const exists = await Settings.findOne();

  if (!exists) {
    await Settings.create({
      buyGoldPrice: 24500,
      sellGoldPrice: 24250,
      goldPriceUSD: 3400,
      usdToPkr: 285,
      goldTradingEnabled: true,
      marketStatus: "OPEN",
    });

    console.log("Settings created successfully.");
  } else {
    console.log("Settings already exist.");
  }

  await mongoose.disconnect();
}

createSettings();