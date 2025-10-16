import express from "express";
import { WebSocketServer } from "ws";

const app = express();
const port = process.env.PORT || 10000;
const server = app.listen(port, () => console.log(`Server running on ${port}`));

const wss = new WebSocketServer({ server });
const rooms = {};

wss.on("connection", ws => {
  ws.on("message", message => {
    const data = JSON.parse(message);
    if (data.action === "createRoom") {
      const roomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
      rooms[roomCode] = [ws];
      ws.room = roomCode;
      ws.send(JSON.stringify({ type: "roomCreated", code: roomCode }));
    } else if (data.action === "joinRoom") {
      const room = rooms[data.room];
      if (room) {
        room.push(ws);
        ws.room = data.room;
        ws.send(JSON.stringify({ type: "joinedRoom", code: data.room }));
        room.forEach(client => {
          if (client !== ws) client.send(JSON.stringify({ type: "playerJoined", name: data.name }));
        });
      } else {
        ws.send(JSON.stringify({ type: "error", msg: "Room not found" }));
      }
    }
  });

  ws.on("close", () => {
    if (ws.room && rooms[ws.room]) {
      rooms[ws.room] = rooms[ws.room].filter(client => client !== ws);
      if (rooms[ws.room].length === 0) delete rooms[ws.room];
    }
  });
});
