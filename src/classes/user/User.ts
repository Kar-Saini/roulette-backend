import { WebSocket } from "ws";
import GameManager from "../game/GameManager";
import { IncommingMessage, OutgoingMesssage } from "../../types/types";

const MULTIPLIER = 17;
export default class User {
  private name: string;
  private balance: number;
  ws: WebSocket;
  lockedAmount: number;
  private userId: string;
  isAdmin: boolean;

  constructor(ws: WebSocket, userId: string, name: string, isAdmin: boolean) {
    this.balance = 2500;
    this.name = name;
    this.lockedAmount = 0;
    this.ws = ws;
    this.userId = userId;
    this.isAdmin = isAdmin;
    this.initHandlers();
    this.send({
      type: "current-state",
      gameState: GameManager.getInstance().gameState,
      balance: this.balance,
      userId,
    });
  }
  initHandlers() {
    this.ws.on("message", (data: string) => {
      const message: IncommingMessage = JSON.parse(data);
      switch (message.type) {
        case "bet":
          this.bet(message.amount, message.betOnNumber, message.clientId || "");
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
        case "get-user-data":
          this.send({
            type: "user-data",
            balance: this.balance,
            gameState: GameManager.getInstance().gameState,
          });
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
        betOnNumber,
      });
    } else {
      this.send({
        type: "bet-undo",
        amount: amount,
        balance: this.balance,
        lockedAmount: this.lockedAmount,
        clientId,
        betOnNumber,
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
      wonAmount,
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

  flush() {
    this.lockedAmount = 0;
  }
}
