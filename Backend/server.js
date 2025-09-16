import { app } from "./index.js";
import http from "http";
import { Server as SocketIOServer } from "socket.io";

const port = process.env.PORT || 3000;

const httpServer = http.createServer(app);

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  // Join a room for signaling
  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    socket.to(roomId).emit("peer-joined", { socketId: socket.id });

    // When a peer signals readiness (e.g., after reload), notify others to start offer flow
    socket.on("ready", ({ roomId: r }) => {
      socket.to(r).emit("peer-ready", { socketId: socket.id });
    });

    socket.on("signal-offer", ({ roomId: r, offer }) => {
      socket.to(r).emit("signal-offer", { offer, from: socket.id });
    });

    socket.on("signal-answer", ({ roomId: r, answer }) => {
      socket.to(r).emit("signal-answer", { answer, from: socket.id });
    });

    socket.on("signal-ice-candidate", ({ roomId: r, candidate }) => {
      socket.to(r).emit("signal-ice-candidate", { candidate, from: socket.id });
    });

    socket.on("disconnect", () => {
      socket.to(roomId).emit("peer-left", { socketId: socket.id });
    });
  });
});

httpServer.listen(port, "0.0.0.0", () => {
  console.log(`Server is running on port ${port}`);
});