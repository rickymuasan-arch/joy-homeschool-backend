require("dotenv").config();
const mongoose = require("mongoose");
const ReportCard = require("./models/ReportCard");

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected");
  const result = await ReportCard.deleteMany({});
  console.log("Deleted all report cards:", result.deletedCount);
  process.exit(0);
})();
