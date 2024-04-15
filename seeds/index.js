require("dotenv").config();

const mongoose = require("mongoose");
const Campground = require("../models/campground");
const cities = require("./cities");
const { places, descriptors } = require("./seedHelpers");
const dbUrl = process.env.DB_URL;
// const dbUrl = "mongodb://127.0.0.1:27017/yelp-camp";
const MongoStore = require("connect-mongo");

mongodbConn().catch((err) => console.log(err));
async function mongodbConn() {
  await mongoose.connect(dbUrl);
  console.log("Connect to mongodb");

  await Campground.deleteMany({});
  const sample = (arr) => arr[Math.floor(Math.random() * arr.length)];

  for (let i = 0; i < 200; i++) {
    const random1000 = Math.floor(Math.random() * 1000);
    const camp = new Campground({
      author: "6601026c154f75719c42153f",
      location: `${cities[random1000].city}, ${cities[random1000].state}`,
      title: `${sample(descriptors)}, ${sample(places)}`,
      description:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Phasellus faucibus scelerisque eleifend donec.",
      price: 10,
      geometry: {
        type: "Point",
        coordinates: [
          cities[random1000].longitude,
          cities[random1000].latitude,
        ],
      },
      images: [
        {
          url: "https://res.cloudinary.com/djdop5xug/image/upload/v1627961501/YelpCamp/photo-1504280390367-361c6d9f38f4_hgld2x.jpg",
          filename: "YelpCamp/photo-1504280390367-361c6d9f38f4_hgld2x",
        },
        {
          url: "https://res.cloudinary.com/djdop5xug/image/upload/v1627961497/YelpCamp/photo-1594495894542-a46cc73e081a_pawhpc.jpg",
          filename: "YelpCamp/photo-1594495894542-a46cc73e081a_pawhpc",
        },
        {
          url: "https://res.cloudinary.com/djdop5xug/image/upload/v1627961497/YelpCamp/photo-1496947850313-7743325fa58c_jbxcmh.jpg",
          filename: "YelpCamp/photo-1496947850313-7743325fa58c_jbxcmh",
        },
      ],
    });
    await camp.save();
  }

  mongoose.connection.close();
}
