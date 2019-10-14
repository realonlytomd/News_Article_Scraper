$(document).ready(function(){

//var moment = require("moment");
//Perform the initial scrape, create and fill the database when app is run
$.ajax({
  method: "GET",
  url: "/scrape"
}).then(function() {
});
// create function to display all the data on the page after retrieved from the db
function displayData() {
    // Get the articles as a json
  $.getJSON("/articles", function(scrapeData) {
    // For each one
    console.log("scrapeData returned from scrape:", scrapeData);
    // Display the information on the page
    for (i = 0; i < scrapeData.length; i++) {
      // if a note for a particular article exists, change font color of title to green
      // and tell user they've previously added a note
      if (scrapeData[i].note) {  // if a note exists on (this) article, call function that makes
        // a slight update to the note so that it's updatedAt value is changed (in save Note function),
        // or, change updatedAt value in article directly to "now" (in /articles function) (???)
        // ***  this is currently not correct!!!! but close
        // console.log("I'm in the if that there is a scrapeData[i].note!" + scrapeData[i].note);
        // $.ajax({
        //   method: "POST",
        //   url: "/articles/" + scrapeData[i]._id,
        //   data: {
        //     // change timestamp that the article is updated to "now", so that it's not deleted
        //     updatedAt: moment().format()
        //   }
        // })
        // .then(function(dataUpdate) {
        //   // Log the response
        //   console.log("data from posting a new Note: ", dataUpdate);
        // });

        //****
        $("#articles").append("<p style='color:green;' data-id='" + 
          scrapeData[i]._id + "'>" + 
          scrapeData[i].title + "  (You've made a Note!)</p><button data-id='" + 
          scrapeData[i]._id + "' class='deleteArticle'>Delete Article</button><button><a href='" + 
          scrapeData[i].link + "' target='_blank'>Go To Article</a></button>");
      } else {
        $("#articles").append("<p data-id='" + 
        scrapeData[i]._id + "'>" + 
        scrapeData[i].title + "</p><button data-id='" + 
        scrapeData[i]._id + "' class='deleteArticle'>Delete Article</button><button><a href='" + 
        scrapeData[i].link + "' target='_blank'>Go To Article</a></button>");
      }
    }
  });
}

// this is a function that ammends a note slightly if one exists when
// the user lists the articles in the db. - (so that the article's updatedAt
// is updated, and won't be deleted when the deleteMany is called)
// When the Save Note button is clicked
// function slightlyUpdateNote() {
//   // Get the id associated with the article
//   var thisId = data[i]._id;
//   console.log("in slightlyUpdateNote function, thisId = ", thisId);
//   // Run a POST request to change the note, using what's entered in the inputs
//   $.ajax({
//     method: "POST",
//     url: "/articles/" + thisId,
//     data: {
//       // input updated character to title
//       title: data[i].title + "updated"
//     }
//   })
//   .then(function(data) {
//     // Log the response
//     console.log("data from posting a new Note: ", data);
    
//   });
// }

// this is the end of the slightly update note function

//Re-Perform a scrape by clicking the List New Articles button
//
// * add later *
// need to check which articles in the db already have a note, and
// need to be updated (slightly), so that their updatedAt value
// won't allow them to be deleted if over a week old.
//
$(document).on("click", "#scrape", function() {
  $("#articles").empty();
  $.ajax({
    method: "GET",
    url: "/scrape"
  }).then (function() {
    displayData();
  });
});

// When the title of an article (with a p tag) is clicked
$(document).on("click", "p", function() {
  // Empty the notes from the note section
  $("#notes").empty();
  // Save the id from the p tag
  var thisId = $(this).attr("data-id");
  console.log("thisId after clicking 'p': " + thisId);
  // Now make an ajax call for the Article
  $.ajax({
    method: "GET",
    url: "/articles/" + thisId
  })
    // With that done, add the note information to the page
    .then(function(dataSaveP) {
      console.log("dataSaveP from GET /articles+id", dataSaveP);
      // The title of the article
      $("#notes").append("<h2>" + dataSaveP.title + "</h2>");
      // An input to enter a new note title
      $("#notes").append("<input id='titleinput' name='title' placeholder='Title'>");
      // A textarea to add a new note body
      $("#notes").append("<textarea id='bodyinput' name='body' placeholder='Contents'></textarea>");
      // A button to submit a new note, with the id of the article saved to it
      $("#notes").append("<button data-id='" + dataSaveP._id + "' id='saveNote'>Save Note</button>");
      // Here's a button to delete a note, with the id of the article saved to it
      $("#notes").append("<button data-id='" + dataSaveP._id + "' id='deleteNote'>Delete Note</button>");
      // experiment
      // show the modal
      $("#noteModal").modal("show");
      // If there's already a note in the article
      if (dataSaveP.note) {
        // Place the title of the note in the title input
        $("#titleinput").val(dataSaveP.note.title);
        // Place the body of the note in the body textarea
        $("#bodyinput").val(dataSaveP.note.body);
      }
    });
});

// When the Save Note button is clicked
$(document).on("click", "#saveNote", function() {
  // Get the id associated with the article
  var thisId = $(this).attr("data-id");
  console.log("in #saveNote, thisId = ", thisId);
  // Run a POST request to change the note, using what's entered in the inputs
  $.ajax({
    method: "POST",
    url: "/articles/" + thisId,
    data: {
      // Value taken from title input and the textarea
      title: $("#titleinput").val(),
      body: $("#bodyinput").val()
    }
  })
  .then(function(dataSaveNoteUpdate) {
    // Log the response
    console.log("data from posting a new Note: ", dataSaveNoteUpdate);
    // Empty the notes section
    $("#notes").empty();
    $("#noteModal").modal("hide");
    $("#articles").empty();
    displayData();
  });
  // Also, remove the values entered in the input and textarea for note entry
  $("#titleinput").val("");
  $("#bodyinput").val("");
});

// When you click the Delete Note button
$(document).on("click", "#deleteNote", function() {
  // Grab the id associated with the article
  var thisId = $(this).attr("data-id");
  console.log("delete the note at thisId: ", thisId);
  // Run a DELETE request to delete the note
  $.ajax({
    method: "DELETE",
    url: "/articles/" + thisId
  })
    // still need to empty the notes div as before
    .then(function() {
      $("#notes").empty();
      $("#noteModal").modal("hide");
      $("#articles").empty();
      displayData();
    });

  // And remove the values entered in the input and textarea as before
  $("#titleinput").val("");
  $("#bodyinput").val("");
});

// When the Delete Article button is clicked
$(document).on("click", ".deleteArticle", function() {
  //empty out the articles section in order to repopulate with the current list of articles
  //after the chosen one is deleted.
  $("#articles").empty();
  // Grab the title associated with the article
  var thisId = $(this).attr("data-id");
  // Run a DELETE request to delete the article
  $.ajax({
    method: "DELETE",
    url: "/articles/test/" + thisId
  })
    .then(function() {
      //repopulate with the current list of articles
      //without the recently deleted one.
     displayData();
    });
});
});
