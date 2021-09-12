const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const port = process.env.PORT || 8000;
const WebSocket = require("ws");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

const wss = new WebSocket.Server({ port: 8001 });

const clients = new Map();

function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
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

  function sendToClients(senderProtocol, res) {
    const bodyStringified = JSON.stringify(res);

    [...clients.keys()]
      .filter((client) => client.protocol == senderProtocol)
      .forEach((client) => {
        client.send(bodyStringified);
      });
  }

  ws.on("close", () => {
    const senderProtocol = ws.protocol;
    clients.delete(ws);

    const players = Array.from(clients.values()).filter(
      (v) => v.roomUid == senderProtocol
    );
    const playersStringified = JSON.stringify(players);

    [...clients.keys()]
      .filter((client) => client.protocol == senderProtocol)
      .forEach((client) => {
        client.send(playersStringified);
      });
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

app.listen(port, () => {
  console.log(`Server is running on PORT ${port}`);
});

module.exports = app;
