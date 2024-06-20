const { mongoose } = require("mongoose");
const Joi = require("joi");
const { enumDays } = require("../constants");

const slotSchema = Joi.object({
  startTime: Joi.string()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .required()
    .label("Start Time"),
  endTime: Joi.string()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .required()
    .label("End Time"),
}).label("Slot");
const eventValidation = Joi.object({
  title: Joi.string().required().label("Title"),
  description: Joi.string().allow("").label("Description"),
  startDate: Joi.date().required().label("Start Date"),
  endDate: Joi.date().label("End Date"),
  frequency: Joi.string()
    .valid("weekly", "daily")
    .default("daily")
    .label("Frequency"),
  exceptions: Joi.array()
    .items(
      Joi.object({
        date: Joi.date().label("Exception Date"),
        day: Joi.string()
          .valid(...enumDays)
          .label("Exception Day"),
        slots: Joi.array().items(slotSchema).label("Exception Slots"),
      })
    )
    .label("Exceptions"),
  timezone: Joi.string().required().label("Timezone"),
  daySlots: Joi.array()
    .items(
      Joi.object({
        day: Joi.string()
          .valid(...enumDays)
          .label("Day of the Week"),
        slots: Joi.array().items(slotSchema).label("Day Slots"),
      })
    )
    .label("Day Slots"),
  maxPublicGuests: Joi.number().integer().default(0).label("Max Public Guests"),
  minPublicGuests: Joi.number()
    .integer()
    .min(0)
    .default(0)
    .label("Min Public Guests"),
  publicSession: Joi.boolean().default(false).label("Public Session"),
  publicPricing: Joi.number().min(0).default(0).label("Public Pricing"),
  maxPrivateGuests: Joi.number()
    .integer()
    .min(0)
    .default(0)
    .label("Max Private Guests"),
  minPrivateGuests: Joi.number()
    .integer()
    .min(0)
    .default(0)
    .label("Min Private Guests"),
  privateSession: Joi.boolean().default(false).label("Private Session"),
  privatePricing: Joi.number().min(0).default(0).label("Private Pricing"),
});

const bookingValidation = Joi.object({
  eventId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .label("Event ID"),
  userId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .label("User ID"),
  status: Joi.string()
    .valid("booked", "cancelled")
    .default("booked")
    .label("Status"),
  bookedAt: Joi.date().label("Booked At"),
  cancelledAt: Joi.date().label("Cancelled At"),
  day: Joi.string()
    .valid(...enumDays)
    .label("Day"),
  startTime: Joi.string()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .label("Start Time"),
  endTime: Joi.string()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .label("End Time"),
  adults: Joi.number().integer().min(0).default(0).label("Adults"),
  children: Joi.number().integer().min(0).default(0).label("Children"),
  infants: Joi.number().integer().min(0).default(0).label("Infants"),
  privateSession: Joi.boolean().default(false).label("Private Session"),
  publicSession: Joi.boolean().default(false).label("Public Session"),
}).label("Booking");

module.exports = { eventValidation, bookingValidation };
