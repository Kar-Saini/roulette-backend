import { WebSocket } from "ws";
import GameManager from "../game/GameManager";
import {
  GameState,
  IncommingMessage,
  OutgoingMesssage,
} from "../../types/types";
const MULTIPLIER = 17;
export default class User {
  private name: string;
  private balance: number;
  ws: WebSocket;
  private lockedAmount: number;
  private userId: string;
  isAdmin: Boolean;

  constructor(ws: WebSocket, userId: string, name: string, isAdmin: boolean) {
    this.balance = 2500;
    this.name = name;
    this.lockedAmount = 0;
    this.ws = ws;
    this.userId = userId;
    this.isAdmin = isAdmin;
    this.initHandlers();
  }
  initHandlers() {
    this.ws.on("message", (data: string) => {
      const message: IncommingMessage = JSON.parse(data);
      switch (message.type) {
        case "bet":
          this.bet(message.amount, message.betOnNumber, message.clientId);
          break;
        case "start-game":
          if (this.isAdmin) {
            GameManager.getInstance().startGame();
          }
          break;
        case "end-game":
          if (this.isAdmin) {
            GameManager.getInstance().endGame(message.result);
          }
          break;
        case "stop-bets":
          if (this.isAdmin) {
            GameManager.getInstance().stopBets();
          }
          break;
      }
    });
  }
  bet(amount: number, betOnNumber: number, clientId: string) {
    const isBetPalced = GameManager.getInstance().bet(
      amount,
      this.userId,
      betOnNumber
    );
    if (isBetPalced) {
      this.balance -= amount;
      this.lockedAmount += amount;
      this.send({
        type: "bet",
        amount: amount,
        balance: this.balance,
        lockedAmount: this.lockedAmount,
        clientId,
      });
    } else {
      this.send({
        type: "bet-undo",
        amount: amount,
        balance: this.balance,
        lockedAmount: this.lockedAmount,
        clientId,
      });
    }
  }
  send(message: OutgoingMesssage) {
    this.ws.send(JSON.stringify(message));
  }
  won(amount: number, betOnNumber: number, result: number) {
    const wonAmount =
      amount * (betOnNumber === 0 ? MULTIPLIER * 2 : MULTIPLIER);
    this.balance += wonAmount;
    this.lockedAmount = 0;
    this.send({
      type: "won",
      balance: this.balance,
      betOnNumber,
      result,
    });
  }
  lost(amount: number, betOnNumber: number, result: number) {
    this.send({
      type: "lost",
      balance: this.balance,
      betOnNumber,
      lostAmount: amount,
      result,
    });
  }
}
