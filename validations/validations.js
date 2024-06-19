const { object, string, date, number, array, boolean, union } = require("zod");
const eventValidation = object({
  title: string().min(1).max(100),
  description: string().max(500),
  startDate: date(),
  endDate: date().optional(),
  frequency: union(["weekly", "daily"]),
  exceptions: array(
    object({
      date: date(),
      day: string().min(3).max(3),
      slots: array(
        object({
          startTime: string(),
          endTime: string(),
        })
      ),
    })
  ).optional(),
  timezone: string().min(1).max(100),
  daySlots: array(
    object({
      day: string().min(3).max(3),
      slots: array(
        object({
          startTime: string(),
          endTime: string(),
        })
      ),
    })
  ),
  maxPublicGuests: boolean().optional(),
  minPublicGuests: number().optional(),
  publicSession: boolean().optional(),
  publicPricing: number().optional(),
  maxPrivateGuests: boolean().optional(),
  minPrivateGuests: number().optional(),
  privateSession: boolean().optional(),
  privatePricing: number().optional(),
});

const bookingValidation = object({
  eventId: mongoose.Schema.Types.ObjectId,
  userId: mongoose.Schema.Types.ObjectId,
  status: union(["booked", "cancelled"]),
  bookedAt: date(),
  cancelledAt: date().optional(),
  day: string().min(3).max(3),
  startTime: string(),
  endTime: string(),
  adults: number().optional(),
  children: number().optional(),
  infants: number().optional(),
  privateSession: boolean().optional(),
  publicSession: boolean().optional(),
});

module.exports = { eventValidation, bookingValidation };
