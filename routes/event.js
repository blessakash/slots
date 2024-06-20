const express = require("express");
const router = express.Router();
const Event = require("../models/Event");
const Slot = require("../models/Slot");
const moment = require("moment-timezone");

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

    if (frequency === "daily") {
      for (
        let m = eventStartDate.clone();
        m.isBefore(eventEndDate);
        m.add(1, "days")
      ) {
        console.log("m", m);
        const currentDay = m.format("ddd").toUpperCase().slice(0, 3); // Get day abbreviation (e.g., "MO" for Monday)
        console.log("cd", currentDay);
        const daySlot = daySlots.find((slot) => slot.day === currentDay);
        console.log("daySlot", daySlot);

        if (daySlot) {
          const spots = [];
          daySlot.slots.forEach((slot) => {
            const unavailable = isException(m, currentDay, slot);
            spots.push({
              startTime: slot.startTime,
              endTime: slot.endTime,
              isAvailable: !unavailable,
            });
          });
          slots.push({
            eventId: event._id,
            day: daySlot.day,
            date: m.clone().toDate(),
            spots: spots,
          });
        }
      }
    } else if (frequency === "weekly") {
      const endDateForWeekly = eventStartDate.clone().add(60, "days");
      for (
        let m = eventStartDate.clone();
        m.isBefore(endDateForWeekly);
        m.add(1, "days")
      ) {
        console.log("m", m, "s", eventStartDate.clone().add(60, "days"));
        const currentDay = m.format("ddd").toUpperCase().slice(0, 3); // Get day abbreviation (e.g., "MO" for Monday)
        console.log("cd", currentDay);
        const daySlot = daySlots.find((slot) => slot.day === currentDay);
        console.log("daySlot", daySlot);

        if (daySlot) {
          const spots = [];
          daySlot.slots.forEach((slot) => {
            const unavailable = isException(m, currentDay, slot);
            spots.push({
              startTime: slot.startTime,
              endTime: slot.endTime,
              isAvailable: !unavailable,
            });
          });
          slots.push({
            eventId: event._id,
            day: daySlot.day,
            date: m.clone().toDate(),
            spots,
          });
        }
      }
    }

    await Slot.insertMany(slots);

    res.status(201).json({ message: "Event and slots created successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/events", async (req, res) => {
  try {
    const events = await Event.find();
    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.get("/slots/:eventId", async (req, res) => {
  try {
    const { eventId } = req.params;
    const { startDate, endDate } = req.query;

    const slots = await Slot.find({
      eventId,
      ...(startDate && endDate
        ? { date: { $gte: new Date(startDate), $lte: new Date(endDate) } }
        : {}),
    });

    console.log({ $gte: new Date(startDate), $lte: new Date(endDate) });

    res.status(200).json(slots);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
