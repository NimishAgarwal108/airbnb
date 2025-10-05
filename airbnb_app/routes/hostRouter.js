// External Module
const express = require('express');
const hostRouter = express.Router();
const {getAddHome, postAddHome, getHostHome, getEditHome, postEditHome, postDeleteHome}=require("../controllers/hostController")

// Get the upload middleware from app.locals (set in app.js)
hostRouter.use((req, res, next) => {
  req.upload = req.app.locals.upload;
  next();
});

hostRouter.get("/add-home", getAddHome);
hostRouter.get("/host-home", getHostHome);
hostRouter.get("/edit-home/:homeId", getEditHome);

// Add home with file upload (photo required)
hostRouter.post("/add-home", (req, res, next) => {
  req.upload.single('photo')(req, res, (err) => {
    if (err) {
      return next(err);
    }
    if (!req.file) {
      return res.status(400).render('error', {
        pageTitle: 'Upload Error',
        currentPage: 'error',
        error: 'Please upload a photo (JPG, JPEG, or PNG)',
        isLoggedIn: req.session?.isLoggedIn || false,
        user: req.session?.user || {}
      });
    }
    next();
  });
}, postAddHome);

// Edit home with file upload (photo optional)
hostRouter.post("/edit-home", (req, res, next) => {
  req.upload.single('photo')(req, res, (err) => {
    if (err) {
      return next(err);
    }
    // Photo is optional when editing, so no check for req.file
    next();
  });
}, postEditHome);

hostRouter.post("/delete-home/:homeId", postDeleteHome);

module.exports = hostRouter;