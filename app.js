const express = require("express");
const cors = require("cors");
require('dotenv').config();
const connectDB = require('./src/config/db.config.js');
const route = require('./src/routes/index.routes.js');
const app = express();

// CORS configuration
var corsOptions = {
  origin: "*"
};
app.use(cors(corsOptions));

// Middleware to parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the uploads directory
app.use('/uploads', express.static('uploads'));

// Connect to MongoDB
connectDB();

// Routes configuration
app.use('/api/ecommerce-react-apis/v1', route);

// Default route for the root path
app.get("/", (req, res) => {
  res.json({ message: "Welcome to Ecommerce. In this app you can buy products." });
});

// Catch-all for any undefined routes
app.use(function (req, res) {
  return res.status(400).send({ message: "Sorry! Route not found" });
});

// Set port and start server
const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
