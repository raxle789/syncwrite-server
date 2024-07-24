const express = require("express");
const mongoose = require("mongoose");
const http = require("http");
const socketIo = require("socket.io");
const Document = require("./schema/document");
const User = require("./schema/user");

// Koneksi ke MongoDB
mongoose.connect("mongodb://localhost:27017/gdocs-clone", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true,
});

// Inisialisasi Express
const app = express();
app.use(express.json());

// Buat server HTTP
const server = http.createServer(app);

// Inisialisasi Socket.io
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

const defaultValue = "";

// Socket.io connection handling
io.on("connection", (socket) => {
  socket.on("get-document", async (documentId) => {
    const document = await findOrCreateDocument(documentId);
    socket.join(documentId);
    socket.emit("load-document", document.data);

    socket.on("send-changes", (delta) => {
      socket.broadcast.to(documentId).emit("receive-changes", delta);
    });

    socket.on("save-document", async (data) => {
      await Document.findByIdAndUpdate(documentId, { data });
    });
  });
});

// Express route
app.post("/api/get-user", async (req, res) => {
  const { id, email, displayName, avatar } = req.body;
  try {
    const user = await findOrCreateUser(id, email, displayName, avatar);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Fungsi untuk menemukan atau membuat dokumen
async function findOrCreateDocument(id) {
  if (id == null) return;

  const document = await Document.findById(id);
  if (document) return document;
  return await Document.create({ _id: id, data: defaultValue });
}

// Fungsi untuk menemukan atau membuat pengguna
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

// Mulai server pada port 3001
server.listen(3001, () => {
  console.log("Server is running on port 3001");
});
