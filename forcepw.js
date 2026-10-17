require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const email = "pheebsrutto@gmail.com";
  const newPassword = "Parent2026Secure";

  const hash = await bcrypt.hash(newPassword, 10);
  
  const result = await User.updateOne(
    { email },
    { $set: { password: hash } }
  );

  console.log("Update result:", JSON.stringify(result));

  const check = await User.findOne({ email });
  const match = await bcrypt.compare(newPassword, check.password);
  console.log("Password now matches:", match);

  process.exit(0);
})();
