import { Bet, GameState } from "../../types/types";
import User from "../user/User";
import UserManager from "../user/UserManager";

export default class GameManager {
  private static instance: GameManager;
  private bets: Bet[] = [];
  gameState: GameState = GameState.GameOVer;

  private constructor() {}

  public static getInstance() {
    if (!GameManager.instance) {
      GameManager.instance = new GameManager();
    }
    return GameManager.instance;
  }

  bet(amount: number, userId: string, betOnNumber: number) {
    if (this.gameState === GameState.CanBet) {
      this.bets.push({ amount, userId, betOnNumber });
      return true;
    }
    return false;
  }

  startGame() {
    if (this.gameState === GameState.GameOVer) {
      this.gameState = GameState.CanBet;
    }
    UserManager.getInstance().broadcast({ type: "game-started" });
  }
  stopBets() {
    if (this.gameState === GameState.CanBet) {
      this.gameState = GameState.CantBet;
    }
    UserManager.getInstance().broadcast({ type: "bets-stopped" });
  }
  endGame(result: number) {
    if (this.gameState === GameState.CantBet) {
      this.gameState = GameState.GameOVer;
      this.bets.forEach((bet) => {
        if (bet.betOnNumber === result) {
          UserManager.getInstance().won(
            bet.userId,
            bet.amount,
            bet.betOnNumber,
            result
          );
        } else {
          UserManager.getInstance().lost(
            bet.userId,
            bet.amount,
            bet.betOnNumber,
            result
          );
        }
      });
      this.bets = [];
      UserManager.getInstance().flush();
      UserManager.getInstance().broadcast({
        type: "game-ended",
        result: result,
      });
    }
  }
}
