const Favourite = require("../models/favourite");
const Home = require("../models/home");

// Render index page (first page for guests)
exports.getIndex = async (req, res, next) => {
  try {
    const registeredHomes = await Home.find();
    res.render("store/index", {
      registeredHomes,
      pageTitle: "Homes List",
      currentPage: "airbnb",
      isLoggedIn: req.session.isLoggedIn,
      user: req.session.user,
    });
  } catch (err) {
    console.error("Error loading index page:", err);
    res.status(500).send("Internal Server Error");
  }
};

// List all homes
exports.getHomes = async (req, res, next) => {
  try {
    const registeredHomes = await Home.find();
    res.render("store/home-list", {
      registeredHomes,
      pageTitle: "Airbnb Home",
      currentPage: "Home",
      isLoggedIn: req.session.isLoggedIn,
      user: req.session.user,
    });
  } catch (err) {
    console.error("Error fetching homes:", err);
    res.status(500).send("Internal Server Error");
  }
};

// Bookings page
exports.getBookings = (req, res, next) => {
  res.render("store/bookings", {
    pageTitle: "My Bookings",
    currentPage: "bookings",
    isLoggedIn: req.session.isLoggedIn,
    user: req.session.user,
  });
};

// Favourites list
exports.getFavouriteList = async (req, res, next) => {
  try {
    const favourites = await Favourite.find().populate("homeId");
    const favouriteHomes = favourites.map(fav => fav.homeId);
    res.render("store/favourite-list", {
      favouriteHomes,
      pageTitle: "My Favourites",
      currentPage: "favourites",
      isLoggedIn: req.session.isLoggedIn,
      user: req.session.user,
    });
  } catch (err) {
    console.error("Error fetching favourites:", err);
    res.status(500).send("Internal Server Error");
  }
};

// Home details page
exports.getHomeDetails = async (req, res, next) => {
  try {
    const homeId = req.params.homeId;
    const home = await Home.findById(homeId);
    if (!home) return res.redirect("/homes");

    res.render("store/home-detail", {
      home,
      pageTitle: "Home Detail",
      currentPage: "Home",
      isLoggedIn: req.session.isLoggedIn,
      user: req.session.user,
    });
  } catch (err) {
    console.error("Error fetching home details:", err);
    res.status(500).send("Internal Server Error");
  }
};

// Add to favourites
exports.postAddToFavourites = async (req, res, next) => {
  try {
    const homeId = req.body.id;
    const existingFav = await Favourite.findOne({ homeId });
    if (!existingFav) {
      const fav = new Favourite({ homeId });
      await fav.save();
    }
    res.redirect("/store/favourite-list");
  } catch (err) {
    console.error("Error adding to favourites:", err);
    res.status(500).send("Internal Server Error");
  }
};

// Remove from favourites
exports.postDeleteFavourite = async (req, res, next) => {
  try {
    const homeId = req.params.homeId;
    await Favourite.findOneAndDelete({ homeId });
    res.redirect("/store/favourite-list");
  } catch (err) {
    console.error("Error removing favourite:", err);
    res.status(500).send("Internal Server Error");
  }
};