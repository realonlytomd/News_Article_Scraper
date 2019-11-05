var mongoose = require("mongoose");

// Save a reference to the Schema constructor
var Schema = mongoose.Schema;

// Using the Schema constructor, create a new UserSchema object
var ArticleSchema = new Schema({
  // `title` of article is required and of type String
  title: {
    type: String,
    required: true
  },
  // `link` to online article is required and of type String
  link: {
    type: String,
    required: true
  },
  // 'update' is an integer showing number of times the article 
  // has been updated - so that's it's not deleted if over a 
  // week old. It's automatically increased if a Note exists on the article
  update: {
    type: Number,
    required: true
  },
  // `note` is an object that stores a Note id
  // The ref property links the ObjectId to the Note model
  // So now it's possible to populate the Article with an associated Note
  note: {
    type: Schema.Types.ObjectId,
    ref: "Note"
  }
}, {
  // adding timestamps: created at and updated at
  timestamps: true
});

// This creates our model from the above schema, using mongoose's model method
var Article = mongoose.model("Article", ArticleSchema);

// Export the Article model
module.exports = Article;
