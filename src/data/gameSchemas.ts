import type { GameSettingDefinition } from '../types/game';

export const snakeSchema: GameSettingDefinition[] = [
  { key: 'speed', type: 'select', label: 'Speed', defaultValue: 'normal', options: [{label: 'Slow', value: 'slow'}, {label: 'Normal', value: 'normal'}, {label: 'Fast', value: 'fast'}] },
  { key: 'startingLength', type: 'slider', label: 'Starting Length', defaultValue: 3, min: 1, max: 10, step: 1 },
  { key: 'gridSize', type: 'select', label: 'Grid Size', defaultValue: 'medium', options: [{label: 'Small', value: 'small'}, {label: 'Medium', value: 'medium'}, {label: 'Large', value: 'large'}] },
  { key: 'wrapAround', type: 'toggle', label: 'Wrap-around Walls', defaultValue: false },
  { key: 'obstacleDensity', type: 'select', label: 'Obstacles', defaultValue: 'none', options: [{label: 'None', value: 'none'}, {label: 'Low', value: 'low'}, {label: 'High', value: 'high'}] },
];

export const snakeArenaSchema: GameSettingDefinition[] = [
  { key: 'arenaSize', type: 'select', label: 'Arena Size', defaultValue: 'medium', options: [{label: 'Small', value: 'small'}, {label: 'Medium', value: 'medium'}, {label: 'Large', value: 'large'}] },
  { key: 'speed', type: 'select', label: 'Speed', defaultValue: 'normal', options: [{label: 'Slow', value: 'slow'}, {label: 'Normal', value: 'normal'}, {label: 'Fast', value: 'fast'}, {label: 'Extreme', value: 'extreme'}] },
  { key: 'startingLength', type: 'slider', label: 'Starting Length', defaultValue: 3, min: 1, max: 10, step: 1 },
  { key: 'matchDuration', type: 'select', label: 'Match Duration', defaultValue: 120, options: [{label: '1 Minute', value: 60}, {label: '2 Minutes', value: 120}, {label: '5 Minutes', value: 300}, {label: 'Unlimited', value: 0}] },
  { key: 'obstacles', type: 'select', label: 'Obstacles', defaultValue: 'few', options: [{label: 'None', value: 'none'}, {label: 'Few', value: 'few'}, {label: 'Many', value: 'many'}] },
  { key: 'wrapAround', type: 'toggle', label: 'Wrap-around', defaultValue: false },
  { key: 'powerUps', type: 'toggle', label: 'Power-ups', defaultValue: true },
];

export const tictactoeSchema: GameSettingDefinition[] = [
  { key: 'turnTimer', type: 'select', label: 'Turn Timer', defaultValue: 30, options: [{label: '15 seconds', value: 15}, {label: '30 seconds', value: 30}, {label: '60 seconds', value: 60}, {label: 'Unlimited', value: 0}] },
  { key: 'bestOf', type: 'select', label: 'Match Type', defaultValue: 1, options: [{label: 'Single Game', value: 1}, {label: 'Best of 3', value: 3}, {label: 'Best of 5', value: 5}] },
  { key: 'startingPlayer', type: 'select', label: 'Starting Player', defaultValue: 'random', options: [{label: 'Random', value: 'random'}, {label: 'Host', value: 'host'}, {label: 'Guest', value: 'guest'}] },
];

export const connectfourSchema: GameSettingDefinition[] = [
  { key: 'turnTimer', type: 'select', label: 'Turn Timer', defaultValue: 30, options: [{label: '15 seconds', value: 15}, {label: '30 seconds', value: 30}, {label: '60 seconds', value: 60}, {label: 'Unlimited', value: 0}] },
  { key: 'bestOf', type: 'select', label: 'Match Type', defaultValue: 1, options: [{label: 'Single Game', value: 1}, {label: 'Best of 3', value: 3}, {label: 'Best of 5', value: 5}] },
];

export const wordGuesserSchema: GameSettingDefinition[] = [
  { key: 'difficulty', type: 'select', label: 'Difficulty', defaultValue: 'medium', options: [{label: 'Easy', value: 'easy'}, {label: 'Medium', value: 'medium'}, {label: 'Hard', value: 'hard'}] },
  { key: 'wordLength', type: 'slider', label: 'Word Length', defaultValue: 5, min: 4, max: 8, step: 1 },
  { key: 'guessAttempts', type: 'slider', label: 'Guess Attempts', defaultValue: 6, min: 4, max: 10, step: 1 },
  { key: 'roundTimer', type: 'select', label: 'Round Timer', defaultValue: 60, options: [{label: '30 seconds', value: 30}, {label: '60 seconds', value: 60}, {label: '2 minutes', value: 120}, {label: 'Unlimited', value: 0}] },
];

export const typingSchema: GameSettingDefinition[] = [
  { key: 'difficulty', type: 'select', label: 'Difficulty', defaultValue: 'normal', options: [{label: 'Easy', value: 'easy'}, {label: 'Normal', value: 'normal'}, {label: 'Hard (Punctuation)', value: 'hard'}] },
  { key: 'duration', type: 'select', label: 'Duration', defaultValue: 60, options: [{label: '30 Seconds', value: 30}, {label: '1 Minute', value: 60}, {label: '2 Minutes', value: 120}] },
  { key: 'accuracyRequirement', type: 'slider', label: 'Min Accuracy (%)', defaultValue: 0, min: 0, max: 100, step: 5 },
];

export const chessSchema: GameSettingDefinition[] = [
  { key: 'timeControl', type: 'select', label: 'Time Control', defaultValue: '10+0', options: [
    {label: 'Bullet (1+0)', value: '1+0'},
    {label: 'Bullet (2+1)', value: '2+1'},
    {label: 'Blitz (3+0)', value: '3+0'},
    {label: 'Blitz (3+2)', value: '3+2'},
    {label: 'Blitz (5+0)', value: '5+0'},
    {label: 'Rapid (10+0)', value: '10+0'},
    {label: 'Rapid (15+10)', value: '15+10'}
  ]},
  { key: 'rated', type: 'toggle', label: 'Rated Match', defaultValue: false },
  { key: 'theme', type: 'select', label: 'Board Theme', defaultValue: 'classic', options: [{label: 'Classic', value: 'classic'}, {label: 'Dark', value: 'dark'}, {label: 'Wood', value: 'wood'}] }
];

export const minesweeperSchema: GameSettingDefinition[] = [
  { key: 'difficulty', type: 'select', label: 'Difficulty', defaultValue: 'medium', options: [{label: 'Easy (9x9)', value: 'easy'}, {label: 'Medium (16x16)', value: 'medium'}, {label: 'Hard (30x16)', value: 'hard'}] },
  { key: 'timer', type: 'toggle', label: 'Timer', defaultValue: true },
];

export const sudokuSchema: GameSettingDefinition[] = [
  { key: 'difficulty', type: 'select', label: 'Difficulty', defaultValue: 'medium', options: [{label: 'Easy', value: 'easy'}, {label: 'Medium', value: 'medium'}, {label: 'Hard', value: 'hard'}] },
  { key: 'hints', type: 'toggle', label: 'Allow Hints', defaultValue: false },
];

export const twenty48Schema: GameSettingDefinition[] = [
  { key: 'boardSize', type: 'select', label: 'Board Size', defaultValue: '4', options: [{label: '4x4', value: '4'}, {label: '5x5', value: '5'}] },
  { key: 'targetTile', type: 'select', label: 'Target Tile', defaultValue: '2048', options: [{label: '1024', value: '1024'}, {label: '2048', value: '2048'}, {label: '4096', value: '4096'}, {label: 'Endless', value: 'endless'}] },
];

export const reactionSchema: GameSettingDefinition[] = [
  { key: 'rounds', type: 'slider', label: 'Rounds', defaultValue: 5, min: 1, max: 10, step: 1 },
  { key: 'difficulty', type: 'select', label: 'Difficulty', defaultValue: 'normal', options: [{label: 'Normal', value: 'normal'}, {label: 'Hard (Fake Outs)', value: 'hard'}] },
];

export const GAME_SCHEMAS: Record<string, GameSettingDefinition[]> = {
  'snake': snakeSchema,
  'snake-arena': snakeArenaSchema,
  'tic-tac-toe': tictactoeSchema,
  'connect-four': connectfourSchema,
  'word-guesser': wordGuesserSchema,
  'typing-test': typingSchema, // Added test for typing game ID consistency. Assuming 'typing-test'
  'chess': chessSchema,
  'minesweeper': minesweeperSchema,
  'sudoku': sudokuSchema,
  '2048': twenty48Schema,
  'reaction-test': reactionSchema
};
