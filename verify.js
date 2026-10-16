require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

(async () => {
  const uri = process.env.MONGODB_URI;
  console.log("URI:", uri ? uri.substring(0, 60) + "..." : "MISSING");
  await mongoose.connect(uri);
  console.log("Connected");

  const u = await User.findOne({ email: "pheebsrutto@gmail.com" });
  if (!u) { console.log("USER NOT FOUND"); process.exit(1); }

  console.log("Email:", u.email);
  console.log("Full Name:", u.fullName);
  console.log("Role:", u.role);
  console.log("isApproved:", u.isApproved);
  console.log("isRejected:", u.isRejected);
  console.log("Password hash (first 30):", u.password.substring(0, 30));

  const testMatch = await bcrypt.compare("Parent2026Secure", u.password);
  console.log("Password 'Parent2026Secure' matches:", testMatch);

  process.exit(0);
})();
