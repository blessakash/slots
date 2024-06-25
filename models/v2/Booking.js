const mongoose = require("mongoose");
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
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
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
// bookingSchema.virtual("totalSlot").get(function () {
//   // Define your logic based on field1
//   return this.adults + this.children + this.infants; // Example logic
// });

// // Ensure virtual fields are included when converting to JSON
// bookingSchema.set("toJSON", { getters: true });

// bookingSchema.pre("save", function (next) {
//   this.totalSlotsTaken =
//     this.adults ?? 0 + this.children ?? 0 + this.infants ?? 0;
//   next();
// });
bookingSchema.plugin(aggregatePaginate);
// Create Event model
const Booking = mongoose.model("BookingsV2", bookingSchema);

module.exports = Booking;
