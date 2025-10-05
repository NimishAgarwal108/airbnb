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
exports.getBookings = async (req, res, next) => {
  try {
    // 👇 Add authentication check
    if (!req.session.isLoggedIn || !req.session.user) {
      return res.redirect('/login');
    }

    // TODO: Fetch actual bookings when you create Booking model
    // const bookings = await Booking.find({ userId: req.session.user._id }).populate('homeId');
    
    res.render("store/bookings", {
      bookings: [], // 👈 Pass empty array for now
      pageTitle: "My Bookings",
      currentPage: "bookings",
      isLoggedIn: req.session.isLoggedIn,
      user: req.session.user,
    });
  } catch (err) {
    console.error("Error fetching bookings:", err);
    res.status(500).send("Internal Server Error");
  }
};

// Favourites list
exports.getFavouriteList = async (req, res, next) => {
  try {
    // 👇 Add authentication check
    if (!req.session.isLoggedIn || !req.session.user) {
      console.log('User not logged in, redirecting to login');
      return res.redirect('/login');
    }

    const userId = req.session.user._id;
    console.log('Fetching favourites for user:', userId);
    
    // 👇 Filter by userId
    const favourites = await Favourite.find({ userId }).populate("homeId");
    console.log('Found favourites:', favourites.length);
    
    const favouriteHomes = favourites
      .map(fav => fav.homeId)
      .filter(home => home !== null); // 👈 Filter out null values
    
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
    // 👇 Add authentication check
    if (!req.session.isLoggedIn || !req.session.user) {
      return res.redirect('/login');
    }

    const homeId = req.body.id;
    const userId = req.session.user._id;
    
    console.log('Adding to favourites - User:', userId, 'Home:', homeId);
    
    // 👇 Check if this user already has this favourite
    const existingFav = await Favourite.findOne({ homeId, userId });
    
    if (!existingFav) {
      const fav = new Favourite({ homeId, userId }); // 👈 Include userId
      await fav.save();
      console.log('Favourite added successfully');
    } else {
      console.log('Favourite already exists');
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
    // 👇 Add authentication check
    if (!req.session.isLoggedIn || !req.session.user) {
      return res.redirect('/login');
    }

    const homeId = req.params.homeId;
    const userId = req.session.user._id;
    
    console.log('Removing from favourites - User:', userId, 'Home:', homeId);
    
    // 👇 Delete only this user's favourite
    const result = await Favourite.findOneAndDelete({ homeId, userId });
    
    if (result) {
      console.log('Favourite removed successfully');
    } else {
      console.log('Favourite not found');
    }
    
    res.redirect("/store/favourite-list");
  } catch (err) {
    console.error("Error removing favourite:", err);
    res.status(500).send("Internal Server Error");
  }
};