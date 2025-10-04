// Core Module
const path = require('path');
require('dotenv').config();

// External Module
const express = require('express');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const mongoose = require('mongoose');
const path = require("path");
app.set("views", path.join(__dirname, "views")); // <-- absolute path

// Environment variables
const DB_PATH =
  process.env.MONGODB_URI ||
  'mongodb+srv://root:root@nimish.gykg7ui.mongodb.net/nimish?retryWrites=true&w=majority&appName=nimish';
const SESSION_SECRET = process.env.SESSION_SECRET || 'agarwal';

// Local Modules
const storeRouter = require('./routes/storeRouter');
const hostRouter = require('./routes/hostRouter');
const authRouter = require('./routes/authRouter');
const rootDir = require('./utils/pathUtil');
const errorsController = require('./controllers/errors');

const app = express();

// View engine
app.set('view engine', 'ejs');
app.set('views', 'views');

// MongoDB session store
const store = new MongoDBStore({
  uri: DB_PATH,
  collection: 'sessions'
});

// Middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(rootDir, 'public')));

app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    store
  })
);

app.use((req, res, next) => {
  req.isLoggedIn = req.session.isLoggedIn;
  next();
});

// Routers
app.use(authRouter);
app.use(storeRouter);
app.use('/host', (req, res, next) => {
  if (req.isLoggedIn) next();
  else res.redirect('/login');
});
app.use('/host', hostRouter);

// Error handling
app.use(errorsController.pageNotFound);

// 🟢 Localhost mode
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3003;
  mongoose
    .connect(DB_PATH)
    .then(() => {
      console.log('Connected to Mongo');
      app.listen(PORT, () =>
        console.log(`Server running on http://localhost:${PORT}`)
      );
    })
    .catch((err) => console.log('Error connecting to Mongo:', err));
}

// 🟢 Export app for Vercel (no app.listen here)
module.exports = app;
