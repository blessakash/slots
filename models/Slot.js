const mongoose = require("mongoose");
const { enumDays } = require("../constants");
const Schema = mongoose.Schema;

const slotSchema = new Schema(
  {
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event" },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    day: { type: String, enum: enumDays },
    date: { type: Date },
    isException: { type: Boolean },
    startTime: {
      type: String, // Time in HH:MM format
    },
    endTime: {
      type: String, // Time in HH:MM format
    },
    privateSession: {
      type: Boolean,
      default: false,
    },
    publicSession: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Define a virtual property that depends on field1
slotSchema.virtual("totalSlotsTaken").get(function () {
  // Define your logic based on field1
  return this.adults + this.children + this.infants; // Example logic
});

// Ensure virtual fields are included when converting to JSON
slotSchema.set("toJSON", { getters: true });

// bookingSchema.pre("save", function (next) {
//   this.totalSlotsTaken =
//     this.adults ?? 0 + this.children ?? 0 + this.infants ?? 0;
//   next();
// });

// Create Event model
const Slot = mongoose.model("Slot", slotSchema);

module.exports = Slot;
