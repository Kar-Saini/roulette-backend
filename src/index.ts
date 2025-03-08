import { WebSocketServer } from "ws";
import https from "https";
import fs from "fs";
import UserManager from "./classes/user/UserManager";
const server = https.createServer({
  cert: fs.readFileSync(
    "/etc/letsencrypt/live/kar-saini.duckdns.org/fullchain.pem"
  ),
  key: fs.readFileSync(
    "/etc/letsencrypt/live/kar-saini.duckdns.org/privkey.pem"
  ),
});
const wss = new WebSocketServer({ server });

wss.on("connection", (ws, request) => {
  console.log("Secure WebSocket Server Started");

  const url = request.url;
  const params = new URLSearchParams(url?.split("?")[1]);
  const name = params.get("name");

  UserManager.getInstance().addUser(ws, name || "Anonymous");
});

// Start the HTTPS server
server.listen(8080, () => {
  console.log("HTTPS & WSS Server running on port 8080");
});
