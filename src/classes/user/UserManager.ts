require("dotenv").config();
import { WebSocket } from "ws";
import User from "./User";
import { OutgoingMesssage } from "../../types/types";
let ID = 1;
export default class UserManager {
  private _users: { [key: string]: User } = {};
  private static instance: UserManager;

  private constructor() {}
  public static getInstance() {
    if (!UserManager.instance) {
      UserManager.instance = new UserManager();
    }
    return UserManager.instance;
  }
  addUser(ws: WebSocket, name: string) {
    const userId = ID.toString();
    const newUser = new User(ws, userId, name, name === process.env.ADMIN_NAME);
    this._users[userId] = newUser;
    newUser.ws.on("close", () => this.removeUser(userId));
    ID++;
  }

  removeUser(userId: string) {
    delete this._users[userId];
  }

  broadcast(message: OutgoingMesssage) {
    Object.keys(this._users).forEach((key) =>
      this._users[key].ws.send(JSON.stringify(message))
    );
  }

  won(userId: string, amount: number, betOnNumber: number, result: number) {
    this._users[userId].won(amount, betOnNumber, result);
  }
  lost(userId: string, amount: number, betOnNumber: number, result: number) {
    this._users[userId].lost(amount, betOnNumber, result);
  }
}
