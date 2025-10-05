const Home = require("../models/home");

// Render add home form
exports.getAddHome = (req, res, next) => {
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
    if (!req.session.isLoggedIn || !req.session.user) {
      return res.redirect('/login');
    }

    const { houseName, price, location, rating } = req.body;
    
    // Get Cloudinary URL from uploaded file
    const photoUrl = req.file.path; // Cloudinary returns full URL in path
    const photoPublicId = req.file.filename; // Cloudinary public_id
    
    console.log('Adding home for user:', req.session.user._id);
    console.log('Uploaded photo URL:', photoUrl);
    
    const home = new Home({
      houseName,
      price,
      location,
      rating,
      photo: photoUrl,
      photoPublicId: photoPublicId, // Store for deletion later
      user: req.session.user._id,
    });
    
    await home.save();
    console.log('✅ Home added successfully:', home._id);
    
    res.redirect("/host/host-home");
  } catch (err) {
    console.error("❌ Error adding home:", err);
    
    // Delete uploaded file from Cloudinary if database save fails
    if (req.file && req.file.filename) {
      const cloudinary = req.app.locals.cloudinary;
      cloudinary.uploader.destroy(req.file.filename, (error) => {
        if (error) console.error("Error deleting from Cloudinary:", error);
      });
    }
    
    next(err);
  }
};

// Edit home page
exports.getEditHome = async (req, res, next) => {
  try {
    if (!req.session.isLoggedIn || !req.session.user) {
      return res.redirect('/login');
    }

    const homeId = req.params.homeId;

    const home = await Home.findById(homeId);
    
    if (!home) {
      console.log('Home not found:', homeId);
      return res.redirect("/host/host-home");
    }

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
    if (!req.session.isLoggedIn || !req.session.user) {
      return res.redirect('/login');
    }

    const { id, houseName, price, location, rating } = req.body;
    const home = await Home.findById(id);

    if (!home) {
      console.log('Home not found:', id);
      return res.redirect("/host/host-home");
    }

    if (home.user.toString() !== req.session.user._id.toString()) {
      console.log('Unauthorized edit attempt');
      return res.redirect("/host/host-home");
    }

    home.houseName = houseName;
    home.price = price;
    home.location = location;
    home.rating = rating;

    // If new photo is uploaded
    if (req.file) {
      console.log('New photo uploaded:', req.file.filename);
      
      // Delete old photo from Cloudinary
      if (home.photoPublicId) {
        const cloudinary = req.app.locals.cloudinary;
        cloudinary.uploader.destroy(home.photoPublicId, (error) => {
          if (error) console.error("Error deleting old photo:", error);
          else console.log('✅ Old photo deleted from Cloudinary');
        });
      }
      
      // Update with new photo
      home.photo = req.file.path;
      home.photoPublicId = req.file.filename;
    }
    
    await home.save();
    console.log('✅ Home updated successfully:', id);

    res.redirect("/host/host-home");
  } catch (err) {
    console.error("❌ Error updating home:", err);
    
    // Delete uploaded file from Cloudinary if update fails
    if (req.file && req.file.filename) {
      const cloudinary = req.app.locals.cloudinary;
      cloudinary.uploader.destroy(req.file.filename, (error) => {
        if (error) console.error("Error deleting from Cloudinary:", error);
      });
    }
    
    next(err);
  }
};

// Delete home
exports.postDeleteHome = async (req, res, next) => {
  try {
    if (!req.session.isLoggedIn || !req.session.user) {
      return res.redirect('/login');
    }

    const homeId = req.params.homeId;
    const home = await Home.findById(homeId);

    if (!home) {
      console.log('Home not found:', homeId);
      return res.redirect("/host/host-home");
    }

    if (home.user.toString() !== req.session.user._id.toString()) {
      console.log('Unauthorized delete attempt');
      return res.redirect("/host/host-home");
    }

    // Delete photo from Cloudinary
    if (home.photoPublicId) {
      const cloudinary = req.app.locals.cloudinary;
      cloudinary.uploader.destroy(home.photoPublicId, (error) => {
        if (error) console.error("❌ Error deleting photo from Cloudinary:", error);
        else console.log('✅ Photo deleted from Cloudinary');
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