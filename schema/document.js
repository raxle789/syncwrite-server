const { Schema, model } = require("mongoose");

const Document = new Schema({
  _id: String,
  fileName: String,
  data: Object,
  lastEdited: Date,
});

module.exports = model("Document", Document);
