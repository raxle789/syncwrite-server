require("dotenv").config();
const path = require("path");
const mongoose = require("mongoose");
const Document = require("./schema/document");
const DocumentList = require("./schema/document-list");
const User = require("./schema/user");

const express = require("express");
const https = require("https");
// const http = require("http");
const cors = require("cors");
const socketIo = require("socket.io");
const sharp = require("sharp");

// connect to MongoDB
const uri = process.env.DB_URI;
mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true,
});

// initiate Express
const app = express();
// app.use(express.json());
// Adjust the payload size limit
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
origin_receiver = "*";

app.use(
  cors({
    origin: origin_receiver,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// create server HTTP
const server = https.createServer(app);

// initiate Socket.io
const io = socketIo(server, {
  cors: {
    origin: origin_receiver,
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  },
  connectionStateRecovery: {},
});
const users = {}; // Object to store user ID and corresponding socket ID
const rooms = {}; // Object to store room ID and corresponding user IDs
const avatarImages = [
  "/assets/avatar1.jpg",
  "/assets/avatar2.jpg",
  "/assets/avatar3.jpg",
];

// functions
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function convertImagetoBase64(filePath) {
  const imagePath = path.join(__dirname, "public", filePath);
  const imageBuffer = await sharp(imagePath).toBuffer();
  const base64String = imageBuffer.toString("base64");
  return base64String;
}

async function findOrCreateUser(id, email, displayName, avatar) {
  if (id == null) return;

  const user = await User.findById(id);
  if (user) return user;

  const randomNumber = getRandomInt(0, 2);
  const avatarImg = await convertImagetoBase64(avatarImages[randomNumber]);
  return await User.create({
    _id: id,
    email: email ?? "",
    displayName: displayName ?? "",
    avatar: avatar ?? `data:image/jpg;base64,${avatarImg}`,
  });
}

async function findUsersNow(list) {
  let result = [];
  for (const item of list) {
    const user = await User.findById(item.userId);
    if (user) {
      result.push({
        userId: user._id,
        displayName: user.displayName,
        avatar: user.avatar,
      });
    } else {
      const randomNumber = getRandomInt(0, 2);
      const avatarImg = await convertImagetoBase64(avatarImages[randomNumber]);
      result.push({
        userId: "anonim",
        displayName: "Anonim",
        avatar: `data:image/jpg;base64,${avatarImg}`,
      });
    }
  }
  return result;
}

async function updateProfile(id, email, displayName, avatar) {
  if (id == null) return;

  const user = await User.findById(id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  // Update user data
  const updatedUser = await User.findByIdAndUpdate(
    id,
    {
      email: email ?? user.email,
      displayName: displayName ?? user.displayName,
      avatar: avatar ?? user.avatar,
    },
    { new: true, runValidators: true } // Return the updated document
  );

  return updatedUser;
}

async function findOrCreateDocument(userId, docId) {
  if (docId == null) return;

  const document = await Document.findById(docId);
  if (document) return document;
  return await Document.create({
    _id: docId,
    ownerId: userId,
    collaborators: [],
    fileName: "New Document",
    thumbnail: "",
    data: "",
  });
}

async function findDocMetadata(list) {
  let result = [];
  for (const item of list) {
    const document = await Document.findById(item.docId);
    if (document) {
      result.push({
        docId: item.docId,
        fileName: document.fileName,
        thumbnail: document.thumbnail,
        openedDate: item.openedDate,
      });
    }
  }
  return result;
}

async function findOrCreateDocList(id) {
  if (!id && id == null) return;

  const docList = await DocumentList.findById(id);
  if (docList) {
    const result = await findDocMetadata(docList.list);
    return result;
  }

  await DocumentList.create({ _id: id, list: [] });
  const list = [];
  return list;
}

async function updateDocList(id, currentData) {
  if (id == null) return;

  const list = await DocumentList.findById(id);
  if (!list) {
    return res.status(404).json({ message: "Document list not found" });
  }
  // Update document list data
  const updatedData = await DocumentList.findByIdAndUpdate(
    id,
    { list: currentData },
    { new: true, runValidators: true } // Return the updated document
  );

  return updatedData;
}

async function updateFileName(id, fileName) {
  if (id == null) return;

  const document = await Document.findById(id);
  if (!document) {
    return res.status(404).json({ message: "Document not found" });
  }

  const updatedData = await Document.findByIdAndUpdate(
    id,
    { fileName: fileName },
    { new: true, runValidators: true }
  );

  return updatedData;
}

async function findOrAddCollaborator(userId, docId) {
  if (userId == null) return;
  if (docId == null) return;

  const user = await User.findById(userId);
  if (!user) {
    return;
  }
  const document = await Document.findById(docId);
  if (!document) {
    return;
  }

  let collaborators = document.collaborators;
  if (userId !== "" && userId !== document.ownerId) {
    if (!collaborators.includes(userId)) {
      collaborators.push(userId);
      await Document.findByIdAndUpdate(docId, {
        collaborators: collaborators,
      });

      const docListData = await DocumentList.findById(userId);
      const timestamp = new Date();

      let newDocItem = {
        docId: document._id,
        openedDate: timestamp,
      };
      const updatedDocList = [newDocItem, ...docListData.list];
      await updateDocList(userId, updatedDocList);
    }
  }
}

// server action
io.on("connection", (socket) => {
  let userId;

  socket.on("join", async (userIdParam, documentId) => {
    userId = userIdParam;
    users[userId] = socket.id;
    socket.join(documentId);

    if (!rooms[documentId]) {
      rooms[documentId] = [];
    }
    if (!rooms[documentId].includes(userId)) {
      rooms[documentId].push(userId);
    }

    const roomUsers = rooms[documentId].map((id) => ({
      userId: id,
      socketId: users[id],
    }));

    socket.emit("users", roomUsers);
    socket.broadcast
      .to(documentId)
      .emit("user-joined", { userId, socketId: socket.id });
  });

  socket.on("disconnect", () => {
    if (userId) {
      // Delete user from users list
      delete users[userId];

      // Delete user from room
      for (let roomId in rooms) {
        rooms[roomId] = rooms[roomId].filter((id) => id !== userId);
        io.to(roomId).emit("roomData", rooms[roomId]);
      }
    }
    socket.broadcast.emit("user-left", socket.id);
  });

  socket.on("get-document", async (userId, documentId) => {
    const document = await findOrCreateDocument(userId, documentId);
    // socket.join(documentId);
    await findOrAddCollaborator(userId, documentId);
    socket.emit("load-document", document);

    socket.on("send-changes", (delta) => {
      socket.broadcast.to(documentId).emit("receive-changes", delta);
    });

    socket.on("save-document", async (data, callback) => {
      try {
        await Document.findByIdAndUpdate(documentId, {
          data: data,
        });
        if (callback) callback();
      } catch (error) {
        console.error("Error saving document:", error);
        if (callback) callback(error);
      }
    });
  });
});

app.post("/api/get-or-create-user", async (req, res) => {
  // handle get or create user profile data on db
  const { id, email, displayName, avatar } = req.body;
  try {
    const user = await findOrCreateUser(id, email, displayName, avatar);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
    console.info(error.message);
  }
});

app.put("/api/update-profile", async (req, res) => {
  const { id, email, displayName, avatar } = req.body;
  try {
    const user = await updateProfile(id, email, displayName, avatar);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
    console.info(error.message);
  }
});

app.post("/api/get-or-create-doclist", async (req, res) => {
  const { id } = req.body;
  try {
    const docList = await findOrCreateDocList(id);
    res.json(docList);
  } catch (error) {
    res.status(500).json({ error: error.message });
    console.info(error.message);
  }
});

app.put("/api/update-doclist", async (req, res) => {
  const { id, list } = req.body;

  let result = [];
  if (list) {
    for (const item of list) {
      result.push({
        docId: item.docId,
        openedDate: item.openedDate,
      });
    }
  }

  try {
    await updateDocList(id, result);
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: error.message });
    console.log(error.message);
  }
});

app.put("/api/change-filename", async (req, res) => {
  const { id, fileName } = req.body;
  try {
    const doc = await updateFileName(id, fileName);
    res.json(doc);
  } catch (error) {
    res.status(500).json({ error: error.message });
    console.log(error.message);
  }
});

app.delete("/api/delete-doc/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await Document.findByIdAndDelete(id);
    if (result) {
      res.json({ message: `Document with ID ${id} has been deleted` });
    } else {
      res.status(404).json({ message: "Document not found" });
    }
  } catch (error) {
    console.error("Error when deleted document:", error);
    res
      .status(500)
      .json({ error: "Something went wrong when deleted document" });
  }
});

app.post("/api/get-users-now", async (req, res) => {
  const { userList } = req.body;
  try {
    const result = await findUsersNow(userList);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
    console.info(error.message);
  }
});

app.get("/", (req, res) => {
  res.send("Hello from syncwrite backend");
});

// run server on port 3001
server.listen(3001, () => {
  console.log("SyncWrite server is running on port 3001");
});
