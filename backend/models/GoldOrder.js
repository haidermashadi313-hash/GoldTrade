const mongoose = require('mongoose');

const goldOrderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    type: {
      type: String,
      enum: ['buy', 'sell'],
      required: true,
    },

    goldType: {
      type: String,
      default: '24K',
    },

    weight: {
      type: Number,
      required: true,
    },

    pricePerGram: {
      type: Number,
      required: true,
    },

    totalAmount: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: ['pending', 'completed', 'cancelled'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('GoldOrder', goldOrderSchema);