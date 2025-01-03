import { WebSocketServer } from "ws";
import UserManager from "./classes/user/UserManager";

const wss = new WebSocketServer({ port: 8080 });

wss.on("connection", (ws, request) => {
  const url = request.url;
  const params = new URLSearchParams(url?.split("?")[1]);
  const name = params.get("name");
  UserManager.getInstance().addUser(ws, name || "Anonymous");
});
