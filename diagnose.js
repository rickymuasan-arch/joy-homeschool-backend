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
    console.log("? NOT FOUND:", email);
    const all = await User.find({ role: "parent" }).select("email");
    console.log("Available parents:");
    all.forEach(u => console.log(" -", u.email));
    process.exit(1);
  }
  
  console.log("? Found:", user.email);
  console.log("isApproved:", user.isApproved);
  console.log("isRejected:", user.isRejected);
  console.log("Hash:", user.password.substring(0, 30));
  
  const test1 = await bcrypt.compare("123456789", user.password);
  const test2 = await bcrypt.compare("Parent2026Secure", user.password);
  
  console.log("Password '123456789' matches:", test1);
  console.log("Password 'Parent2026Secure' matches:", test2);
  
  process.exit(0);
})();
