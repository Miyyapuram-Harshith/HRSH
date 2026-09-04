import type { GameSettingDefinition } from '../types/game';

export const snakeArenaSchema: GameSettingDefinition[] = [
  {
    key: 'gridSize',
    type: 'select',
    label: 'Arena Size',
    defaultValue: 'medium',
    options: [
      { value: 'small', label: 'Small (20x20)' },
      { value: 'medium', label: 'Medium (40x40)' },
      { value: 'large', label: 'Large (60x60)' }
    ]
  },
  {
    key: 'speed',
    type: 'select',
    label: 'Snake Speed',
    defaultValue: 'normal',
    options: [
      { value: 'slow', label: 'Slow' },
      { value: 'normal', label: 'Normal' },
      { value: 'fast', label: 'Fast' },
      { value: 'extreme', label: 'Extreme' }
    ]
  },
  {
    key: 'obstacles',
    type: 'select',
    label: 'Obstacles',
    defaultValue: 'few',
    options: [
      { value: 'none', label: 'None' },
      { value: 'few', label: 'Few' },
      { value: 'many', label: 'Many' }
    ]
  },
  {
    key: 'winCondition',
    type: 'select',
    label: 'Win Condition',
    defaultValue: 'lastManStanding',
    options: [
      { value: 'lastManStanding', label: 'Last Man Standing' },
      { value: 'scoreTarget', label: 'Score Target' }
    ]
  }
];

export const tictactoeSchema: GameSettingDefinition[] = [
  {
    key: 'turnTimer',
    type: 'select',
    label: 'Turn Timer',
    defaultValue: 30,
    options: [
      { value: 15, label: '15 seconds' },
      { value: 30, label: '30 seconds' },
      { value: 60, label: '60 seconds' },
      { value: 0, label: 'Unlimited' }
    ]
  },
  {
    key: 'bestOf',
    type: 'select',
    label: 'Match Type',
    defaultValue: 1,
    options: [
      { value: 1, label: 'Single Game' },
      { value: 3, label: 'Best of 3' },
      { value: 5, label: 'Best of 5' }
    ]
  }
];

export const connectfourSchema: GameSettingDefinition[] = [
  {
    key: 'turnTimer',
    type: 'select',
    label: 'Turn Timer',
    defaultValue: 30,
    options: [
      { value: 15, label: '15 seconds' },
      { value: 30, label: '30 seconds' },
      { value: 60, label: '60 seconds' },
      { value: 0, label: 'Unlimited' }
    ]
  },
  {
    key: 'bestOf',
    type: 'select',
    label: 'Match Type',
    defaultValue: 1,
    options: [
      { value: 1, label: 'Single Game' },
      { value: 3, label: 'Best of 3' },
      { value: 5, label: 'Best of 5' }
    ]
  }
];

export const wordGuesserSchema: GameSettingDefinition[] = [
  {
    key: 'wordLength',
    type: 'slider',
    label: 'Word Length',
    defaultValue: 5,
    min: 4,
    max: 8,
    step: 1
  },
  {
    key: 'guessAttempts',
    type: 'slider',
    label: 'Guess Attempts',
    defaultValue: 6,
    min: 4,
    max: 10,
    step: 1
  },
  {
    key: 'roundTimer',
    type: 'select',
    label: 'Round Timer',
    defaultValue: 60,
    options: [
      { value: 30, label: '30 seconds' },
      { value: 60, label: '60 seconds' },
      { value: 120, label: '2 minutes' },
      { value: 0, label: 'Unlimited' }
    ]
  }
];

export const GAME_SCHEMAS: Record<string, GameSettingDefinition[]> = {
  'snake-arena': snakeArenaSchema,
  'tic-tac-toe': tictactoeSchema,
  'connect-four': connectfourSchema,
  'word-guesser': wordGuesserSchema
};
