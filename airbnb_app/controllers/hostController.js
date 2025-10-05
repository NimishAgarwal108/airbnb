const Home = require("../models/home");
const fs = require("fs");
const path = require("path");

// Render add home form
exports.getAddHome = (req, res, next) => {
  // 👇 Add authentication check
  if (!req.session.isLoggedIn || !req.session.user) {
    return res.redirect('/login');
  }

  res.render("host/edit-home", {
    pageTitle: "Add Home",
    currentPage: "add-home",
    editing: false,
    isLoggedIn: req.session.isLoggedIn,
    user: req.session.user,
  });
};

// Render host's home list
exports.getHostHome = async (req, res, next) => {
  try {
    // 👇 Add authentication check
    if (!req.session.isLoggedIn || !req.session.user) {
      console.log('User not logged in, redirecting to login');
      return res.redirect('/login');
    }

    const userId = req.session.user._id;
    console.log('Fetching homes for host:', userId);
    
    const registeredHomes = await Home.find({ user: userId });
    console.log('Found homes:', registeredHomes.length);
    
    res.render("host/host-home", {
      registeredHomes,
      pageTitle: "Host Home List",
      currentPage: "host-home",
      isLoggedIn: req.session.isLoggedIn,
      user: req.session.user,
    });
  } catch (err) {
    console.error("Error loading host homes:", err);
    next(err);
  }
};

// Add a new home
exports.postAddHome = async (req, res, next) => {
  try {
    // 👇 Add authentication check
    if (!req.session.isLoggedIn || !req.session.user) {
      return res.redirect('/login');
    }

    const { houseName, price, location, rating } = req.body;
    
    // Get photo path from uploaded file
    const photoUrl = `/uploads/${req.file.filename}`;
    
    console.log('Adding home for user:', req.session.user._id);
    console.log('Uploaded photo:', photoUrl);
    
    const home = new Home({
      houseName,
      price,
      location,
      rating,
      photo: photoUrl,
      user: req.session.user._id,
    });
    
    await home.save();
    console.log('✅ Home added successfully:', home._id);
    
    res.redirect("/host/host-home");
  } catch (err) {
    console.error("❌ Error adding home:", err);
    
    // Delete uploaded file if database save fails
    if (req.file) {
      const filePath = path.join(__dirname, '..', 'public', 'uploads', req.file.filename);
      fs.unlink(filePath, (unlinkErr) => {
        if (unlinkErr) console.error("Error deleting file:", unlinkErr);
      });
    }
    
    next(err);
  }
};

// Edit home page
exports.getEditHome = async (req, res, next) => {
  try {
    // 👇 Add authentication check
    if (!req.session.isLoggedIn || !req.session.user) {
      return res.redirect('/login');
    }

    const homeId = req.params.homeId;
    const editing = req.query.editing === "true";

    const home = await Home.findById(homeId);
    
    if (!home) {
      console.log('Home not found:', homeId);
      return res.redirect("/host/host-home");
    }

    // 👇 Security: Check if this home belongs to the logged-in user
    if (home.user.toString() !== req.session.user._id.toString()) {
      console.log('Unauthorized access attempt');
      return res.redirect("/host/host-home");
    }

    res.render("host/edit-home", {
      home,
      pageTitle: "Edit Home",
      currentPage: "host-home",
      editing: true,
      isLoggedIn: req.session.isLoggedIn,
      user: req.session.user,
    });
  } catch (err) {
    console.error("Error fetching home for edit:", err);
    next(err);
  }
};

// Update home
exports.postEditHome = async (req, res, next) => {
  try {
    // 👇 Add authentication check
    if (!req.session.isLoggedIn || !req.session.user) {
      return res.redirect('/login');
    }

    const { id, houseName, price, location, rating } = req.body;
    const home = await Home.findById(id);

    if (!home) {
      console.log('Home not found:', id);
      return res.redirect("/host/host-home");
    }

    // 👇 Security: Check if this home belongs to the logged-in user
    if (home.user.toString() !== req.session.user._id.toString()) {
      console.log('Unauthorized edit attempt');
      return res.redirect("/host/host-home");
    }

    // Update basic fields
    home.houseName = houseName;
    home.price = price;
    home.location = location;
    home.rating = rating;

    // If new photo is uploaded, delete old one and update
    if (req.file) {
      console.log('New photo uploaded:', req.file.filename);
      
      // Delete old photo file
      if (home.photo) {
        const oldPhotoPath = path.join(__dirname, '..', 'public', home.photo);
        fs.unlink(oldPhotoPath, (err) => {
          if (err) console.error("Error deleting old photo:", err);
          else console.log('✅ Old photo deleted');
        });
      }
      
      // Update with new photo
      home.photo = `/uploads/${req.file.filename}`;
    }
    
    await home.save();
    console.log('✅ Home updated successfully:', id);

    res.redirect("/host/host-home");
  } catch (err) {
    console.error("❌ Error updating home:", err);
    
    // Delete uploaded file if database update fails
    if (req.file) {
      const filePath = path.join(__dirname, '..', 'public', 'uploads', req.file.filename);
      fs.unlink(filePath, (unlinkErr) => {
        if (unlinkErr) console.error("Error deleting file:", unlinkErr);
      });
    }
    
    next(err);
  }
};

// Delete home
exports.postDeleteHome = async (req, res, next) => {
  try {
    // 👇 Add authentication check
    if (!req.session.isLoggedIn || !req.session.user) {
      return res.redirect('/login');
    }

    const homeId = req.params.homeId;
    const home = await Home.findById(homeId);

    if (!home) {
      console.log('Home not found:', homeId);
      return res.redirect("/host/host-home");
    }

    // 👇 Security: Check if this home belongs to the logged-in user
    if (home.user.toString() !== req.session.user._id.toString()) {
      console.log('Unauthorized delete attempt');
      return res.redirect("/host/host-home");
    }

    // Delete photo file from uploads folder
    if (home.photo) {
      const photoPath = path.join(__dirname, '..', 'public', home.photo);
      fs.unlink(photoPath, (err) => {
        if (err) console.error("❌ Error deleting photo file:", err);
        else console.log('✅ Photo file deleted');
      });
    }

    await Home.findByIdAndDelete(homeId);
    console.log('✅ Home deleted successfully:', homeId);
    
    res.redirect("/host/host-home");
  } catch (err) {
    console.error("❌ Error deleting home:", err);
    next(err);
  }
};