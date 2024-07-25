const { Schema, model } = require("mongoose");

const DocumentList = new Schema({
  _id: String,
  list: [
    {
      docId: String,
      openedDate: Date,
    },
  ],
});

module.exports = model("DocumentList", DocumentList);
