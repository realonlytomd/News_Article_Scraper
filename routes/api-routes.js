var express = require("express");
var axios = require("axios");
var cheerio = require("cheerio");
var moment = require("moment");
var router = express.Router();
var db = require("../models");
// Routes
module.exports = function(router) {
    // the GET route for scraping The Verge's website
    router.get("/scrape", function(req, res) {
        // First, grab the body of the html of the site with request
        axios.get("https://www.theverge.com/").then(function(response) {
            // Then, load that into cheerio and save it to $ for a shorthand selector
            var $ = cheerio.load(response.data);
            $("h2.c-entry-box--compact__title").each(function(i, element) {
                // Save an empty result object outside of functions that assign different
                // elements of result object
                var result = {};
                result.title = $(this)
                .children("a")
                .text()
                .trim();
                result.link = $(this)
                .children("a")
                .attr("href");
                // the update is used to slightly change the article in the db so it's not
                // deleted as an old article.
                result.update = 1;
            // Create a new Article in the db using the `result` object built from scraping
            // But only create the new Article in the db if it doesn't already exist
            // This if statement checks to see if the title already is in the db
                db.Article.findOne({ title: result.title })   
                    .then(function(prevArticles) {
                    if (prevArticles) {
                        //console.log("This Article already exists: " + prevArticles);
                    } else {
                        db.Article.create(result)
                        .then(function(dbArticle) {
                        // View the added result in the console
                        })
                        .catch(function(err) {
                        // If an error occurred, send it to the client
                        return res.json(err);
                        });
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
        db.Article.find({})
            .then(function(dbArticle) {
            res.json(dbArticle);
            })
            .catch(function(err) {
            // However, if an error occurred, send it to the client
            res.json(err);
            });
    });

    // Route for deleting articles over a week old.
    router.delete("/articles/deleteold", function(req, res) {
        var oneWeekPrev = moment().subtract(7, "days");
        console.log("oneWeekPrev: ", oneWeekPrev);
        // // delete all articles that were updated in a time before 7 days ago.
        // // this dles not include articles that have notes stored, since they
        // are updated with every display of data. 
        db.Article.deleteMany({ updatedAt: { $lt: oneWeekPrev } })
            .then(function(dbDateDelete){
            console.log("dbDateDelete: ", dbDateDelete);
            res.json(dbDateDelete);
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
            console.log("dbArticle from /articles/id: ", dbArticle);
            })
            .catch(function(err) {
            // but if an error occurred, send it to the client
            res.json(err);
            });
    });

    // Route for getting a specific Article by id, and then change it's update parameter
    router.post("/articles/test/:id", function(req, res) {
        // Using the id passed in the id parameter, and make a query that finds the matching one in the db
        db.Article.findOneAndUpdate(
            { _id: req.body._id },
            { update: req.body.update },
            { returnNewDocument: true }
        )
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
        console.log("in post: /articles:id, req.body: ", req.body);
    // Create a new note and pass the req.body to the entry
        db.Note.create(req.body)
            .then(function(dbNote) {
        // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. 
        // Update the Article to be associated with the new Note
        // { new: true } tells the query that we want it to return the updated User,
        // it returns only the original by default
                return db.Article.findOneAndUpdate(
                    { _id: req.params.id },
                    { note: dbNote._id },
                    { new: true }
                );
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
                return db.Article.findOneAndUpdate(
                    { _id: req.params.id }, 
                    { note: dbNote._id }, 
                    { new: true }
                );
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
        db.Article.deleteOne(
            { _id: req.params.id }
        )
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