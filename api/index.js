const express = require("express");
const WebSocket = require("ws");
const cors = require("cors");

const { createServer } = require("http");
const app = express();

app.use(cors());

const server = createServer(app);
const wss = new WebSocket.Server({ server });

const clients = new Map();

function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function buildRes(ws, senderProtocol, body) {
  let res = { instruction: null, message: null };

  switch (body.instruction) {
    case "reveal-notes":
      res.instruction = "reveal-notes";
      break;
    case "new-vote":
      res.instruction = "new-vote";
      break;
    case "update-players":
      const metadata = clients.get(ws);
      body.message.uuid = metadata.uuid;
      clients.set(ws, body.message);
      const players = Array.from(clients.values()).filter(
        (v) => v.roomUid == senderProtocol
      );

      res.instruction = "update-players";
      res.message = players;
      break;
  }

  return res;
}

function sendToClients(senderProtocol, body) {
  const bodyStringified = JSON.stringify(body);

  [...clients.keys()]
    .filter((client) => client.protocol == senderProtocol)
    .forEach((client) => {
      client.send(bodyStringified);
    });
}

wss.on("connection", (ws) => {
  const uuid = uuidv4();
  const roomUid = null;
  const name = null;
  const note = null;
  const metadata = { uuid, roomUid, name, note };

  clients.set(ws, metadata);

  ws.on("message", function incoming(bodyString) {
    const body = JSON.parse(bodyString);
    const senderProtocol = ws.protocol;
    const res = buildRes(ws, senderProtocol, body);

    sendToClients(senderProtocol, res);
  });

  ws.on("close", () => {
    const senderProtocol = ws.protocol;
    clients.delete(ws);

    const players = Array.from(clients.values()).filter(
      (v) => v.roomUid == senderProtocol
    );

    const res = {
      instruction: "update-players",
      message: players,
    };

    sendToClients(senderProtocol, res);
  });
});

app.get("/ping", (req, res) => {
  res.status(200).send({
    message: "pong",
  });
});

// send 404 if no other route matched
app.use((req, res) => {
  res.status(404).json({
    message: "Route Not Found",
    error: {
      message: "Route Not Found",
    },
  });
});

// setup a global error handler (for next(err))
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    message: err.message,
    error: {
      message: err.message,
    },
  });
});

server.listen(8080, function () {
  console.log("Listening on http://0.0.0.0:8080");
});
