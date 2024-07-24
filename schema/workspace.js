const { Schema, model } = require("mongoose");

const Workspace = new Schema({
  _id: String,
  collaborators: [
    {
      userId: String,
      socketId: String,
    },
  ],
});

module.exports = model("Workspace", Workspace);
