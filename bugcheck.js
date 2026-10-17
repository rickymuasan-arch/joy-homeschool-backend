require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected\n");
  
  const email = "testadmin123@gmail.com";
  const user = await User.findOne({ email });
  
  if (!user) {
    console.log("User not found:", email);
    process.exit(1);
  }
  
  console.log("Email:", user.email);
  console.log("Role:", user.role);
  console.log("Password hash:", user.password.substring(0, 40));
  
  const test1 = await bcrypt.compare("TestPass2026", user.password);
  console.log("Password 'TestPass2026' matches:", test1);
  
  process.exit(0);
})();
