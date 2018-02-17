var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");

var axios = require("axios");
var cheerio = require("cheerio");

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
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/newsReader";
mongoose.connect(MONGODB_URI);

// Routes

// the GET route for scraping The Verge's website
app.get("/scrape", function(req, res) {
  // First, grab the body of the html of the site with request
  axios.get("https://www.theverge.com/").then(function(response) {
    // Then, load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(response.data);

    // then grab the h2's with the appropriate class, and build the title and associated links:
    $("h2.c-entry-box--compact__title").each(function(i, element) {
      // Save an empty result object
      var result = {};

      // Add the text and href of every link, and save them as properties of the result object
      result.title = $(this)
        .children("a")
        .text();
      result.link = $(this)
        .children("a")
        .attr("href");

      // Create a new Article using the `result` object built from scraping
      db.Article.create(result)
        .then(function(dbArticle) {
          // View the added result in the console
          console.log(dbArticle);
        })
        .catch(function(err) {
          // If an error occurred, send it to the client
          return res.json(err);
        });
    });

    // If successful, send a message to the client
    res.send("Scrape Complete");
  });
});

// Route for getting all of the Articles from the db
app.get("/articles", function(req, res) {
  // Find all of the document in the Articles collection
  db.Article.find({})
    .then(function(dbArticle) {
      // If that worked, send them back to the client
      res.json(dbArticle);
    })
    .catch(function(err) {
      // However, if an error occurred, send it to the client
      res.json(err);
    });
});

// Route for getting a specific Article by id, and then populate it with it's note
app.get("/articles/:id", function(req, res) {
  // Using the id passed in the id parameter, and make a query that finds the matching one in the db
  db.Article.findOne({ _id: req.params.id })
    // then populate all of the notes associated with it
    .populate("note")
    .then(function(dbArticle) {
      // If successful, find an Article with the given id, send it back to the client
      res.json(dbArticle);
    })
    .catch(function(err) {
      // but if an error occurred, send it to the client
      res.json(err);
    });
});

// Route for saving and/or updating an Article's associated Note
app.post("/articles/:id", function(req, res) {
  // Create a new note and pass the req.body to the entry
  db.Note.create(req.body)
    .then(function(dbNote) {
      // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. 
      // Update the Article to be associated with the new Note
      // { new: true } tells the query that we want it to return the updated User,
      // it returns only the original by default
      //  the Mongoose query returns a promise, we can chain another `.then` 
      // which receives the result of the query
      return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
    })
    .then(function(dbArticle) {
      // If successful in updating an Article, send it back to the client
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for deleting an Article's associated Note
app.delete("/articles/:id", function(req, res) {
  // delete the note and pass the req.body to the entry
  db.Note.deleteOne({ _id: req.params.id })
    .then(function(dbNote) {
      // If a Note was deleted successfully, 
      // the following is much like saving a note
      return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
    })
    .then(function(dbArticle) {
      // If we were able to successfully update an Article, send it back to the client
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for getting a specific Article by title, and then deleting it
app.delete("/articles/test/:title", function(req, res) {
    // Using the title passed in the title parameter, and make a query that finds the matching one in the db
    db.Article.deleteOne({ title: req.params.title })
      .then(function(dbArticle) {
      // I might add this next line because it was use above. currently not getting the new list with
      //  currently there.
        //return db.Article.findOneAndUpdate({ test: req.params.test }, { new: true });
      // If successful, give the list without the given title, send it back to the client 
        res.json(dbArticle);
      })
      .catch(function(err) {
        // but if an error occurred, send it to the client
        res.json(err);
      });
  });

// Start the server
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});
