// ============================================================
// HRSH — Commentary Engine 2.0
// ============================================================

import type { GameResult } from '../types/game';
import type { Moment } from './MomentEngine';

export type HumorLevel = 'NORMAL' | 'ROAST' | 'CHAOS';

interface CommentaryContext {
  gameId: string;
  result: GameResult;
  moments: Moment[];
  rank?: number;
  totalPlayers?: number;
  streak?: number;
  humorLevel: HumorLevel;
  multiplayerData?: any;
}

const FIRST_PLACE_LINES = [
  "Absolute menace.",
  "Nobody was ready for this.",
  "Bro entered the lobby with a business plan.",
  "The leaderboard has a new landlord.",
  "Everyone else was playing. This guy was conducting research.",
  "Someone forgot to tell the competition.",
  "Respectfully... leave some points for everyone else.",
  "The lobby has been conquered.",
  "Bro did not come here to participate.",
  "HRSH has identified the final boss.",
  "Someone check if this player has unlocked developer mode.",
  "First place. As the prophecy unnecessarily predicted.",
  "Congratulations. You have ruined everyone's confidence.",
  "That leaderboard position looks suspiciously comfortable.",
  "Everyone say thank you to our champion for making the rest of us look bad."
];

const SECOND_PLACE_LINES = [
  "Silver medal, gold-level heartbreak.",
  "One tiny step away from glory.",
  "So close you can practically hear first place laughing.",
  "Second place: premium spectator of first place.",
  "Bro was one decision away.",
  "Not bad. But the crown is still occupied.",
  "First place has been placed on notice.",
  "Silver today. Revenge arc tomorrow."
];

const THIRD_PLACE_LINES = [
  "Podium secured.",
  "Bronze with confidence.",
  "Third place has entered the chat.",
  "Not first. Not second. Still legally impressive.",
  "Someone had to complete the podium.",
  "Bronze today. Villain arc pending."
];

const LAST_PLACE_LINES = [
  "Someone had to keep the leaderboard symmetrical.",
  "Respectfully, the scoreboard noticed.",
  "At least the comeback has nowhere to go but up.",
  "Character development begins here.",
  "Last place today. Main character tomorrow.",
  "Your redemption arc has officially started.",
  "Points were attempted.",
  "The leaderboard has provided constructive feedback.",
  "Don't worry. The top is still accepting applications.",
  "Every champion has a first bad match.",
  "Statistically, somebody had to be here.",
  "HRSH believes in you. The leaderboard is still deciding."
];

const COMEBACK_LINES = [
  "THE COMEBACK ARC IS REAL.",
  "Bro was losing five seconds ago.",
  "Never count this player out.",
  "From 'it's over' to 'WHO IS #1?'",
  "That comeback needs its own documentary.",
  "Somewhere, the scoreboard is sweating.",
  "Bro activated second-phase boss music."
];

const CLUTCH_LINES = [
  "CLUTCH.",
  "THAT WAS NOT SUPPOSED TO WORK.",
  "Bro saved that match from the grave.",
  "Pressure detected. Pressure ignored.",
  "Absolutely illegal levels of composure.",
  "Last second. Maximum drama.",
  "HRSH recommends replaying that moment."
];

const PERSONAL_BEST_LINES = [
  "NEW PERSONAL BEST!",
  "Your previous record just got evicted.",
  "Brain firmware updated.",
  "Character stats have increased.",
  "Your past self has been defeated.",
  "Future you now has a problem.",
  "Someone just upgraded."
];

const DOMINATION_LINES = [
  "THIS WAS NOT A COMPETITION.",
  "The leaderboard has become a solo game.",
  "Everyone else has been respectfully outclassed.",
  "HRSH would like to remind everyone this was multiplayer.",
  "Bro turned multiplayer into single-player.",
  "The gap is doing emotional damage.",
  "Someone forgot to invite the final boss."
];

const CLOSE_FINISH_LINES = [
  "PHOTO FINISH!",
  "THAT WAS RIDICULOUSLY CLOSE.",
  "Bro lost by the thickness of a loading spinner.",
  "That wasn't a race. That was a rounding error.",
  "Someone check the decimal places.",
  "Winner by approximately one neuron.",
  "THE DIFFERENCE WAS BASICALLY NOTHING."
];

const UPSET_LINES = [
  "UPSET!",
  "The script has been thrown out.",
  "Nobody had this on the bingo card.",
  "THE UNDERDOG HAS ARRIVED.",
  "Someone just deleted the expected outcome.",
  "Prediction.exe has stopped working."
];

class HRSHCommentaryEngineImpl {
  
  private getRandom(lines: string[]): string {
    return lines[Math.floor(Math.random() * lines.length)];
  }

  generateCommentary(context: CommentaryContext): string {
    const { moments, rank, totalPlayers, result } = context;

    // Highest priority: DOMINATION, COMEBACK, CLUTCH
    const hasDomination = moments.some(m => m.type === 'DOMINATION');
    if (hasDomination) return this.getRandom(DOMINATION_LINES);

    const hasComeback = moments.some(m => m.type === 'COMEBACK');
    if (hasComeback) return this.getRandom(COMEBACK_LINES);

    const hasClutch = moments.some(m => m.type === 'CLUTCH');
    if (hasClutch) return this.getRandom(CLUTCH_LINES);

    const hasPhotoFinish = moments.some(m => m.type === 'PHOTO_FINISH');
    if (hasPhotoFinish) return this.getRandom(CLOSE_FINISH_LINES);

    const hasUpset = moments.some(m => m.type === 'UPSET');
    if (hasUpset) return this.getRandom(UPSET_LINES);

    const hasPB = moments.some(m => m.type === 'PERSONAL_BEST');

    // Win/Loss / Ranks
    if (totalPlayers && totalPlayers > 1) {
      if (rank === 1) {
        if (hasPB && Math.random() > 0.5) return this.getRandom(PERSONAL_BEST_LINES);
        return this.getRandom(FIRST_PLACE_LINES);
      }
      if (rank === 2) {
        return this.getRandom(SECOND_PLACE_LINES);
      }
      if (rank === 3 && totalPlayers >= 3) {
        return this.getRandom(THIRD_PLACE_LINES);
      }
      if (rank === totalPlayers) {
        return this.getRandom(LAST_PLACE_LINES);
      }
    }

    // Solo Fallbacks
    if (hasPB) return this.getRandom(PERSONAL_BEST_LINES);
    
    if (result.won) {
      return "Solid performance. Respectable.";
    }

    return "Points were attempted.";
  }
}

export const HRSHCommentaryEngine = new HRSHCommentaryEngineImpl();
