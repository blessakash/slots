const mongoose = require("mongoose");
const { enumDays } = require("../constants");
const Schema = mongoose.Schema;
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const bookingSchema = new Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    slotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Slot",
      required: true,
    },
    status: { type: String, enum: ["booked", "cancelled"], default: "booked" },
    bookedAt: {
      type: Date,
      required: true,
    },
    cancelledAt: {
      type: Date,
    },
    day: { type: String, enum: enumDays, required: true },
    startTime: {
      type: String, // Time in HH:MM format
      required: true,
    },
    endTime: {
      type: String, // Time in HH:MM format
      required: true,
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
bookingSchema.plugin(aggregatePaginate);
// Create Event model
const Bookings = mongoose.model("Bookings", bookingSchema);

module.exports = Bookings;
