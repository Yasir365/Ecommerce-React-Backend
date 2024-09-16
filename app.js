const express = require("express");
const cors = require("cors");
require('dotenv').config();
const connectDB = require('./src/config/db.config.js');
const route = require('./src/routes/index.routes.js');
const app = express();
require('./src/cronjobs/status-update.js');

var corsOptions = {
  origin: "*"
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
connectDB();

// Routes config
app.use('/api/ecommerce-react-apis/v1', route)
app.get("/", (req, res) => {
  res.json({ message: "Welcome to Ecommerce. In this app you can buy products." });
});
app.use(function (req, res) {
  return res.status(400).send({ message: "Sorry! Route not found" });
});


// set port, listen for requests
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});

