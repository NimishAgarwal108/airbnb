// Core Module
const path = require("path");
require("dotenv").config();

// External Modules
const express = require("express");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const multer = require("multer");
const fs = require("fs");

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

// =====================
// MULTER CONFIGURATION
// =====================

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, "public", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log("📁 Created uploads directory");
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'home-' + uniqueSuffix + ext);
  }
});

// File filter - only JPG, JPEG, PNG
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG, JPEG, and PNG files are allowed!'), false);
  }
};

// Multer upload instance
const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { 
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Make upload available globally
app.locals.upload = upload;

// MongoDB session store
const store = new MongoDBStore({
  uri: DB_PATH,
  collection: "sessions",
  connectionOptions: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
});

// Handle store errors
store.on('error', function(error) {
  console.error('Session store error:', error);
});

// Wait for store to connect
store.on('connected', function() {
  console.log('✅ Session store connected');
});

app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store,
    cookie: { 
      maxAge: 1000 * 60 * 60 * 24, // 1 day
      secure: false, // Set to false for development
      httpOnly: true,
      sameSite: 'lax' // Use 'lax' for better compatibility
    },
    proxy: true, // Trust proxy for Vercel
    name: 'sessionId' // Custom session name
  })
);

// 👇 ENHANCED DEBUG MIDDLEWARE
app.use((req, res, next) => {
  const isMobile = req.get('user-agent')?.includes('Mobile') || false;
  
  console.log('\n=== REQUEST DEBUG ===');
  console.log('Time:', new Date().toISOString());
  console.log('Path:', req.path);
  console.log('Method:', req.method);
  console.log('User-Agent:', req.get('user-agent')?.substring(0, 50) + '...');
  console.log('Is Mobile:', isMobile);
  console.log('Session ID:', req.sessionID);
  console.log('Is Logged In:', req.session.isLoggedIn);
  console.log('User:', req.session.user ? req.session.user.email : 'No user');
  console.log('Has Cookie:', !!req.headers.cookie);
  console.log('====================\n');
  
  res.locals.isLoggedIn = req.session.isLoggedIn || false;
  res.locals.user = req.session.user || {};
  next();
});

// Routes
app.use(authRouter);
app.use(storeRouter);

// 👇 ENHANCED HOST PROTECTION MIDDLEWARE
app.use("/host", (req, res, next) => {
  console.log('\n🔒 Host Route Protection Check');
  console.log('Session exists:', !!req.session);
  console.log('Is Logged In:', req.session.isLoggedIn);
  console.log('User exists:', !!req.session.user);
  
  if (req.session.isLoggedIn && req.session.user) {
    console.log('✅ Access granted to:', req.session.user.email);
    next();
  } else {
    console.log('❌ Access denied - Redirecting to login');
    console.log('Target path was:', req.originalUrl);
    res.redirect("/login");
  }
});

app.use("/host", hostRouter);

// 👇 MULTER ERROR HANDLING MIDDLEWARE (MUST BE BEFORE GENERAL ERROR HANDLER)
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error('\n=== MULTER ERROR ===');
    console.error('Error Code:', err.code);
    console.error('Error Message:', err.message);
    console.error('Field:', err.field);
    console.error('==================\n');
    
    let errorMessage = 'File upload error: ';
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        errorMessage += 'File is too large. Maximum size is 5MB.';
        break;
      case 'LIMIT_FILE_COUNT':
        errorMessage += 'Too many files uploaded.';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        errorMessage += 'Unexpected file field.';
        break;
      default:
        errorMessage += err.message;
    }
    
    return res.status(400).render('error', {
      pageTitle: 'Upload Error',
      currentPage: 'error',
      error: errorMessage,
      isLoggedIn: req.session?.isLoggedIn || false,
      user: req.session?.user || {}
    });
  }
  
  // If it's a file filter error
  if (err.message && err.message.includes('Only JPG, JPEG, and PNG')) {
    console.error('\n=== FILE TYPE ERROR ===');
    console.error('Error Message:', err.message);
    console.error('======================\n');
    
    return res.status(400).render('error', {
      pageTitle: 'Upload Error',
      currentPage: 'error',
      error: err.message,
      isLoggedIn: req.session?.isLoggedIn || false,
      user: req.session?.user || {}
    });
  }
  
  next(err);
});

// 👇 ERROR HANDLING MIDDLEWARE (MUST BE BEFORE 404)
app.use((err, req, res, next) => {
  console.error('\n=== ERROR CAUGHT ===');
  console.error('Time:', new Date().toISOString());
  console.error('Error Message:', err.message);
  console.error('Error Stack:', err.stack);
  console.error('Path:', req.path);
  console.error('Method:', req.method);
  console.error('User:', req.session?.user?.email || 'No user');
  console.error('Session ID:', req.sessionID);
  console.error('==================\n');
  
  // Check if headers already sent
  if (res.headersSent) {
    return next(err);
  }
  
  // Render error page or send JSON for API requests
  if (req.accepts('html')) {
    res.status(500).render('error', {
      pageTitle: 'Error',
      currentPage: 'error',
      error: process.env.NODE_ENV === 'production' 
        ? 'Something went wrong. Please try again.' 
        : err.message,
      isLoggedIn: req.session?.isLoggedIn || false,
      user: req.session?.user || {}
    });
  } else {
    res.status(500).json({ 
      error: process.env.NODE_ENV === 'production' 
        ? 'Internal Server Error' 
        : err.message 
    });
  }
});

// 👇 404 HANDLER (MUST BE LAST)
app.use(errorsController.pageNotFound);

// =====================
// DATABASE CONNECTION
// =====================
const initializeDB = async () => {
  try {
    await connectToDB(DB_PATH);
    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.error("❌ DB connection error:", err);
    throw err; // Re-throw to prevent server start without DB
  }
};

// =====================
// LOCALHOST SERVER
// =====================
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3003;

  initializeDB()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`\n${'='.repeat(50)}`);
        console.log(`🚀 Server running on http://localhost:${PORT}`);
        console.log(`📁 Uploads directory: ${uploadDir}`);
        console.log(`📱 Test mobile view: Press F12 → Toggle device toolbar`);
        console.log(`${'='.repeat(50)}\n`);
      });
    })
    .catch((err) => {
      console.error("❌ Failed to start server:", err);
      process.exit(1);
    });
} else {
  // Connect to DB when deployed to Vercel (connection is cached)
  initializeDB();
}

// =====================
// EXPORT FOR VERCEL
// =====================
module.exports = app;