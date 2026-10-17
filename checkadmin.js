require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected\n");
  
  const admins = await User.find({ role: { $in: ["admin", "super_admin"] } });
  
  console.log(`Found ${admins.length} admin(s):\n`);
  
  for (const admin of admins) {
    console.log("-".repeat(50));
    console.log("Email:", admin.email);
    console.log("Name:", admin.fullName);
    console.log("Role:", admin.role);
    console.log("Password hash:", admin.password.substring(0, 30));
    
    const test = await bcrypt.compare("Directormichael@2026", admin.password);
    console.log("Password 'Directormichael@2026' matches:", test);
  }
  
  process.exit(0);
})();
