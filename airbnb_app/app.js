// Core Module
const path = require("path");
require("dotenv").config();

// External Modules
const express = require("express");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const mongoose = require("mongoose");

// Local Modules
const storeRouter = require("./routes/storeRouter");
const hostRouter = require("./routes/hostRouter");
const authRouter = require("./routes/authRouter");
const errorsController = require("./controllers/errors");
const rootDir = require("./utils/pathUtil");

const app = express();

// Environment variables
const DB_PATH =
  process.env.MONGODB_URI ||
  "mongodb+srv://root:root@nimish.gykg7ui.mongodb.net/nimish?retryWrites=true&w=majority&appName=nimish";
const SESSION_SECRET = process.env.SESSION_SECRET || "agarwal";

// View engine setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views")); // absolute path for serverless



// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: false }));

// MongoDB session store
const store = new MongoDBStore({
  uri: DB_PATH,
  collection: "sessions",
});

app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    store,
    cookie: { maxAge: 1000 * 60 * 60 * 24 }, // 1 day
  })
);

// Make session data available in templates
app.use((req, res, next) => {
  res.locals.isLoggedIn = req.session.isLoggedIn;
  res.locals.user = req.session.user;
  next();
});

// Routes
app.use(authRouter);
app.use(storeRouter);
app.use("/host", (req, res, next) => {
  if (req.session.isLoggedIn) next();
  else res.redirect("/login");
});
app.use("/host", hostRouter);

// 404 handler
app.use(errorsController.pageNotFound);

// =====================
// LOCALHOST SERVER
// =====================
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3003;

  mongoose
    .connect(DB_PATH)
    .then(() => {
      console.log("Connected to Mongo");
      app.listen(PORT, () =>
        console.log(`Server running on http://localhost:${PORT}`)
      );
    })
    .catch((err) => console.log("Error connecting to Mongo:", err));
}

// =====================
// EXPORT FOR VERCEL
// =====================
module.exports = async (req, res) => {
  try {
    // Connect to DB only if not already connected
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(DB_PATH, {
        bufferCommands: false,
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
    }
    app(req, res);
  } catch (err) {
    console.error("DB connection error:", err);
    res.status(500).send("Internal Server Error");
  }
};
