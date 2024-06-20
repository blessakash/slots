const Bookings = require("../models/Bookings");
const Event = require("../models/Event");
const {
  eventValidation,
  bookingValidation,
} = require("../validations/validations.js");
const express = require("express");
const router = express.Router();
const moment = require("moment-timezone");
const { AggregatePaginate } = require("mongoose-aggregate-paginate-v2");

router.post("/event", async (req, res) => {
  try {
    console.log(req.body);
    const { error, value } = eventValidation.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      // Handle validation errors
      const formattedErrors = error.details.map((detail) => ({
        field: detail.context.key,
        message: detail.message,
      }));
      console.log(formattedErrors);
      return res.status(400).json({ errors: formattedErrors });
    } else {
      // Validation passed, proceed with the validated 'value'
      console.log("Validation passed:", value);
      console.log(value);
      const event = await Event.create(value);
      res.status(201).json(event);
    }
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.errors });
  }
});

router.post("/update/event", async (req, res) => {
  const { id } = req.params;
  try {
    const eventData = eventSchema.parse(req.body);
    const event = await Event.findByIdAndUpdate(id, eventData, { new: true });
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    res.json(event);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.errors });
  }
});

router.post("/archive/:eventId", async (req, res) => {
  const { id } = req.params;
  try {
    const event = await Event.findByIdAndUpdate(
      id,
      { archived: true },
      { new: true }
    );
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    res.json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

const availableToday = async (req, res) => {
  const today = new Date();
  const todayString = today.toISOString().split("T")[0]; // Get today's date in YYYY-MM-DD format

  try {
    const events = await Event.find({
      $and: [
        { startDate: { $lte: today } }, // Events that started on or before today
        {
          $or: [
            { endDate: { $gte: today } }, // Events that end today or after today
            { endDate: { $exists: false } }, // Events that do not have an end date
          ],
        },
        {
          $or: [
            { "daySlots.day": { $exists: false } }, // Events without specific day slots
            {
              daySlots: {
                $elemMatch: {
                  day: todayString,
                  slots: { $exists: true, $not: { $size: 0 } },
                },
              },
            },
          ],
        },
      ],
    });
    res.json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};

router.post("/booking", async (req, res) => {
  try {
    console.log(req.body);
    const { error, value } = bookingValidation.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      // Handle validation errors
      const formattedErrors = error.details.map((detail) => ({
        field: detail.context.key,
        message: detail.message,
      }));
      console.log(formattedErrors);
      return res.status(400).json({ errors: formattedErrors });
    } else {
      // Validation passed, proceed with the validated 'value'
      console.log("Validation passed:", value);
      console.log(value);
      const event = await Bookings.create(value);
      res.status(201).json(event);
    }
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.errors });
  }
});

// Utility function to generate slots for a given event
// const generateSlotsForEvent = (event, startDate, endDate) => {
//   const generatedSlots = [];

//   // Define the start and end moment for generating slots
//   let currentMoment = moment(startDate).tz(event.timezone);
//   const endMoment = moment(endDate).tz(event.timezone);

//   while (currentMoment.isSameOrBefore(endMoment)) {
//     const dayOfWeek = currentMoment.format("dd").toUpperCase();

//     // Check if the day is included in event's byDay array
//     if (event.byDay.includes(dayOfWeek)) {
//       const daySlot = event.daySlots.find((ds) => ds.day === dayOfWeek);
//       if (daySlot) {
//         daySlot.slots.forEach((slot) => {
//           const slotStart = currentMoment
//             .clone()
//             .startOf("day")
//             .add(slot.startTime, "hours");
//           const slotEnd = currentMoment
//             .clone()
//             .startOf("day")
//             .add(slot.endTime, "hours");
//           const generatedSlot = {
//             startTime: slotStart.toDate(),
//             endTime: slotEnd.toDate(),
//             maxBookings: slot.maxBookings,
//             bookings: [],
//           };

//           // Check for exceptions for this slot
//           const exception = event.exceptions.find((ex) =>
//             moment(ex.date).isSame(currentMoment, "day")
//           );
//           if (exception) {
//             const exceptionSlot = exception.slots.find(
//               (es) =>
//                 es.startTime === slot.startTime && es.endTime === slot.endTime
//             );
//             if (exceptionSlot) {
//               generatedSlot.maxBookings = exceptionSlot.maxBookings;
//               generatedSlot.bookings = exceptionSlot.bookings;
//             }
//           }

//           generatedSlots.push(generatedSlot);
//         });
//       }
//     }

//     // Move to the next week
//     currentMoment.add(event.interval, "weeks");
//   }

//   return generatedSlots;
// };

// const getSlots = async (req, res) => {
//   const { eventId } = req.params;
//   const { startDate, endDate } = req.body;

//   try {
//     const event = await Event.findById(eventId);
//     if (!event) {
//       return res.status(404).send("Event not found");
//     }

//     const generatedSlots = generateSlotsForEvent(event, startDate, endDate);
//     event.slots = generatedSlots;
//     await event.save();
//     res.send(event);
//   } catch (error) {
//     res.status(400).send(error);
//   }
// };

// const getSlots = async (req, res) => {
//   try {
//     const { startDate, endDate } = req.query;

//     // Query events within the date range
//     const events = await Event.find({
//       startDate: { $gte: new Date(startDate) },
//       endDate: { $lte: new Date(endDate) },
//     });

//     // Prepare response object
//     const slotsData = {};

//     // Iterate through each event to calculate booking counts
//     for (const event of events) {
//       for (const daySlot of event.daySlots) {
//         const day = daySlot.day;
//         if (!slotsData[day]) {
//           slotsData[day] = [];
//         }
//         for (const slot of daySlot.slots) {
//           const slotKey = `${day}_${slot.startTime}_${slot.endTime}`;
//           if (!slotsData[day][slotKey]) {
//             slotsData[day][slotKey] = {
//               startTime: slot.startTime,
//               endTime: slot.endTime,
//               bookingsCount: 0,
//             };
//           }
//         }
//       }

//       // Query bookings for the event
//       const bookings = await Booking.find({ eventId: event._id });

//       // Update bookings count in slotsData
//       for (const booking of bookings) {
//         const slotKey = `${booking.day}_${booking.startTime}_${booking.endTime}`;
//         if (slotsData[booking.day] && slotsData[booking.day][slotKey]) {
//           slotsData[booking.day][slotKey].bookingsCount +=
//             booking.totalSlotsTaken;
//         }
//       }
//     }

//     // Flatten slotsData object into an array
//     const slots = [];
//     for (const day in slotsData) {
//       for (const slotKey in slotsData[day]) {
//         slots.push({
//           day,
//           startTime: slotsData[day][slotKey].startTime,
//           endTime: slotsData[day][slotKey].endTime,
//           bookingsCount: slotsData[day][slotKey].bookingsCount,
//         });
//       }
//     }

//     // Send the response
//     res.json(slots);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Server Error" });
//   }
// };

// const getSlots = async (req, res) => {
//   try {
//     const eventId = req.params.eventId;
//     const { startDate, endDate } = req.query;

//     // Find the event by eventId
//     const event = await Event.findById(eventId);
//     if (!event) {
//       return res.status(404).json({ message: "Event not found" });
//     }

//     // Prepare response object for slots with their booked counts
//     const slotsData = {};

//     // Iterate through each day slot of the event
//     for (const daySlot of event.daySlots) {
//       const day = daySlot.day;

//       // Initialize slotsData for the current day if not already initialized
//       if (!slotsData[day]) {
//         slotsData[day] = [];
//       }

//       // Iterate through each slot of the current day
//       for (const slot of daySlot.slots) {
//         const slotKey = `${day}_${slot.startTime}_${slot.endTime}`;
//         slotsData[day].push({
//           startTime: slot.startTime,
//           endTime: slot.endTime,
//           bookingsCount: 0,
//         });
//       }
//     }

//     // Find bookings for the event within the specified date range
//     const bookings = await Booking.find({
//       eventId,
//       bookedAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
//     });

//     // Update slotsData with booked counts
//     for (const booking of bookings) {
//       const { day, startTime, endTime, totalSlotsTaken } = booking;
//       const slotKey = `${day}_${startTime}_${endTime}`;
//       const slotToUpdate = slotsData[day].find(
//         (slot) => slot.startTime === startTime && slot.endTime === endTime
//       );
//       if (slotToUpdate) {
//         slotToUpdate.bookingsCount += totalSlotsTaken;
//       }
//     }

//     // Flatten slotsData into a single array for response
//     const slots = [];
//     for (const day in slotsData) {
//       slots.push(...slotsData[day]);
//     }

//     // Send the response
//     res.json(slots);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Server Error" });
//   }
// };
router.get("/:eventId/check-available-slots-today", async (req, res) => {
  const { eventId } = req.params;
  const currentTime = moment().tz("UTC"); // Current time in UTC

  try {
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).send({ error: "Event not found" });
    }

    const bookings = await Bookings.find({
      eventId,
      bookedAt: { $gte: currentTime.startOf("day").toDate() }, // Filter bookings for today onwards
      $or: [{ publicSession: true }, { privateSession: true }],
    });

    const availableSlots = {};
    const timezone = event.timezone;
    const today = moment().tz(timezone).startOf("day");

    const dayOfWeek = today.format("ddd").toUpperCase();
    const daySlots = event.daySlots.find(
      (daySlot) => daySlot.day === dayOfWeek
    );
    console.log(daySlots, dayOfWeek);
    if (!daySlots) {
      return res.status(404).send({ error: "Day slots not defined for today" });
    }

    daySlots.slots.forEach((slot) => {
      const slotStartTime = moment(slot.startTime, "HH:mm");
      const slotEndTime = moment(slot.endTime, "HH:mm");

      if (currentTime.isAfter(slotEndTime)) {
        return; // Skip past slots
      }

      const bookedPublicCount = bookings.filter(
        (booking) =>
          booking.startTime === slot.startTime &&
          booking.endTime === slot.endTime &&
          booking.publicSession
      ).length;

      const bookedPrivateCount = bookings.filter(
        (booking) =>
          booking.startTime === slot.startTime &&
          booking.endTime === slot.endTime &&
          booking.privateSession
      ).length;

      const remainingPublicSlots = event.maxPublicGuests - bookedPublicCount;
      const remainingPrivateSlots = event.maxPrivateGuests - bookedPrivateCount;

      if (remainingPublicSlots > 0 || remainingPrivateSlots > 0) {
        availableSlots[slot.startTime] = {
          remainingPublicSlots,
          remainingPrivateSlots,
        };
      }
    });

    res.send(availableSlots);
  } catch (error) {
    console.error("Error checking available slots:", error);
    res.status(500).send({ error: "Internal server error" });
  }
});

router.get("/check-all-available-slots", async (req, res) => {
  const currentTime = moment().tz("UTC");

  try {
    const aggregationPipeline = Bookings.aggregate([
      { $match: { startTime: { $gte: currentTime.toDate() } } },
      {
        $group: {
          _id: {
            eventId: "$eventId",
            startTime: "$startTime",
            endTime: "$endTime",
          },
          totalPublic: {
            $sum: { $cond: { if: "$publicSession", then: 1, else: 0 } },
          },
          totalPrivate: {
            $sum: { $cond: { if: "$privateSession", then: 1, else: 0 } },
          },
        },
      },
      {
        $lookup: {
          from: "events",
          localField: "_id.eventId",
          foreignField: "_id",
          as: "event",
        },
      },
      { $unwind: "$event" },
      {
        $project: {
          _id: 0,
          eventId: "$_id.eventId",
          eventName: "$event.title",
          startTime: "$_id.startTime",
          endTime: "$_id.endTime",
          remainingPublicSlots: {
            $subtract: ["$event.maxPublicGuests", "$totalPublic"],
          },
          remainingPrivateSlots: {
            $subtract: ["$event.maxPrivateGuests", "$totalPrivate"],
          },
        },
      },
      {
        $match: {
          $or: [
            { remainingPublicSlots: { $gt: 0 } },
            { remainingPrivateSlots: { $gt: 0 } },
          ],
        },
      },
    ]);

    const options = {
      page: req.query.page || 1,
      limit: req.query.limit || 10,
      collation: { locale: "en" },
    };

    const { docs, totalPages } = await Bookings.aggregatePaginate(
      aggregationPipeline,
      options
    );

    res.json({ availableEvents: docs, totalPages });
  } catch (error) {
    console.error("Error checking available slots for all events:", error);
    res.status(500).send({ error: "Internal server error" });
  }
});

router.get("");

module.exports = router;
