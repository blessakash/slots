const mongoose = require("mongoose");
const { enumDays } = require("../constants");
const Schema = mongoose.Schema;
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const slotSchema = new Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event" },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  day: { type: String, enum: enumDays },
  date: { type: Date },
  spots: [
    {
      startTime: { type: String }, // Time in HH:MM 24h format
      endTime: { type: String }, // Time in HH:MM 24h format
      isAvailable: {
        type: Boolean,
        default: true,
      },
    },
  ],
});

// Define a virtual property that depends on field1
// slotSchema.virtual("totalSlotsTaken").get(function () {
//   // Define your logic based on field1
//   return this.adults + this.children + this.infants; // Example logic
// });

// Ensure virtual fields are included when converting to JSON
// slotSchema.set("toJSON", { getters: true });

// bookingSchema.pre("save", function (next) {
//   this.totalSlotsTaken =
//     this.adults ?? 0 + this.children ?? 0 + this.infants ?? 0;
//   next();
// });

slotSchema.plugin(aggregatePaginate);
// Create Event model
const Slot = mongoose.model("Slot", slotSchema);

module.exports = Slot;
