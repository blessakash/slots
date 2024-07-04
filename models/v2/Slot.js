const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const slotSchema = new Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event" },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  privateSlots: { type: Number },
  publicSlots: { type: Number },
  publicSession: { type: Boolean },
  privateSession: { type: Boolean },
});

// Define a virtual property that depends on field1
// slotSchema.virtual("status").get(function () {
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
const Slot = mongoose.model("SlotV2", slotSchema);

module.exports = Slot;
