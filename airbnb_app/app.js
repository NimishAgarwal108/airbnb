// Core Module
const path = require("path");
require("dotenv").config();

// External Modules
const express = require("express");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);

// Local Modules
const storeRouter = require("./routes/storeRouter");
const hostRouter = require("./routes/hostRouter");
const authRouter = require("./routes/authRouter");
const errorsController = require("./controllers/errors");
const connectToDB = require("./utils/db");
const rootDir = require("./utils/pathUtil");

const app = express();

// Environment variables
const DB_PATH = process.env.MONGODB_URI;
const SESSION_SECRET = process.env.SESSION_SECRET || "agarwal";

// View engine setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Static files
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: false }));

// MongoDB session store
const store = new MongoDBStore({
  uri: DB_PATH,
  collection: "sessions",
});

// Handle store errors
store.on('error', function(error) {
  console.error('Session store error:', error);
});

app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store,
    cookie: { 
      maxAge: 1000 * 60 * 60 * 24, // 1 day
      secure: process.env.NODE_ENV === "production", // HTTPS only in production
      httpOnly: true,
      sameSite: 'lax'
    },
  })
);

// Make session data available in templates
app.use((req, res, next) => {
  res.locals.isLoggedIn = req.session.isLoggedIn || false;
  res.locals.user = req.session.user || {};
  next();
});

// Routes
app.use(authRouter);
app.use(storeRouter);
app.use("/host", (req, res, next) => {
  if (req.session.isLoggedIn) {
    next();
  } else {
    res.redirect("/login");
  }
});
app.use("/host", hostRouter);

// 404 handler
app.use(errorsController.pageNotFound);

// =====================
// DATABASE CONNECTION
// =====================
// Initialize DB connection (uses cached connection from db.js)
const initializeDB = async () => {
  try {
    await connectToDB(DB_PATH);
    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.error("❌ DB connection error:", err);
  }
};

// =====================
// LOCALHOST SERVER
// =====================
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3003;

  initializeDB()
    .then(() => {
      app.listen(PORT, () =>
        console.log(`🚀 Server running on http://localhost:${PORT}`)
      );
    })
    .catch((err) => console.log("Error starting server:", err));
} else {
  // Connect to DB when deployed to Vercel (connection is cached)
  initializeDB();
}

// =====================
// EXPORT FOR VERCEL
// =====================
module.exports = app;