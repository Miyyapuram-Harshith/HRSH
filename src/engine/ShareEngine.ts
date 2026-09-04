import { GameRegistry } from './GameRegistry';

export class ShareEngine {
  /**
   * Generates a sharing string and attempts to copy to clipboard or use Web Share API
   */
  static async shareResult(gameId: string, score: number, additionalData?: any) {
    const game = GameRegistry.get(gameId);
    const gameName = game ? game.title : 'HRSH';
    
    let text = `I scored ${score.toLocaleString()} in ${gameName} on HRSH! 🔥`;
    
    // Add context if available
    if (additionalData?.wpm) {
      text = `I reached ${additionalData.wpm} WPM in ${gameName} on HRSH! ⌨️🔥`;
    } else if (additionalData?.reactionTime) {
      text = `My average reaction time is ${additionalData.reactionTime}ms on HRSH! ⚡`;
    }
    
    text += `\nCan you beat it? Play now: ${window.location.origin}/games/${game?.slug || ''}`;

    await this.executeShare(text, `HRSH - ${gameName} Result`);
  }

  static async shareChallenge(gameId: string, challengeId: string) {
    const game = GameRegistry.get(gameId);
    const text = `I've challenged you to a game of ${game?.title || 'HRSH'}! 🎮\n\nAccept the challenge: ${window.location.origin}/challenge/${challengeId}`;
    await this.executeShare(text, 'HRSH Challenge');
  }

  static async shareRoom(roomId: string, roomName: string) {
    const text = `Join my room "${roomName}" on HRSH! 🎮\n\nPlay online: ${window.location.origin}/room/${roomId}`;
    await this.executeShare(text, 'Join my HRSH Room');
  }

  private static async executeShare(text: string, title: string) {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text,
        });
        return true;
      } catch (err: any) {
        // AbortError is thrown if user cancels the share sheet
        if (err.name !== 'AbortError') {
          console.error('Error sharing:', err);
        }
      }
    }
    
    // Fallback to clipboard
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.error('Clipboard write failed:', err);
      return false;
    }
  }
}
