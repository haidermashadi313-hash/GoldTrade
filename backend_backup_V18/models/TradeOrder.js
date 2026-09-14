```javascript
const mongoose = require("mongoose");

const tradeOrderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    username: {
      type: String,
      required: true,
    },

    tradeType: {
      type: String,
      enum: ["BUY", "SELL"],
      required: true,
    },

    grams: {
      type: Number,
      required: true,
    },

    pricePerGram: {
      type: Number,
      required: true,
    },

    totalPKR: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },

    adminNote: {
      type: String,
      default: "",
    },

    approvedAt: Date,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("TradeOrder", tradeOrderSchema);
```
