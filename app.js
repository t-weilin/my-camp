if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const flash = require("connect-flash");
const ExpressError = require("./utils/ExpressError");
const methodOverride = require("method-override");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user");
const mongoSanitize = require("express-mongo-sanitize"); // sql injection
const helmet = require("helmet");
const dbUrl = process.env.DB_URL;
const MongoStore = require("connect-mongo");

const usersRoutes = require("./routes/users");
const campgroundsRoutes = require("./routes/campgrounds");
const reviewsRoutes = require("./routes/reviews");

main().catch((err) => console.log(err));
async function main() {
  // dbUrl = "mongodb://127.0.0.1:27017/yelp-camp";

  await mongoose.connect(dbUrl);
  console.log("Connect to mongodb");

  const app = express();
  app.engine("ejs", ejsMate);
  app.set("view engine", "ejs");
  app.set("views", path.join(__dirname, "views"));

  app.use(express.urlencoded({ extended: true })); // parse json to html readable
  app.use(methodOverride("_method"));
  app.use(express.static(path.join(__dirname, "public"))); // static folder
  app.use(mongoSanitize());

  const store = MongoStore.create({
    mongoUrl: dbUrl,
    touchAfter: 24 * 60 * 60,
    crypto: {
      secret: "thisisasecret",
    },
  });
  store.on("error", function (e) {
    console.log("Sessions store error", e);
  });

  const sessionConfig = {
    store,
    name: "session",
    secret: "thisisasecret",
    resave: false,
    saveUninitialized: true,
    cookie: {
      httpOnly: true,
      // secure: true,
      expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
      maxAge: 1000 * 60 * 60 * 24 * 7, // a week expiration
    },
  };
  app.use(session(sessionConfig)); // make sure this is before the passport
  app.use(flash());
  app.use(helmet());

  const scriptSrcUrls = [
    "https://stackpath.bootstrapcdn.com/",
    "https://api.tiles.mapbox.com/",
    "https://api.mapbox.com/",
    "https://kit.fontawesome.com/",
    "https://cdnjs.cloudflare.com/",
    "https://cdn.jsdelivr.net",
  ];
  const styleSrcUrls = [
    "https://kit-free.fontawesome.com/",
    "https://stackpath.bootstrapcdn.com/",
    "https://api.mapbox.com/",
    "https://api.tiles.mapbox.com/",
    "https://fonts.googleapis.com/",
    "https://use.fontawesome.com/",
  ];
  const connectSrcUrls = [
    "https://api.mapbox.com/",
    "https://a.tiles.mapbox.com/",
    "https://b.tiles.mapbox.com/",
    "https://events.mapbox.com/",
  ];
  const fontSrcUrls = [];
  app.use(
    helmet.contentSecurityPolicy({
      directives: {
        defaultSrc: [],
        connectSrc: ["'self'", ...connectSrcUrls],
        scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
        styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
        workerSrc: ["'self'", "blob:"],
        objectSrc: [],
        imgSrc: [
          "'self'",
          "blob:",
          "data:",
          "https://res.cloudinary.com/djdop5xug/", //SHOULD MATCH YOUR CLOUDINARY ACCOUNT!
          "https://images.unsplash.com/",
        ],
        fontSrc: ["'self'", ...fontSrcUrls],
      },
    })
  );

  app.use(passport.initialize()); // passport set up
  app.use(passport.session());

  passport.use(new LocalStrategy(User.authenticate())); // provide by passport-local-mongoose
  passport.serializeUser(User.serializeUser());
  passport.deserializeUser(User.deserializeUser());

  // flash message
  app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    next();
  });

  // using router
  app.use("/", usersRoutes);
  app.use("/campgrounds", campgroundsRoutes);
  app.use("/campgrounds/:id/reviews", reviewsRoutes);

  app.get("/", (req, res) => {
    res.render("home.ejs");
  });

  // every single request and routes
  app.all("*", (req, res, next) => {
    next(new ExpressError("Page Not Found", 404));
  });

  // handle internal error as default if no other status code forward in
  app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;

    if (!err.message) err.message = "Oh no, something went wrong!!";
    res.status(statusCode).render("error", { err });
  });

  app.listen(3000, () => {
    console.log("Serving on port 3000");
  });
}
