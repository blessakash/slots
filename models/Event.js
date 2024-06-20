const mongoose = require("mongoose");
const { enumDays } = require("../constants");
const Schema = mongoose.Schema;
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");

// Define slot schema (embedded document)
const slotSchema = new Schema(
  {
    startTime: String, // Time in HH:MM format
    endTime: String, // Time in HH:MM format
  }
  // { _id: false }
);

// Define event schema
const eventSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  frequency: { type: String, enum: ["weekly", "daily"], default: "daily" }, // Only supporting weekly frequency for now
  exceptions: [
    {
      date: { type: Date },
      day: { type: String, enum: enumDays },
      slots: [slotSchema],
    },
  ],
  timezone: { type: String, required: true }, // Timezone of the event e.g., "America/New_York"
  daySlots: [
    {
      day: { type: String, enum: enumDays }, // Day of the week e.g., "MO" for Monday
      slots: [slotSchema],
    },
  ], // Different slots for each day of the week
  maxPublicGuests: {
    type: Number,
    default: 0,
  },
  minPublicGuests: {
    type: Number,
    default: 0,
  },
  publicSession: {
    type: Boolean,
    default: false,
  },
  publicPricing: {
    type: Number,
    default: 0,
  },
  maxPrivateGuests: {
    type: Number,
    default: 0,
  },
  minPrivateGuests: {
    type: Number,
    default: 0,
  },
  privateSession: {
    type: Boolean,
    default: false,
  },
  privatePricing: {
    type: Number,
    default: 0,
  },
});

// Define a virtual property that depends on field1
eventSchema.virtual("byDay").get(function () {
  // Define your logic based on field1
  return this.daySlots.map((l) => l.day); // Example logic
});

// Ensure virtual fields are included when converting to JSON
eventSchema.set("toJSON", { getters: true });

eventSchema.plugin(aggregatePaginate);

// Create Event model
const Event = mongoose.model("Event", eventSchema);

module.exports = Event;
