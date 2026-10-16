require("dotenv").config();
const mongoose = require("mongoose");
const ReportCard = require("./models/ReportCard");

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected");

  // Find all report cards
  const all = await ReportCard.find();
  console.log("Total report cards:", all.length);

  // Find ones WITHOUT file data
  const empty = await ReportCard.find({ 
    $or: [
      { fileData: null },
      { fileData: "" },
      { fileData: { $exists: false } }
    ]
  });
  console.log("Empty report cards:", empty.length);

  if (empty.length > 0) {
    const result = await ReportCard.deleteMany({
      _id: { $in: empty.map(r => r._id) }
    });
    console.log("Deleted:", result.deletedCount);
  }

  process.exit(0);
})();
