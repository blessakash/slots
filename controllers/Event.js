const Bookings = require("../models/Bookings");
const Event = require("../models/Event");
const {
  eventValidation,
  bookingValidation,
} = require("../validations/validations");

const createEvent = async (req, res) => {
  try {
    const eventData = eventValidation.parse(req.body);
    const event = await Event.create(eventData);
    res.status(201).json(event);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.errors });
  }
};

const updateEvent = async (req, res) => {
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
};

const archiveEvent = async (req, res) => {
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
};

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

const createBooking = async (req, res) => {
  try {
    const bookingData = bookingValidation.parse(req.body);
    const booking = await Bookings.create(bookingData);
    res.status(201).json(booking);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.errors });
  }
};

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
