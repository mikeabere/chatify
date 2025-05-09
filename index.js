/* Server-side: index.js */
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const xss = require("xss-clean");
const dotenv = require("dotenv");
const { v4: uuidv4 } = require("uuid");
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(xss());

const limiter = rateLimit({
  windowMs: 10 * 1000,
  max: 10,
});
app.use(limiter);

const users = new Map();
const messageHistory = [];

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    users.set(socket.id, decoded.username);
    next();
  } catch (err) {
    return next(new Error("Authentication error"));
  }
});

io.on("connection", (socket) => {
  io.emit("onlineUsers", Array.from(users.values()));

  socket.emit("history", messageHistory);

  socket.on("message", (encryptedMsg) => {
    const msgObj = { sender: socket.user.username, encryptedMsg };
    messageHistory.push(msgObj);
    io.emit("message", msgObj);
  });

  socket.on("typing", () => {
    socket.broadcast.emit("typing", socket.user.username);
  });

  socket.on("disconnect", () => {
    users.delete(socket.id);
    io.emit("onlineUsers", Array.from(users.values()));
  });
});

server.listen(5000, () => console.log("Server running on port 5000"));
