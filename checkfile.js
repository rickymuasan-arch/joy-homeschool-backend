require("dotenv").config();
const mongoose = require("mongoose");
const ReportCard = require("./models/ReportCard");

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const all = await ReportCard.find();
  console.log("Total:", all.length);
  all.forEach(r => {
    console.log("---");
    console.log("Student:", r.studentName);
    console.log("Term:", r.term);
    console.log("fileData exists:", !!r.fileData);
    console.log("fileData length:", r.fileData ? r.fileData.length : 0);
    console.log("fileType:", r.fileType);
    console.log("fileName:", r.fileName);
  });
  process.exit(0);
})();
