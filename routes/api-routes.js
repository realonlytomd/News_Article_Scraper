// new file that contains the api route information.
// moved from server.js file
//
var express = require("express");
var axios = require("axios");
var cheerio = require("cheerio");
var moment = require("moment");
// var cheerioAdv = require("cheerio-advanced-selectors");
// cheerio = cheerioAdv.wrap(cheerio);
var router = express.Router();
var db = require("../models");
var imageArray = [];
// Routes
module.exports = function(router) {
    // the GET route for scraping The Verge's website
    router.get("/scrape", function(req, res) {
        // First, grab the body of the html of the site with request
        axios.get("https://www.theverge.com/").then(function(response) {
            // Then, load that into cheerio and save it to $ for a shorthand selector
            // if using cheerio advanced, this should be added back in
            //cheerio = cheerioAdv.wrap(cheerio);
            var $ = cheerio.load(response.data);
            $("h2.c-entry-box--compact__title").each(function(i, element) {
                // Save an empty result object outside of functions that assign different
                // elements of result object
                var result = {};
                result.title = $(this)
                .children("a")
                .text()
                .trim();
                //console.log("result.title: " + result.title);
                result.link = $(this)
                .children("a")
                .attr("href");
                //console.log("result.link: " + result.link);
            // Create a new Article in the db using the `result` object built from scraping
            // But only create the new Article in the db if it doesn't already exist
            // This if statement checks to see if the title already is in the db
                db.Article.findOne({ title: result.title })   
                    .then(function(prevArticles) {
                    if (prevArticles) {
                        //console.log("This Article already exists: " + prevArticles);
                    } else {
                        //Below is the original create function - KEEP THIS
                        db.Article.create(result)
                        .then(function(dbArticle) {
                        // View the added result in the console
                        //console.log("New dbArticle is: " + dbArticle);
                        })
                        .catch(function(err) {
                        // If an error occurred, send it to the client
                        return res.json(err);
                        }); //KEEP ABOVE
                    }
                    })
                    .catch(function(err) {
                        // However, if an error occurred, send it to the client
                        res.json(err);
                    }); // this completes the creation of the db function inside the test function
            }); // this completes the assigning of elements that have been scraped to the result object
        }); // this completes the axios.get function
        // If successful, send a message to the client
        res.send("Scrape Complete");
    }); // this ccompletes the /scrape function
    
    // Route for getting all of the Articles from the db
    router.get("/articles", function(req, res) {
        //Here (possibly) insert a function to delete articles in the db
        // that are older than 2 minutes  -  for testing
        // 
        var newNow = new moment().format();
        console.log("now: ", newNow);
        var twoMinutePrev = moment().subtract(2,"minutes");
        console.log("twoMinutePrev: ", twoMinutePrev);
        db.Article.deleteMany({ updatedAt: { $lt: twoMinutePrev } })
            .then(function(dbDate){
                console.log("dbDate: ", dbDate);
            });
            // above test for 2 minutes is WORKING, but ...
            // I should not rescrape after deleted, or they
            // just reappear in the database.
    // Find all of the document in the Articles collection
    db.Article.find({})
        .then(function(dbArticle) {
        // If that worked, send them back to the client
        //console.log("after relist articles button clicked, (find({})dbArticle): " + dbArticle);
        res.json(dbArticle);
        })
        .catch(function(err) {
        // However, if an error occurred, send it to the client
        res.json(err);
        });
    });
    
    // Route for getting a specific Article by id, and then populate it with it's note
    router.get("/articles/:id", function(req, res) {
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
    router.post("/articles/:id", function(req, res) {
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
    router.delete("/articles/:id", function(req, res) {
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
    
    // Route for getting a specific Article by id, and then deleting it
    router.delete("/articles/test/:id", function(req, res) {
    // Using the title passed in the title parameter, and make a query that finds the matching one in the db
        console.log("this is the id of the doc I want to delete: " + req.params.id);
        db.Article.deleteOne({ _id: req.params.id })
            .then(function(dbArticle) {
            // If successful, give the list without the given title, send it back to the client 
            res.json(dbArticle);
            })
            .catch(function(err) {
            // but if an error occurred, send it to the client
            res.json(err);
            });
    });
};