require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const oldEmail = "rickymuasan@gmail.com";
  const newEmail = "info@joyhomeschool.co.ke";

  const user = await User.findOne({ email: oldEmail });
  if (!user) {
    console.log("? User not found in database:", oldEmail);
    process.exit(1);
  }

  user.email = newEmail;
  await user.save();

  console.log("? Success! Email updated in database to:", newEmail);
  process.exit(0);
})();
