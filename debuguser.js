require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected");

  const u = await User.findOne({ email: "pheebsrutto@gmail.com" });
  console.log("User found:", u.email);
  console.log("Current hash:", u.password);

  const newHash = await bcrypt.hash("Parent2026Secure", 10);
  console.log("New hash:", newHash);

  const result = await User.updateOne(
    { email: "pheebsrutto@gmail.com" },
    { $set: { password: newHash } }
  );
  console.log("Update result:", JSON.stringify(result));

  const check = await User.findOne({ email: "pheebsrutto@gmail.com" });
  console.log("After save hash:", check.password);
  const match = await bcrypt.compare("Parent2026Secure", check.password);
  console.log("Password matches now:", match);

  process.exit(0);
})();
