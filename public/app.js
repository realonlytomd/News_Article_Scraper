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
    console.log("scrapeData returned from db:", scrapeData);
    // For each one
    // Display the information on the page
    for (i = 0; i < scrapeData.length; i++) {
      // if a note for a particular article exists, change font color of title to green
      // and tell user they've previously added a note
      if (scrapeData[i].note) {  // if a note exists on (this) article, call function that makes
        // a slight update to the article's title so that it's updatedAt value is changed,
        console.log("I'm in the - if there is a scrapeData[i].note!: " + scrapeData[i].note);
        // var now = moment().format();
        // console.log("now = " + now);
        console.log("scrapeData[i], i = ",i);
        console.log("srapeData[i], scrapeData[i].title = ", scrapeData[i].title);
        // $.ajax({
        //   method: "POST",
        //   url: "/articles/test/" + scrapeData[i]._id,
        //   data: {
        //     // change title slightly so the updatedAt is current, and the article won't be deleted
        //     _id: scrapeData[i]._id,
        //     title: scrapeData[i].title + " (updated)"
        //   }
        // })
        // .then(function(dataUpdate) {
        //   // Log the response
        //   console.log("data from updating title on article: ", dataUpdate);
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
//
$(document).on("click", "#scrape", function() {
  $("#articles").empty();
  displayData();
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
