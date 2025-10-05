const Home = require("../models/home");

// Render add home form
exports.getAddHome = (req, res, next) => {
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
    const registeredHomes = await Home.find({ user: req.session.user._id });
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
    const { houseName, price, location, rating, photoUrl } = req.body;
    const home = new Home({
      houseName,
      price,
      location,
      rating,
      photoUrl,
      user: req.session.user._id,
    });
    await home.save();
    res.redirect("/host/host-home");
  } catch (err) {
    console.error("Error adding home:", err);
    res.status(500).send("Internal Server Error");
  }
};

// Edit home page
exports.getEditHome = async (req, res, next) => {
  try {
    const homeId = req.params.homeId;
    const editing = req.query.editing === "true";

    const home = await Home.findById(homeId);
    if (!home) return res.redirect("/host/host-home");

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
    const { id, houseName, price, location, rating, photoUrl } = req.body;
    const home = await Home.findById(id);

    if (!home) return res.redirect("/host/host-home");

    home.houseName = houseName;
    home.price = price;
    home.location = location;
    home.rating = rating;
    home.photoUrl = photoUrl;
    await home.save();

    res.redirect("/host/host-home");
  } catch (err) {
    console.error("Error updating home:", err);
    res.status(500).send("Internal Server Error");
  }
};

// Delete home
exports.postDeleteHome = async (req, res, next) => {
  try {
    const homeId = req.params.homeId;
    await Home.findByIdAndDelete(homeId);
    res.redirect("/host/host-home");
  } catch (err) {
    console.error("Error deleting home:", err);
    res.status(500).send("Internal Server Error");
  }
};