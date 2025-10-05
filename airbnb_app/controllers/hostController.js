const Home = require("../models/home");

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
    res.status(500).send("Internal Server Error");
  }
};

// Add a new home
exports.postAddHome = async (req, res, next) => {
  try {
    // 👇 Add authentication check
    if (!req.session.isLoggedIn || !req.session.user) {
      return res.redirect('/login');
    }

    const { houseName, price, location, rating, photoUrl } = req.body;
    
    console.log('Adding home for user:', req.session.user._id);
    
    const home = new Home({
      houseName,
      price,
      location,
      rating,
      photoUrl,
      user: req.session.user._id,
    });
    
    await home.save();
    console.log('Home added successfully:', home._id);
    
    res.redirect("/host/host-home");
  } catch (err) {
    console.error("Error adding home:", err);
    res.status(500).send("Internal Server Error");
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
      editing,
      isLoggedIn: req.session.isLoggedIn,
      user: req.session.user,
    });
  } catch (err) {
    console.error("Error fetching home for edit:", err);
    res.status(500).send("Internal Server Error");
  }
};

// Update home
exports.postEditHome = async (req, res, next) => {
  try {
    // 👇 Add authentication check
    if (!req.session.isLoggedIn || !req.session.user) {
      return res.redirect('/login');
    }

    const { id, houseName, price, location, rating, photoUrl } = req.body;
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

    home.houseName = houseName;
    home.price = price;
    home.location = location;
    home.rating = rating;
    home.photoUrl = photoUrl;
    
    await home.save();
    console.log('Home updated successfully:', id);

    res.redirect("/host/host-home");
  } catch (err) {
    console.error("Error updating home:", err);
    res.status(500).send("Internal Server Error");
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

    await Home.findByIdAndDelete(homeId);
    console.log('Home deleted successfully:', homeId);
    
    res.redirect("/host/host-home");
  } catch (err) {
    console.error("Error deleting home:", err);
    res.status(500).send("Internal Server Error");
  }
};