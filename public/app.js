$(document).ready(function(){

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
        // and tell user they've previously added a 
        // also, change the update by adding 1. This changes the updatedAt so that it won't be
        // deleted as an old article (over a week).
        if (scrapeData[i].note) {
          $.ajax({
            method: "POST",
            url: "/articles/test/" + scrapeData[i]._id,
            data: {
              _id: scrapeData[i]._id,
              update: scrapeData[i].update + 1
            }
          })
          .then(function(dataUpdate) {
            console.log("dataUpdate: ", dataUpdate);
          });
          //****
          $("#articles").prepend("<p style='color:green;'><a href='" + 
          scrapeData[i].link + "' target='_blank'>" + 
          scrapeData[i].title + "</a>  (You've made a Note!)</p>" +
          "<button data-id='" + 
          scrapeData[i]._id + "' class='deleteArticle'>Delete Article</button>" +
          "<button data-id='" + 
          scrapeData[i]._id + "' class='makeNote'>See Note</button>");
        } else {
          $("#articles").prepend("<p><a href='" + 
          scrapeData[i].link + "' target='_blank'>" + 
          scrapeData[i].title + "</a></p>" +
          "<button data-id='" + 
          scrapeData[i]._id + "' class='deleteArticle'>Delete Article</button>" +
          "<button data-id='" + 
          scrapeData[i]._id + "' class='makeNote'>Save Note</button>");
        }
      }
    });
  }
  // the list articles button merely gets all the entries from the db
  $(document).on("click", "#scrape", function(event) {
    event.preventDefault();
    $("#articles").empty();
    displayData();
  });
  // the delete old button does a relist (to update articles with notes), then calls the api
  // to delete all the old articles at once
  $(document).on("click", "#deleteOld", function(event) {
    event.preventDefault();
    $("#articles").empty();
    displayData();
    $("#sureModal").modal("show");
  });

  $(document).on("click", "#yesDelete", function(event) {
    event.preventDefault();
    $.ajax({
      method: "DELETE",
      url: "/articles/deleteold"
    })
        //repopulate with the current list of articles
        //without the recently deleted ones.
    .then(function(dbDateDelete) {
      console.log("dbDateDelete: ", dbDateDelete);
      $("#sureModal").modal("hide");
      $("#articles").empty();
      displayData();
    });
  });

  // When the Save Note button is clicked
  $(document).on("click", ".makeNote", function(event) {
    event.preventDefault();
    // Empty the notes from the note section
    $("#notes").empty();
    // Save the id from the p tag
    var thisId = $(this).attr("data-id");
    // Nmake an ajax call for the article that the user wants to add a note
    $.ajax({
      method: "GET",
      url: "/articles/" + thisId
    })
      // add the note information to the page
      .then(function(dataSaveP) {
        // The title of the article
        $("#notes").append("<h2>" + dataSaveP.title + "</h2>");
        // An input to enter a new note title
        $("#notes").append("<input id='titleinput' name='title' placeholder='Title'>");
        // A textarea to add a new note body
        $("#notes").append("<textarea id='bodyinput' name='body' placeholder='Contents'></textarea>");
        // A button to submit a new note, with the id of the article saved to it
        $("#notes").append("<button data-id='" + dataSaveP._id + "' id='saveNote'>Save Note</button>");
        // show the modal
        $("#noteModal").modal("show");
        // If there's already a note in the article, show the info.
        if (dataSaveP.note) {
          // Here's a button to delete a note, with the id of the article saved to it and the id of the note.
          $("#notes").append("<button data-idNote='" + dataSaveP.note._id + "' data-id='" + dataSaveP._id + "' id='deleteNote'>Delete Note</button>");
          // Place the title of the note in the title input
          $("#titleinput").val(dataSaveP.note.title);
          // Place the body of the note in the body textarea
          $("#bodyinput").val(dataSaveP.note.body);
        }
      });
  });

  // When the Save Note button is clicked
  $(document).on("click", "#saveNote", function(event) {
    event.preventDefault();
    // Get the id associated with the article
    var thisId = $(this).attr("data-id");
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
      console.log("saving a note: dataSaveNoteUpdate: ", dataSaveNoteUpdate);
      console.log("note Id: ", dataSaveNoteUpdate.note);
      // Log the response
      // Empty the notes section
      $("#notes").empty();
      $("#noteModal").modal("hide");
      $("#articles").empty();
      //and relist the articles and show the article with the recently added note as different
      displayData();
    });
    // Also, remove the values entered in the input and textarea for note entry
    $("#titleinput").val("");
    $("#bodyinput").val("");
  });

  // When you click the Delete Note button
  $(document).on("click", "#deleteNote", function(event) {
    event.preventDefault();
    // Grab the id associated with the article
    var thisId = $(this).attr("data-id");
    var thisNoteId = $(this).attr("data-idNote");
    console.log("thisID: "  + thisId + " and thisNoteId: " + thisNoteId);
       
        // Run a DELETE request to delete the reference to the article's note
    $.ajax({
      method: "POST",
      url: "/articles/overwrite/" + thisId
    })
      // still need to empty the notes div as before
      .then (function(dbArticle) {
        console.log("dbArticle after POST/articles/overwrite/id: ", dbArticle);
         // Run a DELETE request to delete the note
        $.ajax({
          method: "DELETE",
          url: "/articles/another/" + thisNoteId
        })
          .then (function(dbNote) {
            console.log("dbNote after delete: ", dbNote);
          });
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
  $(document).on("click", ".deleteArticle", function(event) {
    event.preventDefault();
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
