io.on("connection", (socket) => {
  // handle anything action about the document, such as create doc and update doc
  socket.on("get-document", async (documentId) => {
    const document = await findOrCreateDocument(documentId);
    socket.join(documentId);
    socket.emit("load-document", document);

    socket.on("send-changes", (delta) => {
      socket.broadcast.to(documentId).emit("receive-changes", delta);
    });

    socket.on("save-document", async (data, callback) => {
      try {
        const timestamp = new Date();
        await Document.findByIdAndUpdate(documentId, {
          data: data,
          lastEdited: timestamp,
        });
        if (callback) callback();
      } catch (error) {
        console.error("Error saving document:", error);
        if (callback) callback(error);
      }
    });
  });
});

// io.on("connection", (socket) => {
//   // handle anything action about the document, such as create doc and update doc
//   socket.on("get-document", async (documentId) => {
//     const document = await findOrCreateDocument(documentId);
//     socket.join(documentId);
//     socket.emit("load-document", document.data);
//     // socket.emit("load-document", document.data);

//     socket.on("send-changes", (delta) => {
//       socket.broadcast.to(documentId).emit("receive-changes", delta);
//     });

//     socket.on("save-document", async (data, callback) => {
//       // await Document.findByIdAndUpdate(documentId, { data });
//       try {
//         const timestamp = new Date();
//         await Document.findByIdAndUpdate(documentId, { data });
//         if (callback) callback(); // Panggil callback tanpa error
//       } catch (error) {
//         console.error("Error saving document:", error);
//         if (callback) callback(error); // Panggil callback dengan error
//       }
//     });
//   });
// });

io.on("connection", (socket) => {
  // Handle join event to store User ID
  socket.on("join", (userId) => {
    users[userId] = socket.id;

    // Emit the updated users object to the newly joined user
    socket.emit(
      "users",
      Object.keys(users).map((id) => ({ userId: id, socketId: users[id] }))
    );

    // Optionally, broadcast the new user to all clients
    socket.broadcast.emit("user-joined", { userId, socketId: socket.id });
  });

  // Handle room related actions
  // socket.on("join-room", (roomId, userId) => {
  //   socket.join(roomId);
  //   console.log(`User ${userId} joined room ${roomId}`);

  //   // Store user in the room
  //   if (!rooms[roomId]) {
  //     rooms[roomId] = [];
  //   }
  //   if (!rooms[roomId].includes(userId)) {
  //     rooms[roomId].push(userId);
  //   }

  //   // Emit the updated room users to everyone in the room
  //   io.to(roomId).emit("roomData", rooms[roomId]);
  // });

  // socket.on("leave-room", (roomId, userId) => {
  //   socket.leave(roomId);
  //   console.log(`User ${userId} left room ${roomId}`);

  //   // Remove user from the room
  //   if (rooms[roomId]) {
  //     rooms[roomId] = rooms[roomId].filter((id) => id !== userId);
  //     io.to(roomId).emit("roomData", rooms[roomId]);
  //   }
  // });

  // Handle user disconnection
  socket.on("disconnect", () => {
    // Remove user from users object
    for (let userId in users) {
      if (users[userId] === socket.id) {
        delete users[userId];
        break;
      }
    }

    // Optionally, broadcast the user disconnection to all clients
    socket.broadcast.emit("user-left", socket.id);
  });

  socket.on("get-document", async (documentId) => {
    const document = await findOrCreateDocument(documentId);
    socket.join(documentId);
    socket.emit("load-document", document);

    socket.on("send-changes", (delta) => {
      socket.broadcast.to(documentId).emit("receive-changes", delta);
    });

    socket.on("save-document", async (data, callback) => {
      try {
        const timestamp = new Date();
        await Document.findByIdAndUpdate(documentId, {
          data: data,
          lastEdited: timestamp,
        });
        if (callback) callback();
      } catch (error) {
        console.error("Error saving document:", error);
        if (callback) callback(error);
      }
    });
  });
});

io.on("connection", (socket) => {
  // Handle join event to store User ID
  socket.on("join", (userId) => {
    users[userId] = socket.id;
    // Emit the updated users object to the newly joined user
    socket.emit(
      "users",
      Object.keys(users).map((id) => ({ userId: id, socketId: users[id] }))
    );

    // Optionally, broadcast the new user to all clients
    socket.broadcast.emit("user-joined", { userId, socketId: socket.id });
  });

  socket.on("get-document", async (documentId, userId) => {
    const document = await findOrCreateDocument(documentId);
    socket.join(documentId);

    // Add user to the room
    if (!rooms[documentId]) {
      rooms[documentId] = [];
    }
    if (!rooms[documentId].includes(userId)) {
      rooms[documentId].push(userId);
    }

    // Emit the updated room users to everyone in the room
    io.to(documentId).emit("roomData", rooms[documentId]);
    socket.emit("load-document", document);

    socket.on("send-changes", (delta) => {
      socket.broadcast.to(documentId).emit("receive-changes", delta);
    });

    socket.on("save-document", async (data, callback) => {
      try {
        const timestamp = new Date();
        await Document.findByIdAndUpdate(documentId, {
          data: data,
          lastEdited: timestamp,
        });
        if (callback) callback();
      } catch (error) {
        console.error("Error saving document:", error);
        if (callback) callback(error);
      }
    });

    // Handle user disconnection
    socket.on("disconnect", () => {
      // Remove user from users object
      for (let userId in users) {
        if (users[userId] === socket.id) {
          delete users[userId];
          break;
        }
      }

      // Remove user from room
      if (rooms[documentId]) {
        rooms[documentId] = rooms[documentId].filter((id) => id !== userId);
        io.to(documentId).emit("roomData", rooms[documentId]);
      }

      // Optionally, broadcast the user disconnection to all clients
      socket.broadcast.emit("user-left", socket.id);
    });
  });
});

// hampir berhasil banget
io.on("connection", (socket) => {
  let userId;

  // socket.on("join", async (userIdParam, documentId) => {
  //   userId = userIdParam;
  //   users[userId] = socket.id;
  //   socket.join(documentId);

  //   // if (!rooms[documentId]) {
  //   //   rooms[documentId] = [];
  //   // }
  //   // if (!rooms[documentId].includes(userId)) {
  //   //   rooms[documentId].push(userId);
  //   // }

  //   // const roomUsers = rooms[documentId].map((id) => ({
  //   //   userId: id,
  //   //   socketId: users[id],
  //   // }));
  //   let roomUsers = await findOrCreateWorkspace(documentId);
  //   roomUsers.collaborators.push({ userId: userIdParam, socketId: socket.id });
  //   await Workspace.findByIdAndUpdate(documentId, {
  //     collaborators: roomUsers.collaborators,
  //   });

  //   socket.emit("users", roomUsers.collaborators);
  //   // socket.emit("users", roomUsers);
  //   socket.broadcast
  //     .to(documentId)
  //     .emit("user-joined", { userId, socketId: socket.id });
  // });

  // socket.on("disconnect", () => {
  //   console.log("lewat leave socket");
  //   if (userId) {
  //     // Delete user from users list
  //     delete users[userId];

  //     // Delete user from room
  //     // for (let roomId in rooms) {
  //     // rooms[roomId] = rooms[roomId].filter((id) => id !== userId);
  //     // io.to(roomId).emit("roomData", rooms[roomId]);
  //     // }
  //   }
  //   socket.on("leave", async (userIdParam, documentId) => {
  //     let roomUsers = await Workspace.findById(documentId);
  //     roomUsers.collaborators = roomUsers.collaborators.filter(
  //       (id) => id !== userIdParam
  //     );
  //     await Workspace.findByIdAndUpdate(documentId, {
  //       collaborators: roomUsers.collaborators,
  //     });
  //     io.to(documentId).emit("roomData", roomUsers.collaborators);
  //   });
  //   socket.broadcast.emit("user-left", socket.id);
  // });

  socket.on("join", async (userIdParam, documentId) => {
    userId = userIdParam;
    socket.documentId = documentId; // Store documentId in socket
    users[userId] = socket.id;
    socket.join(documentId);

    let roomUsers = await findOrCreateWorkspace(documentId);
    roomUsers.collaborators.push({ userId: userIdParam, socketId: socket.id });
    await Workspace.findByIdAndUpdate(documentId, {
      collaborators: roomUsers.collaborators,
    });

    socket.emit("users", roomUsers.collaborators);
    socket.broadcast
      .to(documentId)
      .emit("user-joined", { userId, socketId: socket.id });
  });

  socket.on("leave", async (userIdParam, documentId) => {
    console.log("Leave event received"); // Add log
    if (userId) {
      delete users[userId];

      let roomUsers = await Workspace.findById(documentId);
      roomUsers.collaborators = roomUsers.collaborators.filter(
        (collaborator) => collaborator.userId !== userIdParam
      );
      await Workspace.findByIdAndUpdate(documentId, {
        collaborators: roomUsers.collaborators,
      });

      io.to(documentId).emit("roomData", roomUsers.collaborators);
    }
    socket.broadcast.emit("user-left", socket.id);
  });

  socket.on("disconnect", () => {
    console.log("Disconnect event received"); // Add log
    if (userId && socket.documentId) {
      socket.emit("leave", userId, socket.documentId); // Manually emit leave event
    }
  });

  socket.on("get-document", async (documentId) => {
    const document = await findOrCreateDocument(documentId);
    // socket.join(documentId);
    socket.emit("load-document", document);

    socket.on("send-changes", (delta) => {
      socket.broadcast.to(documentId).emit("receive-changes", delta);
    });

    socket.on("save-document", async (data, callback) => {
      try {
        const timestamp = new Date();
        await Document.findByIdAndUpdate(documentId, {
          data: data,
          lastEdited: timestamp,
        });
        if (callback) callback();
      } catch (error) {
        console.error("Error saving document:", error);
        if (callback) callback(error);
      }
    });
  });
});
