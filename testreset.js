require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected");
  
  const email = "pheebsrutto@gmail.com";
  const user = await User.findOne({ email });
  
  if (!user) {
    console.log("User not found");
    process.exit(1);
  }
  
  console.log("Email:", user.email);
  console.log("resetPasswordToken:", user.resetPasswordToken);
  console.log("resetPasswordExpires:", user.resetPasswordExpires);
  console.log("Now:", new Date());
  
  if (user.resetPasswordToken) {
    const expired = user.resetPasswordExpires < Date.now();
    console.log("Token expired:", expired);
  }
  
  process.exit(0);
})();
