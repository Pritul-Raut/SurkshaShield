require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const authRoutes = require("./routes/auth-routes/index");
const mediaRoutes = require("./routes/instructor-routes/media-routes");
const instructorCourseRoutes = require("./routes/instructor-routes/course-routes");
const studentViewCourseRoutes = require("./routes/student-routes/course-routes");
const studentViewOrderRoutes = require("./routes/student-routes/order-routes");
const studentCoursesRoutes = require("./routes/student-routes/student-courses-routes");
const studentCourseProgressRoutes = require("./routes/student-routes/course-progress-routes");

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;


// allow these specific domains
const allowedOrigins = [
  "http://localhost:5173", // Keep this for local testing
  "https://surksha-shield-frontend.vercel.app", // Add your Vercel Frontend URL here
  "https://surkshashield.pritul.tech"
];

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "DELETE", "PUT"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
  // cors({
  //   origin: function (origin, callback) {
  //     // Allow requests with no origin (like mobile apps or curl requests)
  //     if (!origin) return callback(null, true);
      
  //     if (allowedOrigins.indexOf(origin) === -1) {
  //       var msg = 'The CORS policy for this site does not allow access from the specified Origin.';
  //       return callback(new Error(msg), false);
  //     }
  //     return callback(null, true);
  //   },
  //   methods: ["GET", "POST", "DELETE", "PUT"],
  //   allowedHeaders: ["Content-Type", "Authorization"],
  // })
);

app.use(express.json());

//database connection -> server-based computing or serverful
// mongoose
//   .connect(MONGO_URI)
//   .then(() => console.log("mongodb is connected"))
//   .catch((e) => console.log(e));

//databse connection -> serverless computing
// Database connection for Vercel (Serverless)
let isConnected = false; // Track connection status

const connectDB = async () => {
  if (isConnected) {
    // If already connected, use existing connection
    return;
  }

  try {
    await mongoose.connect(MONGO_URI);
    isConnected = true;
    console.log("mongodb is connected");
  } catch (e) {
    console.log(e);
  }
};

// Middleware to ensure DB connects before handling any request
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

//mongo connect End for serverless computing

//testing route 

app.get("/", (req, res) => {
  // Check the actual Mongoose connection status
  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  const dbStatus = mongoose.connection.readyState;

  const statusMessages = {
    0: "Disconnected",
    1: "Connected",
    2: "Connecting",
    3: "Disconnecting",
  };

  res.json({
    server: "Running",
    database: statusMessages[dbStatus] || "Unknown",
    code: dbStatus, // Useful for debugging (1 is good!)
  });
});

//routes configuration
app.use("/auth", authRoutes);
app.use("/media", mediaRoutes);
app.use("/instructor/course", instructorCourseRoutes);
app.use("/student/course", studentViewCourseRoutes);
app.use("/student/order", studentViewOrderRoutes);
app.use("/student/courses-bought", studentCoursesRoutes);
app.use("/student/course-progress", studentCourseProgressRoutes);

app.use((err, req, res, next) => {
  console.log(err.stack);
  res.status(500).json({
    success: false,
    message: "Something went wrong",
  });
});

//for server-based (or serverful) computing


// app.listen(PORT, () => {
//   console.log(`Server is now running on port ${PORT}`);
// });


//for server less deployment on vercel
// Only run app.listen locally. 
// Vercel handles the server start automatically in production.
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server is now running on port ${PORT}`);
  });
}

// REQUIRED: Export the app for Vercel to turn it into a serverless function
module.exports = app;