const { Schema, model } = require("mongoose");

const User = new Schema({
  _id: String,
  email: String,
  displayName: String,
  avatar: String,
});

module.exports = model("User", User);
