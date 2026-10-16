require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected");

  const u = await User.findOne({ email: "pheebsrutto@gmail.com" });
  if (!u) { console.log("NOT FOUND"); process.exit(1); }

  const newHash = await bcrypt.hash("Parent2026Secure", 10);
  u.password = newHash;
  u.markModified("password");
  await u.save();

  // verify
  const check = await User.findOne({ email: "pheebsrutto@gmail.com" });
  const match = await bcrypt.compare("Parent2026Secure", check.password);
  console.log("Password now matches:", match);

  process.exit(0);
})();
