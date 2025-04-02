require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const { Server } = require("socket.io");
const http = require("http");

const upload = multer({ dest: "uploads/" });

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: "http://localhost:3000", credentials: true }));

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB Connection Error:", err));

// User Schema
const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  googleId: String,
});
const User = mongoose.model("User", UserSchema);

// Profile Schema
const ProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  nickname: { type: String, required: true },
  yourGender: { type: String, required: true },
  introExtro: { type: String, required: true },
  secretObsession: { type: String, required: true },
  conversationStarter: { type: String },
  decisionMaking: { type: String },
  kitchenSkill: { type: String },
  weekdayNight: { type: String },
  weekendVibe: { type: String },
  dealbreaker: { type: String, required: true },
  firstDateEnergy: { type: String },
  argueStyle: { type: String, required: true },
  idealDate: { type: String, required: true },
  uselessTalent: { type: String, required: true },
  apocalypseRole: { type: String },
  deepestFear: { type: String, required: true },
  images: {
    type: [String],
    required: true,
    validate: {
      validator: (v) => v.length >= 4 && v.length <= 7,
      message: "You must upload between 4 and 7 images!",
    },
  },
  age: { type: Number, required: true, min: 18 },
  genderPreference: {
    type: String,
    enum: ["men", "women", "both"],
    required: true,
  },
  favoriteMovie: { type: String, required: true },
  favoriteMusic: { type: String, required: true },
  profileCompleted: { type: Boolean, default: false },
  lastUpdated: { type: Date, default: Date.now },
});
const Profile = mongoose.model("Profile", ProfileSchema);

// JWT Functions
const JWT_SECRET = process.env.JWT_SECRET;
const generateToken = (user, res) => {
  const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

// Middleware to Verify Token for Socket.IO
const verifyTokenSocket = (socket, next) => {
  const cookieHeader = socket.handshake.headers.cookie;
  if (!cookieHeader) {
    console.log("No cookie header present");
    return next(new Error("Unauthorized"));
  }

  const token = cookieHeader
    .split("; ")
    .find((row) => row.startsWith("token="))
    ?.split("=")[1];

  if (!token) {
    console.log("No token extracted from cookie");
    return next(new Error("Unauthorized"));
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.userId = decoded.id;
    next();
  } catch (error) {
    console.log("Token verification failed:", error.message);
    next(new Error("Invalid token"));
  }
};

// Chat and Video Logic with Socket.IO
let waitingUsers = [];

io.use(verifyTokenSocket);

io.on("connection", async (socket) => {
  console.log("User connected with ID:", socket.userId);

  // Verify user profile
  const profile = await Profile.findOne({ userId: socket.userId });
  if (!profile || !profile.profileCompleted) {
    console.log("Profile incomplete or missing for user:", socket.userId);
    socket.emit("error", { message: "Complete your profile to chat!" });
    socket.disconnect();
    return;
  }

  const userData = { socket, userId: socket.userId };

  // Helper function to get current session ID
  const getSessionIdFromRooms = () => {
    const rooms = Array.from(socket.rooms);
    return rooms.find((room) => room !== socket.id) || null;
  };

  // Helper function to leave current session
  const leaveCurrentSession = () => {
    const sessionId = getSessionIdFromRooms();
    if (sessionId) {
      socket.leave(sessionId);
      io.to(sessionId).emit("partner_left", { message: "Stranger disconnected" });
      console.log("User", socket.userId, "left session:", sessionId);
    }
  };

  // Pairing logic
  const pairUser = () => {
    // Ensure user isn't in any previous session
    leaveCurrentSession();

    // Remove user from waiting list if already present (prevent duplicates)
    waitingUsers = waitingUsers.filter((u) => u.userId !== socket.userId);

    if (waitingUsers.length > 0) {
      const match = waitingUsers.shift();
      if (match.userId !== socket.userId) {
        // Create a unique session ID with timestamp to avoid conflicts
        const sessionId = `${socket.userId}-${match.userId}-${Date.now()}`;
        
        // Ensure match leaves any previous session
        match.socket.leave(getSessionIdFromRooms.call(match.socket));
        
        // Join both users to the new session
        socket.join(sessionId);
        match.socket.join(sessionId);

        // Notify both users of pairing
        io.to(sessionId).emit("paired", {
          message: "Connected with a stranger!",
          sessionId,
        });
        console.log("Paired users in session:", sessionId);
      } else {
        // If matched with self (shouldn't happen), re-queue
        waitingUsers.push(match);
        socket.emit("waiting", { message: "Waiting for a stranger..." });
      }
    } else {
      // Add user to waiting list
      waitingUsers.push(userData);
      socket.emit("waiting", { message: "Waiting for a stranger..." });
      console.log("User", socket.userId, "added to queue. Queue length:", waitingUsers.length);
    }
  };

  // Initial pairing attempt
  pairUser();

  // Handle text messages
  socket.on("message", (data) => {
    const sessionId = getSessionIdFromRooms();
    if (sessionId) {
      socket.to(sessionId).emit("message", { text: data.text, from: "stranger" });
      console.log("Message sent to session", sessionId, ":", data.text);
    } else {
      console.error("No session found for message from user", socket.userId);
    }
  });

  // WebRTC signaling: Offer
  socket.on("offer", (data) => {
    const { offer, sessionId } = data;
    if (!sessionId || !socket.rooms.has(sessionId)) {
      console.error("Invalid sessionId for offer from user", socket.userId);
      return;
    }
    socket.to(sessionId).emit("offer", { offer, from: socket.userId, sessionId });
    console.log("Offer emitted to session", sessionId);
  });

  // WebRTC signaling: Answer
  socket.on("answer", (data) => {
    const { answer, sessionId } = data;
    if (!sessionId || !socket.rooms.has(sessionId)) {
      console.error("Invalid sessionId for answer from user", socket.userId);
      return;
    }
    socket.to(sessionId).emit("answer", { answer, from: socket.userId, sessionId });
    console.log("Answer emitted to session", sessionId);
  });

  // WebRTC signaling: ICE Candidate
  socket.on("ice-candidate", (data) => {
    const { candidate, sessionId } = data;
    if (!sessionId || !socket.rooms.has(sessionId)) {
      console.error("Invalid sessionId for ICE candidate from user", socket.userId);
      return;
    }
    if (candidate) {
      socket.to(sessionId).emit("ice-candidate", { candidate, from: socket.userId, sessionId });
      console.log("ICE candidate emitted to session", sessionId);
    }
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log("User disconnecting with ID:", socket.userId);
    waitingUsers = waitingUsers.filter((u) => u.userId !== socket.userId);
    leaveCurrentSession();
    console.log("Updated queue length after disconnect:", waitingUsers.length);
  });

  // Handle "next" request
  socket.on("next", () => {
    console.log("User", socket.userId, "requested next chat");
    
    // Clean up current session
    leaveCurrentSession();

    // Remove from waiting list and re-queue
    waitingUsers = waitingUsers.filter((u) => u.userId !== socket.userId);
    waitingUsers.push(userData);
    socket.emit("waiting", { message: "Looking for a new stranger..." });
    console.log("User", socket.userId, "re-queued. Queue length:", waitingUsers.length);

    // Delay pairing to ensure cleanup
    setTimeout(() => {
      pairUser();
    }, 1500); // 1.5-second delay for reliable cleanup
  });
});

// Routes
app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ message: "All fields are required" });

  let user = await User.findOne({ email });
  if (user) return res.status(400).json({ message: "User already exists" });

  const hashedPassword = await bcrypt.hash(password, 10);
  user = new User({ name, email, password: hashedPassword });
  await user.save();

  generateToken(user, res);
  res.json({ message: "User registered successfully", user });
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: "User not found" });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

  generateToken(user, res);
  res.json({ message: "Login successful", user });
});

app.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out" });
});

// Google OAuth
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      let user = await User.findOne({ googleId: profile.id });
      if (!user) {
        user = new User({
          googleId: profile.id,
          name: profile.displayName,
          email: profile.emails[0].value,
        });
        await user.save();
      }
      return done(null, user);
    }
  )
);
app.use(passport.initialize());
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
app.get(
  "/auth/google/callback",
  passport.authenticate("google", { session: false }),
  (req, res) => {
    generateToken(req.user, res);
    res.redirect("http://localhost:3000/dashboard");
  }
);

app.get("/profile", async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    res.json(user);
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
});

app.post("/user/profile", upload.array("images", 7), async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.id;

    const imageUrls = req.files?.length
      ? await Promise.all(
          req.files.map(async (file) => {
            const result = await cloudinary.uploader.upload(file.path);
            return result.secure_url;
          })
        )
      : null;

    let profile = await Profile.findOne({ userId });
    const profileData = {
      ...req.body,
      images: imageUrls || (profile ? profile.images : []),
      profileCompleted: true,
      lastUpdated: Date.now(),
    };

    if (profile) {
      profile = await Profile.findOneAndUpdate({ userId }, profileData, { new: true });
    } else {
      profile = new Profile({ userId, ...profileData });
      await profile.save();
    }

    res.json({ message: "Profile saved successfully", profileCompleted: true, profile });
  } catch (error) {
    console.error("Profile save error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/user/profile", async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const decoded = jwt.verify(token, JWT_SECRET);
    const profile = await Profile.findOne({ userId: decoded.id });
    res.json(profile || { profileCompleted: false });
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
});

// Start server
server.listen(5000, () => console.log("Backend running on port 5000"));