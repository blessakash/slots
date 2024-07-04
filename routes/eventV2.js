const express = require("express");
const router = express.Router();
const Event = require("../models/v2/Event");
const Slot = require("../models/v2/Slot");
const moment = require("moment-timezone");
const Booking = require("../models/v2/Booking");

router.post("/event", async (req, res) => {
  try {
    const {
      name,
      desc,
      startDate,
      endDate,
      frequency,
      exceptions,
      timezone,
      daySlots,
      maxPublicGuests,
      minPublicGuests,
      publicSession,
      publicPricing,
      maxPrivateGuests,
      minPrivateGuests,
      privateSession,
      privatePricing,
    } = req.body;

    const event = new Event({
      name,
      desc,
      startDate,
      endDate,
      frequency,
      exceptions,
      timezone,
      daySlots,
      maxPublicGuests,
      minPublicGuests,
      publicSession,
      publicPricing,
      maxPrivateGuests,
      minPrivateGuests,
      privateSession,
      privatePricing,
    });

    await event.save();

    const eventStartDate = moment.tz(startDate, timezone);
    const eventEndDate = moment.tz(endDate, timezone);

    const slots = [];

    const isException = (date, day, slot) => {
      const exception = exceptions.find(
        (exc) =>
          moment(exc.date).isSame(date, "day") &&
          exc.day === day &&
          exc.slots.some(
            (excSlot) =>
              excSlot.startTime === slot.startTime &&
              excSlot.endTime === slot.endTime
          )
      );
      return exception ? true : false;
    };

    // if (frequency === "daily") {
    //   for (
    //     let m = eventStartDate.clone();
    //     m.isBefore(eventEndDate);
    //     m.add(1, "days")
    //   ) {
    //     console.log("m", m);
    //     const currentDay = m.format("ddd").toUpperCase().slice(0, 3); // Get day abbreviation (e.g., "MO" for Monday)
    //     console.log("cd", currentDay);
    //     const daySlot = daySlots.find((slot) => slot.day === currentDay);
    //     console.log("daySlot", daySlot);

    //     if (daySlot) {
    //       const spots = [];
    //       daySlot.slots.forEach((slot) => {
    //         const unavailable = isException(m, currentDay, slot);
    //         spots.push({
    //           startTime: slot.startTime,
    //           endTime: slot.endTime,
    //           isAvailable: !unavailable,
    //         });
    //       });
    //       slots.push({
    //         eventId: event._id,
    //         day: daySlot.day,
    //         date: m.clone().toDate(),
    //         spots: spots,
    //       });
    //     }
    //   }
    // } else if (frequency === "monthly") {
    //   const endDateForWeekly = eventStartDate.clone().add(60, "days");
    //   for (
    //     let m = eventStartDate.clone();
    //     m.isBefore(endDateForWeekly);
    //     m.add(1, "days")
    //   ) {
    //     console.log("m", m, "s", eventStartDate.clone().add(60, "days"));
    //     const currentDay = m.format("ddd").toUpperCase().slice(0, 3); // Get day abbreviation (e.g., "MO" for Monday)
    //     console.log("cd", currentDay);
    //     const daySlot = daySlots.find((slot) => slot.day === currentDay);
    //     console.log("daySlot", daySlot);

    //     if (daySlot) {
    //       const spots = [];
    //       daySlot.slots.forEach((slot) => {
    //         const unavailable = isException(m, currentDay, slot);
    //         slots.push({
    //           startTime: slot.startTime,
    //           endTime: slot.endTime,
    //           isAvailable: !unavailable,
    //         });
    //       });
    //       //   slots.push({
    //       //     eventId: event._id,
    //       //     day: daySlot.day,
    //       //     date: m.clone().toDate(),
    //       //     spots,
    //       //   });
    //     }
    //   }
    // }

    const endDateForWeekly = eventStartDate.clone().add(60, "days");
    for (
      let m = eventStartDate.clone();
      m.isBefore(frequency === "monthly" ? endDateForWeekly : eventEndDate);
      m.add(1, "days")
    ) {
      const currentDay = m.format("ddd").toUpperCase().slice(0, 3); // Get day abbreviation (e.g., "MO" for Monday)
      const daySlot = daySlots.find((slot) => slot.day === currentDay);
      if (daySlot) {
        daySlot.slots.forEach((slot) => {
          const unavailable = isException(m, currentDay, slot);
          slots.push({
            eventId: event._id,
            startTime: m.clone().set({
              hours: slot.startTime.split(":")[0],
              minutes: slot.startTime.split(":")[1],
            }),
            endTime: m.clone().set({
              hours: slot.endTime.split(":")[0],
              minutes: slot.endTime.split(":")[1],
            }),
            privateSlots: event.maxPrivateGuests,
            publicSlots: event.maxPublicGuests,
            ...(unavailable ? { isUnavailable: true } : {}),
          });
        });
      }
    }

    await Slot.insertMany(slots);

    res
      .status(201)
      .json({ message: "Event and slots created successfully", event });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/update/:eventId", async (req, res) => {
  const { daySlots, exceptions, timezone, startDate, endDate, frequency } =
    req.body;
  const [event, deleteResult] = await Promise.all([
    Event.findByIdAndUpdate(req.params.eventId, req.body, { new: true }).select(
      "_id maxPrivateGuests maxPublicGuests publicSession privateSession"
    ),
    Slot.deleteMany({ eventId: req.params.eventId }),
  ]);

  const eventStartDate = moment.tz(startDate, timezone);
  const eventEndDate = moment.tz(endDate, timezone);
  const endDateForWeekly = eventStartDate.clone().add(60, "days");

  console.log(eventStartDate, eventEndDate);

  const slots = [];

  // const isException = (date, day, slot) => {
  //   const exception = exceptions.find(
  //     (exc) =>
  //       moment(exc.date).isSame(date, "day") &&
  //       exc.day === day &&
  //       exc.slots.some(
  //         (excSlot) =>
  //           excSlot.startTime === slot.startTime &&
  //           excSlot.endTime === slot.endTime
  //       )
  //   );
  //   return exception ? true : false;
  // };

  const isException = (date, day, slot) => {
    return exceptions.some(
      (exc) =>
        moment(exc.date).isSame(date, "day") &&
        exc.day === day &&
        exc.slots.some(
          (excSlot) =>
            excSlot.startTime === slot.startTime &&
            excSlot.endTime === slot.endTime
        )
    );
  };

  for (
    let m = eventStartDate.clone();
    m.isBefore(frequency === "monthly" ? endDateForWeekly : eventEndDate);
    m.add(1, "days")
  ) {
    const currentDay = m.format("ddd").toUpperCase().slice(0, 3); // Get day abbreviation (e.g., "MO" for Monday)
    const daySlot = daySlots.find((slot) => slot.day === currentDay);
    console.log(m, currentDay, daySlot);
    if (daySlot) {
      daySlot.slots.forEach((slot) => {
        const unavailable = isException(m, currentDay, slot);
        slots.push({
          eventId: event._id,
          startTime: m
            .clone()
            .set({
              hours: slot.startTime.split(":")[0],
              minutes: slot.startTime.split(":")[1],
            })
            .toDate(),
          endTime: m
            .clone()
            .set({
              hours: slot.endTime.split(":")[0],
              minutes: slot.endTime.split(":")[1],
            })
            .toDate(),

          ...(event.publicSession ? { publicSession: true } : {}),
          ...(event.publicSession
            ? { publicSlots: event.maxPublicGuests }
            : {}),
          ...(event.privateSession ? { privateSession: true } : {}),
          ...(event.privateSession
            ? { privateSlots: event.maxPrivateGuests }
            : {}),
          ...(unavailable ? { isUnavailable: true } : {}),
        });
      });
    }
  }

  console.log(slots);

  await Slot.insertMany(slots);
  return res.json(event);
});
const generateSlotsForEvent = async (event) => {
  const { daySlots, exceptions, timezone, startDate, endDate, frequency } =
    event;
  const eventStartDate = moment.tz(startDate, timezone);
  const eventEndDate = moment.tz(endDate, timezone);
  const endDateForWeekly = eventStartDate.clone().add(60, "days");

  const slots = [];

  const isException = (date, day, slot) => {
    return exceptions.some(
      (exc) =>
        moment(exc.date).isSame(date, "day") &&
        exc.day === day &&
        exc.slots.some(
          (excSlot) =>
            excSlot.startTime === slot.startTime &&
            excSlot.endTime === slot.endTime
        )
    );
  };

  for (
    let m = eventStartDate.clone();
    m.isBefore(frequency === "monthly" ? endDateForWeekly : eventEndDate);
    m.add(1, "days")
  ) {
    const currentDay = m.format("ddd").toUpperCase().slice(0, 3);
    const daySlot = daySlots.find((slot) => slot.day === currentDay);
    if (daySlot) {
      daySlot.slots.forEach((slot) => {
        const unavailable = isException(m, currentDay, slot);
        slots.push({
          eventId: event._id,
          startTime: m
            .clone()
            .set({
              hours: slot.startTime.split(":")[0],
              minutes: slot.startTime.split(":")[1],
            })
            .toDate(),
          endTime: m
            .clone()
            .set({
              hours: slot.endTime.split(":")[0],
              minutes: slot.endTime.split(":")[1],
            })
            .toDate(),
          privateSlots: event.maxPrivateGuests,
          publicSlots: event.maxPublicGuests,
          isUnavailable: unavailable,
        });
      });
    }
  }

  await Slot.insertMany(slots);
};
// cron.schedule("0 0 * * *", async () => {
//   const events = await Event.find();

//   for (const event of events) {
//     const slots = await Slot.find({ eventId: event._id });
//     const oneDayBeforeEndDate = moment(event.endDate).subtract(1, "days");

//     if (slots.length > 0) {
//       const lastSlotDate = moment(slots[slots.length - 1].startTime).startOf(
//         "day"
//       );
//       if (lastSlotDate.isSame(oneDayBeforeEndDate, "day")) {
//         await generateSlotsForEvent(event);
//       }
//     }
//   }
// });
module.exports = router;
