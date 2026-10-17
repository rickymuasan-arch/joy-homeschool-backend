require("dotenv").config();
const mongoose = require("mongoose");
const Event = require("./models/Event");

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const all = await Event.find();
  console.log("Total in DB:", all.length);
  
  const active = await Event.find({ isActive: true });
  console.log("Active events:", active.length);
  
  console.log("\nEvent titles:");
  active.forEach(e => console.log(" -", e.title));
  
  process.exit(0);
})();
