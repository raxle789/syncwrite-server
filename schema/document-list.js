const { Schema, model } = require("mongoose");
// const ListItemSchema = new Schema({
//   docId: String,

//   thumbnail: String,
//   openedDate: Date,
// });

const DocumentList = new Schema({
  _id: String,
  list: [
    {
      docId: String,
      fileName: String,
      thumbnail: String,
      openedDate: Date,
    },
  ],
});

module.exports = model("DocumentList", DocumentList);
