require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

(async () => {
  await mongoose.connect(process.env.MONGODB_URI || "mongodb+srv://rickymuasan_db_user:4gf7ehcXx@aviora.bqkwlzz.mongodb.net/joy_homeschool_portal?retryWrites=true&w=majority&appName=Aviora");
  console.log("Connected");
  const u = await User.findOne({ email: "pheebsrutto@gmail.com" });
  if (!u) { console.log("NOT FOUND"); process.exit(1); }
  u.password = await bcrypt.hash("Parent2026Secure", 10);
  await u.save();
  console.log("DONE. New password: Parent2026Secure");
  process.exit(0);
})();
