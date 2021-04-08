var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");

var axios = require("axios");
var cheerio = require("cheerio");
// var cheerioAdv = require("cheerio-advanced-selectors");

// Require all models
var db = require("./models");

// make port ready for deployment on heroku as well as local
var PORT = process.env.PORT || 3000;

// Initialize Express
var app = express();


//  morgan logger for logging requests
app.use(logger("dev"));
//  body-parser for handling form submissions
app.use(bodyParser.urlencoded({ extended: false }));
//  express.static to serve the public folder as a static directory
app.use(express.static("public"));

// By default mongoose uses callbacks for async queries, we're setting it to use promises (.then syntax) instead
// Connect to the Mongo DB
mongoose.Promise = Promise;
// set up for deploying on heroku and developing local
if (process.env.DB_URI) {
  mongoose.connect(process.env.DB_URI);
} else {
  mongoose.connect("mongodb://localhost:27017/newsReader", { 
    useNewUrlParser: true, 
    useUnifiedTopology: true,
    useFindAndModify: false
  }, function(err){
    if(err){
    console.log(err);
  } else {
    console.log("mongoose connection is successful on: " + "mongodb://localhost:27017/newsReader");
  }
 });
}
// var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/newsReader";
// mongoose.connect(MONGODB_URI);

//  Routes
require("./routes/api-routes.js")(app);

// Start the server
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});
