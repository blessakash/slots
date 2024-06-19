const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bookingSchema = new Schema(
  {
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event" },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: { type: String, enum: ["booked", "cancelled"], default: "booked" },
    bookedAt: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
    day: { type: String, enum: enumDays },
    startTime: {
      type: String, // Time in HH:MM format
    },
    endTime: {
      type: String, // Time in HH:MM format
    },
    adults: {
      type: Number,
      default: 0,
    },
    children: {
      type: Number,
      default: 0,
    },
    infants: {
      type: Number,
      default: 0,
    },
    // totalSlotsTaken: {
    //   type: Number,
    //   default: 0,
    // },
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
bookingSchema.virtual("totalSlotsTaken").get(function () {
  // Define your logic based on field1
  return this.adults + this.children + this.infants; // Example logic
});

// Ensure virtual fields are included when converting to JSON
bookingSchema.set("toJSON", { getters: true });

// bookingSchema.pre("save", function (next) {
//   this.totalSlotsTaken =
//     this.adults ?? 0 + this.children ?? 0 + this.infants ?? 0;
//   next();
// });

// Create Event model
const Bookings = mongoose.model("Bookings", bookingSchema);

module.exports = Bookings;
