require("dotenv").config();
const mongoose = require("mongoose");
const Event = require("./models/Event");

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const events = await Event.find();
  
  console.log("Total events in DB:", events.length);
  
  events.forEach(e => {
    console.log("------------------------");
    console.log("Title:", e.title);
    console.log("isActive:", e.isActive);
    console.log("startDate:", e.startDate);
    console.log("curriculum:", e.curriculum);
  });
  
  process.exit(0);
})();
