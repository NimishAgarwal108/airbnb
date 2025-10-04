const { check, validationResult } = require("express-validator");
const User = require("../models/user");
const bcrypt = require("bcrypt");

exports.getLogin = (req, res, next) => {
  res.render("auth/login", {
    pageTitle: "Login",
    currentPage: "login",
    isLoggedIn: false,
    errors: [],
    oldInput: { email: "" },
    user: {},
  });
};

exports.getSignup = (req, res, next) => {
  res.render("auth/signup", {
    pageTitle: "Signup",
    currentPage: "signup",
    isLoggedIn: false,
    errors: [],
    oldInput: { firstname: "", lastname: "", email: "", userType: "" },
    user: {},
  });
};

exports.postSignup = [
  check("firstname")
    .trim()
    .isLength({ min: 2 })
    .withMessage("First Name should be at least 2 characters long")
    .matches(/^[A-Za-z\s]+$/)
    .withMessage("First Name should contain only alphabets"),

  check("lastname")
   .trim()
    .isLength({ min: 2 })
    .withMessage("last Name should be at least 2 characters long")
    .matches(/^[A-Za-z\s]*$/)
    .withMessage("Last Name should contain only alphabets"),

  check("email")
    .isEmail()
    .withMessage("Please enter a valid email")
    .normalizeEmail(),

  check("password")
    .isLength({ min: 8 })
    .withMessage("Password should be at least 8 characters long")
    .matches(/[A-Z]/)
    .withMessage("Password should contain at least one uppercase letter")
    .matches(/[a-z]/)
    .withMessage("Password should contain at least one lowercase letter")
    .matches(/[0-9]/)
    .withMessage("Password should contain at least one number")
    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage("Password should contain at least one special character")
    .trim(),

  check("confirmPass")
    .trim()
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords do not match");
      }
      return true;
    }),

  check("userType")
    .notEmpty()
    .withMessage("Please select a user type")
    .isIn(["guest", "host"])
    .withMessage("Invalid user type"),

  check("termsAccepted")
    .notEmpty()
    .withMessage("Please accept the terms and conditions")
    .custom((value) => {
      if (value !== "on") {
        throw new Error("Please accept the terms and conditions");
      }
      return true;
    }),

  (req, res, next) => {
     const { firstname, lastname, email, password, userType, termsAccepted } = req.body;
    const validationErrors = validationResult(req);
    const errors = validationErrors.array().map(err => ({
  param: err.path, 
  msg: err.msg,
}));

    if (errors.length > 0) {
      return res.status(422).render("auth/signup", {
        pageTitle: "Signup",
        currentPage: "signup",
        isLoggedIn: false,
        errors,
        oldInput: { firstname, lastname, email, userType },
        user: {},
      });
    }

    bcrypt.hash(password, 12)
      .then((hashedPassword) => {
        const user = new User({
          firstname: firstname,
          lastname: lastname,
          email,
          password: hashedPassword,
          userType,
        });
        return user.save();
      })
      .then(() => {
        res.redirect("/login");
      })
      .catch((err) => {
          console.error("Signup Error:", err); 
        return res.status(422).render("auth/signup", {
          pageTitle: "Signup",
          currentPage: "signup",
          isLoggedIn: false,
          errors: [{ param: "general", msg: err.message }],
          oldInput: { firstname, lastname, email, userType,termsAccepted: termsAccepted === 'on'},
          user: {},
        });
      });
  },
];

exports.postLogin = async (req, res, next) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  const errors = [];
  if (!user) errors.push({ param: "email", msg: "User does not exist" });

  if (user) {
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) errors.push({ param: "password", msg: "Invalid Password" });
  }

  if (errors.length > 0) {
    return res.status(422).render("auth/login", {
      pageTitle: "Login",
      currentPage: "login",
      isLoggedIn: false,
      errors,
      oldInput: { email },
      user: {},
    });
  }

  // Set session
  req.session.isLoggedIn = true;
  req.session.user = user;
  await req.session.save();

  // Redirect based on user type
  if (user.userType === "host") {
    return res.redirect("/host/host-home"); // host home page
  } else if (user.userType === "guest") {
    return res.redirect("/homes"); // guest home page
  } else {
     return res.redirect("/login"); // fallback
  }
};


exports.postLogout = (req, res, next) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
};
