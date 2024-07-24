const Document = require("./schema/document");
const User = require("./schema/user");

const defaultValue = "";

async function findOrCreateDocument(id) {
  if (id == null) return;

  const document = await Document.findById(id);
  if (document) return document;
  return await Document.create({ _id: id, data: defaultValue });
}

async function findOrCreateUser(id, email, displayName, avatar) {
  if (id == null) return;
  if (email == null) return;
  if (displayName == null) return;

  const user = await User.findById(id);
  if (user) return user;
  return await User.create({
    _id: id,
    email: email,
    displayName: displayName,
    avatar: avatar,
  });
}

module.exports = { findOrCreateDocument, findOrCreateUser };
