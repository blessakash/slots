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

module.exports = router;
