require("dotenv").config();
const mongoose = require("mongoose");
const Event = require("./models/Event");
const Student = require("./models/Student");

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected\n");
  
  const events = await Event.find();
  console.log(`Total events: ${events.length}\n`);
  
  events.forEach(e => {
    console.log("-".repeat(50));
    console.log("Title:", e.title);
    console.log("Type:", e.eventType);
    console.log("Curriculum:", e.curriculum);
    console.log("StartDate:", e.startDate);
    console.log("Location:", e.location);
  });
  
  console.log("\n" + "-".repeat(50));
  const students = await Student.find();
  console.log(`\nTotal students: ${students.length}`);
  students.forEach(s => {
    console.log("Student:", s.fullName, "| Curriculum:", s.curriculum, "| Parent:", s.parentId);
  });
  
  process.exit(0);
})();
