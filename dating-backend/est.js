require("dotenv").config();
const mongoose = require("mongoose");

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log("MongoDB Connected");

  // Define Profile model (same as in app.js)
  const ProfileSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    nickname: String,
    // ... other fields ...
    currentMatch: { type: mongoose.Schema.Types.ObjectId, ref: "Profile" },
    isActiveForMatch: Boolean,
    chatEnabled: Boolean,
  });
  const Profile = mongoose.model("Profile", ProfileSchema);

  // Reset all profiles
  const result = await Profile.updateMany(
    {},
    { $set: { currentMatch: null, isActiveForMatch: false, chatEnabled: false } }
  );
  console.log("Reset result:", result);

  // Close connection
  mongoose.connection.close();
}).catch(err => console.error("Error:", err));