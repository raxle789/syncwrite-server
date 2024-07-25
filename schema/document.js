const { Schema, model } = require("mongoose");

const Document = new Schema({
  _id: String,
  ownerId: String,
  collaborators: {
    type: [String],
    validate: {
      validator: function (array) {
        return array.every((item) => typeof item === "string");
      },
      message: "Collaborators should be an array of strings",
    },
    default: [],
  },
  fileName: String,
  thumbnail: String,
  data: Object,
});

module.exports = model("Document", Document);
