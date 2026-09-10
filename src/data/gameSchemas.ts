import type { GameSettingDefinition } from '../types/game';

// -------------------------------------------------------------
// PLAYER CUSTOMIZATION SCHEMAS (Visuals / Themes / Aesthetics)
// -------------------------------------------------------------

export const snakeCustomizationSchema: GameSettingDefinition[] = [
  { key: 'skin', type: 'select', label: 'Snake Skin', defaultValue: 'classic', options: [
    { value: 'classic', label: 'Classic' },
    { value: 'neon', label: 'Neon Glow' },
    { value: 'galaxy', label: 'Galaxy' },
    { value: 'fire', label: 'Fire & Ember' },
    { value: 'emerald', label: 'Emerald Dragon' },
    { value: 'cyber', label: 'Cyberpunk' }
  ]},
  { key: 'primaryColor', type: 'color', label: 'Primary Color', defaultValue: '#22c55e' },
  { key: 'secondaryColor', type: 'color', label: 'Secondary Color', defaultValue: '#16a34a' },
  { key: 'headStyle', type: 'select', label: 'Head Style', defaultValue: 'rounded', options: [
    { value: 'rounded', label: 'Rounded' },
    { value: 'square', label: 'Square' },
    { value: 'diamond', label: 'Diamond' }
  ]},
  { key: 'eyeStyle', type: 'select', label: 'Eye Style', defaultValue: 'cute', options: [
    { value: 'cute', label: 'Cute Anime' },
    { value: 'classic', label: 'Classic Dots' },
    { value: 'slits', label: 'Viper Slits' },
    { value: 'glow', label: 'Glowing Eyes' }
  ]},
  { key: 'trail', type: 'select', label: 'Trail Effect', defaultValue: 'none', options: [
    { value: 'none', label: 'None' },
    { value: 'glow', label: 'Neon Glow' },
    { value: 'rainbow', label: 'Rainbow Pulse' },
    { value: 'particles', label: 'Sparkles' }
  ]}
];

export const defaultSnakeCustomization = {
  skin: 'classic',
  primaryColor: '#22c55e',
  secondaryColor: '#16a34a',
  headStyle: 'rounded',
  eyeStyle: 'cute',
  trail: 'none'
};

export const twenty48CustomizationSchema: GameSettingDefinition[] = [
  { key: 'theme', type: 'select', label: 'Tile Theme', defaultValue: 'classic', options: [
    { value: 'classic', label: 'Classic Warm' },
    { value: 'neon', label: 'Cyber Neon' },
    { value: 'pastel', label: 'Pastel Dream' },
    { value: 'synthwave', label: 'Synthwave 80s' },
    { value: 'emerald', label: 'Emerald Mint' },
    { value: 'dark', label: 'OLED Dark' }
  ]},
  { key: 'primaryColor', type: 'color', label: 'Accent Color', defaultValue: '#f59e0b' },
  { key: 'tileShape', type: 'select', label: 'Tile Corners', defaultValue: 'rounded', options: [
    { value: 'rounded', label: 'Smooth Rounded' },
    { value: 'square', label: 'Crisp Square' },
    { value: 'pill', label: 'Ultra Curved' }
  ]},
  { key: 'animations', type: 'toggle', label: 'Tile Merge Animations', defaultValue: true }
];

export const defaultTwenty48Customization = {
  theme: 'classic',
  primaryColor: '#f59e0b',
  tileShape: 'rounded',
  animations: true
};

export const reactionCustomizationSchema: GameSettingDefinition[] = [
  { key: 'theme', type: 'select', label: 'Visual Style', defaultValue: 'classic', options: [
    { value: 'classic', label: 'Signal Lights (Red/Green)' },
    { value: 'cyber', label: 'Cyber Pulse (Cyan/Pink)' },
    { value: 'minimal', label: 'Minimalist Monochrome' },
    { value: 'sunset', label: 'Sunset Glow' }
  ]},
  { key: 'targetStyle', type: 'select', label: 'Target Graphic', defaultValue: 'fullscreen', options: [
    { value: 'fullscreen', label: 'Full Screen Flash' },
    { value: 'circle', label: 'Center Bullseye' },
    { value: 'bolt', label: 'Lightning Strike ⚡' }
  ]},
  { key: 'primaryColor', type: 'color', label: 'Custom Accent', defaultValue: '#ef4444' }
];

export const defaultReactionCustomization = {
  theme: 'classic',
  targetStyle: 'fullscreen',
  primaryColor: '#ef4444'
};

export const minesweeperCustomizationSchema: GameSettingDefinition[] = [
  { key: 'theme', type: 'select', label: 'Board Palette', defaultValue: 'modern', options: [
    { value: 'modern', label: 'Modern Sleek' },
    { value: 'retro', label: 'Classic Windows 95' },
    { value: 'matrix', label: 'Green Matrix' },
    { value: 'dark', label: 'Deep Charcoal' }
  ]},
  { key: 'flagStyle', type: 'select', label: 'Flag Marker', defaultValue: 'flag', options: [
    { value: 'flag', label: 'Standard Flag 🚩' },
    { value: 'warning', label: 'Hazard Sign ⚠️' },
    { value: 'pin', label: 'Red Pin 📍' },
    { value: 'skull', label: 'Danger Skull 💀' }
  ]},
  { key: 'mineStyle', type: 'select', label: 'Mine Graphic', defaultValue: 'bomb', options: [
    { value: 'bomb', label: 'Classic Bomb 💣' },
    { value: 'spike', label: 'Spike Mine 💥' },
    { value: 'hazard', label: 'Biohazard ☣️' }
  ]},
  { key: 'primaryColor', type: 'color', label: 'Board Accent', defaultValue: '#6366f1' }
];

export const defaultMinesweeperCustomization = {
  theme: 'modern',
  flagStyle: 'flag',
  mineStyle: 'bomb',
  primaryColor: '#6366f1'
};

export const sudokuCustomizationSchema: GameSettingDefinition[] = [
  { key: 'theme', type: 'select', label: 'Board Theme', defaultValue: 'clean', options: [
    { value: 'clean', label: 'Clean Paper' },
    { value: 'midnight', label: 'Midnight Blue' },
    { value: 'coffee', label: 'Warm Sepia' },
    { value: 'blueprint', label: 'Architect Blueprint' }
  ]},
  { key: 'primaryColor', type: 'color', label: 'Selected Cell Highlight', defaultValue: '#0ea5e9' },
  { key: 'matchingHighlight', type: 'toggle', label: 'Highlight Matching Numbers', defaultValue: true },
  { key: 'errorHighlight', type: 'toggle', label: 'Highlight Conflicts Instantly', defaultValue: true }
];

export const defaultSudokuCustomization = {
  theme: 'clean',
  primaryColor: '#0ea5e9',
  matchingHighlight: true,
  errorHighlight: true
};

export const typingCustomizationSchema: GameSettingDefinition[] = [
  { key: 'fontStyle', type: 'select', label: 'Typography', defaultValue: 'mono', options: [
    { value: 'mono', label: 'JetBrains / Code Monospace' },
    { value: 'sans', label: 'Modern Inter Sans' },
    { value: 'terminal', label: 'Retro Terminal Pixel' },
    { value: 'serif', label: 'Editorial Serif' }
  ]},
  { key: 'theme', type: 'select', label: 'Color Accent', defaultValue: 'neon', options: [
    { value: 'neon', label: 'Cyber Purple' },
    { value: 'matrix', label: 'Hacker Green' },
    { value: 'slate', label: 'Slate Minimal' },
    { value: 'amber', label: 'Vintage Amber' }
  ]},
  { key: 'caretStyle', type: 'select', label: 'Caret Indicator', defaultValue: 'line', options: [
    { value: 'line', label: 'Smooth Vertical Line' },
    { value: 'block', label: 'Terminal Solid Block' },
    { value: 'underline', label: 'Subtle Underline' }
  ]},
  { key: 'primaryColor', type: 'color', label: 'Active Letter Glow', defaultValue: '#8b5cf6' }
];

export const defaultTypingCustomization = {
  fontStyle: 'mono',
  theme: 'neon',
  caretStyle: 'line',
  primaryColor: '#8b5cf6'
};


export const snakeSchema: GameSettingDefinition[] = [
  // Basic
  { key: 'speed', type: 'select', label: 'Speed', defaultValue: 'normal', options: [{label: 'Slow', value: 'slow'}, {label: 'Normal', value: 'normal'}, {label: 'Fast', value: 'fast'}, {label: 'Chaos', value: 'chaos'}] },
  { key: 'startingLength', type: 'slider', label: 'Starting Length', defaultValue: 3, min: 1, max: 10, step: 1 },
  { key: 'gridSize', type: 'select', label: 'Grid Size', defaultValue: 'medium', options: [{label: 'Small', value: 'small'}, {label: 'Medium', value: 'medium'}, {label: 'Large', value: 'large'}, {label: 'Huge', value: 'huge'}] },
  // Advanced
  { key: 'wrapAround', type: 'toggle', label: 'Wrap Walls', defaultValue: false },
  { key: 'obstacleDensity', type: 'select', label: 'Obstacles Density', defaultValue: 'none', options: [{label: 'None', value: 'none'}, {label: 'Low', value: 'low'}, {label: 'High', value: 'high'}, {label: 'Chaos', value: 'chaos'}] },
  { key: 'foodTypes', type: 'select', label: 'Food Types', defaultValue: 'classic', options: [{label: 'Classic', value: 'classic'}, {label: 'Varied (Score multipliers)', value: 'varied'}] },
  { key: 'goldenFood', type: 'toggle', label: 'Golden Food', defaultValue: true },
  { key: 'powerups', type: 'toggle', label: 'Enable Powerups', defaultValue: false },
  { key: 'scoreMultiplier', type: 'slider', label: 'Score Multiplier', defaultValue: 1, min: 1, max: 5, step: 1 },
];

export const snakeArenaSchema: GameSettingDefinition[] = [
  { key: 'teams', type: 'toggle', label: 'Team Mode', defaultValue: false },
  { key: 'teamSize', type: 'slider', label: 'Max Team Size', defaultValue: 2, min: 2, max: 5, step: 1 },
  { key: 'arenaSize', type: 'select', label: 'Arena Size', defaultValue: 'medium', options: [{label: 'Small', value: 'small'}, {label: 'Medium', value: 'medium'}, {label: 'Large', value: 'large'}, {label: 'Massive', value: 'massive'}] },
  { key: 'speed', type: 'select', label: 'Speed', defaultValue: 'normal', options: [{label: 'Slow', value: 'slow'}, {label: 'Normal', value: 'normal'}, {label: 'Fast', value: 'fast'}, {label: 'Extreme', value: 'extreme'}] },
  { key: 'foodDensity', type: 'select', label: 'Food Density', defaultValue: 'medium', options: [{label: 'Low', value: 'low'}, {label: 'Medium', value: 'medium'}, {label: 'High', value: 'high'}] },
  { key: 'powerUps', type: 'toggle', label: 'Power-ups', defaultValue: true },
  { key: 'obstacles', type: 'select', label: 'Obstacles', defaultValue: 'few', options: [{label: 'None', value: 'none'}, {label: 'Few', value: 'few'}, {label: 'Many', value: 'many'}] },
  { key: 'wrapAround', type: 'toggle', label: 'Wrap Walls', defaultValue: false },
  { key: 'friendlyFire', type: 'toggle', label: 'Friendly Fire (Teams)', defaultValue: false },
  { key: 'respawn', type: 'toggle', label: 'Respawn Allowed', defaultValue: false },
  { key: 'matchDuration', type: 'select', label: 'Match Duration', defaultValue: 120, options: [{label: '1 Minute', value: 60}, {label: '2 Minutes', value: 120}, {label: '5 Minutes', value: 300}, {label: 'Unlimited', value: 0}] },
];

export const tictactoeSchema: GameSettingDefinition[] = [
  { key: 'boardSize', type: 'select', label: 'Board Size', defaultValue: '3x3', options: [{label: 'Classic (3x3)', value: '3x3'}, {label: 'Big Board (5x5)', value: '5x5'}, {label: 'Mega (7x7)', value: '7x7'}] },
  { key: 'winCondition', type: 'select', label: 'Win Condition', defaultValue: '3', options: [{label: '3 in a row', value: '3'}, {label: '4 in a row', value: '4'}, {label: '5 in a row', value: '5'}] },
  { key: 'turnTimer', type: 'select', label: 'Turn Timer', defaultValue: 30, options: [{label: '10 seconds (Speed)', value: 10}, {label: '30 seconds', value: 30}, {label: '60 seconds', value: 60}, {label: 'Unlimited', value: 0}] },
  { key: 'startingPlayer', type: 'select', label: 'Starting Player', defaultValue: 'random', options: [{label: 'Random', value: 'random'}, {label: 'Host', value: 'host'}, {label: 'Guest', value: 'guest'}] },
  { key: 'bestOf', type: 'select', label: 'Match Series', defaultValue: 1, options: [{label: 'Single Game', value: 1}, {label: 'Best of 3', value: 3}, {label: 'Best of 5', value: 5}] },
];

export const connectfourSchema: GameSettingDefinition[] = [
  { key: 'boardWidth', type: 'slider', label: 'Board Width', defaultValue: 7, min: 5, max: 10, step: 1 },
  { key: 'boardHeight', type: 'slider', label: 'Board Height', defaultValue: 6, min: 4, max: 8, step: 1 },
  { key: 'connectLength', type: 'slider', label: 'Connect Length to Win', defaultValue: 4, min: 3, max: 5, step: 1 },
  { key: 'turnTimer', type: 'select', label: 'Turn Timer', defaultValue: 30, options: [{label: '15 seconds', value: 15}, {label: '30 seconds', value: 30}, {label: '60 seconds', value: 60}, {label: 'Unlimited', value: 0}] },
  { key: 'startingPlayer', type: 'select', label: 'Starting Player', defaultValue: 'random', options: [{label: 'Random', value: 'random'}, {label: 'Host', value: 'host'}, {label: 'Guest', value: 'guest'}] },
  { key: 'bestOf', type: 'select', label: 'Match Series', defaultValue: 1, options: [{label: 'Single Game', value: 1}, {label: 'Best of 3', value: 3}, {label: 'Best of 5', value: 5}] },
];

export const wordGuesserSchema: GameSettingDefinition[] = [
  { key: 'category', type: 'select', label: 'Category', defaultValue: 'general', options: [{label: 'General', value: 'general'}, {label: 'Animals', value: 'animals'}, {label: 'Science', value: 'science'}, {label: 'Hard', value: 'hard'}] },
  { key: 'difficulty', type: 'select', label: 'Difficulty', defaultValue: 'medium', options: [{label: 'Easy', value: 'easy'}, {label: 'Medium', value: 'medium'}, {label: 'Hard', value: 'hard'}] },
  { key: 'wordLength', type: 'slider', label: 'Word Length', defaultValue: 5, min: 4, max: 8, step: 1 },
  { key: 'guessAttempts', type: 'slider', label: 'Lives', defaultValue: 6, min: 4, max: 10, step: 1 },
  { key: 'roundTimer', type: 'select', label: 'Round Timer', defaultValue: 60, options: [{label: '30 seconds', value: 30}, {label: '60 seconds', value: 60}, {label: 'Unlimited', value: 0}] },
  { key: 'hints', type: 'toggle', label: 'Allow Hints', defaultValue: true },
  { key: 'teamMode', type: 'toggle', label: 'Team Mode', defaultValue: false },
];

export const typingSchema: GameSettingDefinition[] = [
  { key: 'teamMode', type: 'toggle', label: 'Team Mode', defaultValue: false },
  { key: 'difficulty', type: 'select', label: 'Difficulty', defaultValue: 'normal', options: [{label: 'Beginner', value: 'easy'}, {label: 'Intermediate', value: 'normal'}, {label: 'Advanced (Punctuation)', value: 'hard'}, {label: 'Expert (Numbers & Syms)', value: 'expert'}, {label: 'Chaos', value: 'chaos'}] },
  { key: 'paragraphLength', type: 'select', label: 'Length', defaultValue: 100, options: [{label: '50 words', value: 50}, {label: '100 words', value: 100}, {label: '150 words', value: 150}, {label: '250 words', value: 250}, {label: '500 words', value: 500}] },
  { key: 'duration', type: 'select', label: 'Time Limit', defaultValue: 60, options: [{label: '30 Seconds', value: 30}, {label: '60 Seconds', value: 60}, {label: '120 Seconds', value: 120}, {label: 'Unlimited', value: 0}] },
  { key: 'punctuation', type: 'toggle', label: 'Punctuation ON', defaultValue: true },
  { key: 'numbers', type: 'toggle', label: 'Numbers ON', defaultValue: false },
  { key: 'strictMode', type: 'toggle', label: 'Strict Mode (No Backspace)', defaultValue: false },
  { key: 'scoring', type: 'select', label: 'Scoring', defaultValue: 'balanced', options: [{label: 'Balanced', value: 'balanced'}, {label: 'Speed-focused', value: 'speed'}, {label: 'Accuracy-focused', value: 'accuracy'}, {label: 'Hardcore', value: 'hardcore'}] },
];

export const chessSchema: GameSettingDefinition[] = [
  { key: 'timeControl', type: 'select', label: 'Time Control', defaultValue: '10+0', options: [
    {label: 'Bullet (1+0)', value: '1+0'},
    {label: 'Bullet (2+1)', value: '2+1'},
    {label: 'Blitz (3+0)', value: '3+0'},
    {label: 'Blitz (3+2)', value: '3+2'},
    {label: 'Blitz (5+0)', value: '5+0'},
    {label: 'Blitz (5+3)', value: '5+3'},
    {label: 'Rapid (10+0)', value: '10+0'},
    {label: 'Rapid (10+5)', value: '10+5'},
    {label: 'Rapid (15+10)', value: '15+10'},
    {label: 'Classical (30+0)', value: '30+0'},
  ]},
  { key: 'rated', type: 'toggle', label: 'Competitive Mode', defaultValue: false },
  { key: 'theme', type: 'select', label: 'Board Theme', defaultValue: 'classic', options: [{label: 'Classic', value: 'classic'}, {label: 'Dark', value: 'dark'}, {label: 'Wood', value: 'wood'}, {label: 'Glass', value: 'glass'}] }
];

export const minesweeperSchema: GameSettingDefinition[] = [
  { key: 'boardSize', type: 'select', label: 'Board Size', defaultValue: '16x16', options: [{label: 'Small (9x9)', value: '9x9'}, {label: 'Medium (16x16)', value: '16x16'}, {label: 'Large (30x16)', value: '30x16'}] },
  { key: 'mineCount', type: 'slider', label: 'Mine Density', defaultValue: 15, min: 10, max: 30, step: 1 },
  { key: 'timer', type: 'toggle', label: 'Timer Limit', defaultValue: true },
  { key: 'lives', type: 'slider', label: 'Lives', defaultValue: 1, min: 1, max: 5, step: 1 },
  { key: 'teamMode', type: 'toggle', label: 'Co-op Team Mode', defaultValue: false },
];

export const sudokuSchema: GameSettingDefinition[] = [
  { key: 'difficulty', type: 'select', label: 'Difficulty', defaultValue: 'medium', options: [{label: 'Easy', value: 'easy'}, {label: 'Medium', value: 'medium'}, {label: 'Hard', value: 'hard'}, {label: 'Expert', value: 'expert'}] },
  { key: 'hints', type: 'toggle', label: 'Allow Hints', defaultValue: false },
  { key: 'timer', type: 'select', label: 'Time Limit', defaultValue: 0, options: [{label: 'Unlimited', value: 0}, {label: '5 Min', value: 300}, {label: '10 Min', value: 600}] },
];

export const twenty48Schema: GameSettingDefinition[] = [
  { key: 'boardSize', type: 'select', label: 'Board Size', defaultValue: '4', options: [{label: '3x3', value: '3'}, {label: '4x4', value: '4'}, {label: '5x5', value: '5'}, {label: '6x6', value: '6'}] },
  { key: 'targetTile', type: 'select', label: 'Target Tile', defaultValue: '2048', options: [{label: '1024', value: '1024'}, {label: '2048', value: '2048'}, {label: '4096', value: '4096'}, {label: '8192', value: '8192'}, {label: 'Endless', value: 'endless'}] },
  { key: 'timeLimit', type: 'select', label: 'Time Limit', defaultValue: 0, options: [{label: 'Unlimited', value: 0}, {label: '3 Min', value: 180}, {label: '5 Min', value: 300}] },
  { key: 'undo', type: 'toggle', label: 'Allow Undo', defaultValue: false },
];

export const reactionSchema: GameSettingDefinition[] = [
  { key: 'rounds', type: 'slider', label: 'Rounds', defaultValue: 5, min: 1, max: 20, step: 1 },
  { key: 'difficulty', type: 'select', label: 'Difficulty', defaultValue: 'normal', options: [{label: 'Normal', value: 'normal'}, {label: 'Hard (Fake Outs)', value: 'hard'}, {label: 'Expert (Moving Targets)', value: 'expert'}] },
  { key: 'scoring', type: 'select', label: 'Scoring Mode', defaultValue: 'average', options: [{label: 'Average Score', value: 'average'}, {label: 'Best Score', value: 'best'}] },
  { key: 'teamMode', type: 'toggle', label: 'Team Mode', defaultValue: false },
];

export const imposterSchema: GameSettingDefinition[] = [
  { key: 'impostersCount', type: 'select', label: 'Number of Imposters', defaultValue: 1, options: [{label: '1 Imposter', value: 1}, {label: '2 Imposters', value: 2}, {label: 'Random', value: 'random'}] },
  { key: 'clueTime', type: 'select', label: 'Clue Time (s)', defaultValue: 60, options: [{label: '15s', value: 15}, {label: '30s', value: 30}, {label: '45s', value: 45}, {label: '60s', value: 60}, {label: '90s', value: 90}] },
  { key: 'discussionTime', type: 'select', label: 'Discussion Time (s)', defaultValue: 60, options: [{label: '15s', value: 15}, {label: '30s', value: 30}, {label: '45s', value: 45}, {label: '60s', value: 60}, {label: '90s', value: 90}, {label: '120s', value: 120}] },
  { key: 'votingTime', type: 'select', label: 'Voting Time (s)', defaultValue: 30, options: [{label: '15s', value: 15}, {label: '30s', value: 30}, {label: '45s', value: 45}, {label: '60s', value: 60}] },
  { key: 'wordDifficulty', type: 'select', label: 'Word Difficulty', defaultValue: 'normal', options: [{label: 'Easy', value: 'easy'}, {label: 'Normal', value: 'normal'}, {label: 'Hard', value: 'hard'}, {label: 'Expert', value: 'expert'}] },
  { key: 'wordCategory', type: 'select', label: 'Word Category', defaultValue: 'general', options: [{label: 'General', value: 'general'}, {label: 'Animals', value: 'animals'}, {label: 'Food', value: 'food'}, {label: 'Places', value: 'places'}] },
  { key: 'anonymousVoting', type: 'toggle', label: 'Anonymous Voting', defaultValue: false }
];

export const GAME_SCHEMAS: Record<string, GameSettingDefinition[]> = {
  'snake': snakeSchema,
  'snake-arena': snakeArenaSchema,
  'tic-tac-toe': tictactoeSchema,
  'connect-four': connectfourSchema,
  'word-guesser': wordGuesserSchema,
  'typing-test': typingSchema,
  'chess': chessSchema,
  'minesweeper': minesweeperSchema,
  'sudoku': sudokuSchema,
  '2048': twenty48Schema,
  'reaction-test': reactionSchema,
  'imposter': imposterSchema
};

export const GAME_CUSTOMIZATION_SCHEMAS: Record<string, GameSettingDefinition[]> = {
  'snake': snakeCustomizationSchema,
  'snake-arena': snakeCustomizationSchema,
  '2048': twenty48CustomizationSchema,
  'reaction': reactionCustomizationSchema,
  'reaction-test': reactionCustomizationSchema,
  'minesweeper': minesweeperCustomizationSchema,
  'sudoku': sudokuCustomizationSchema,
  'typing': typingCustomizationSchema,
  'typing-test': typingCustomizationSchema,
};

export const DEFAULT_GAME_CUSTOMIZATIONS: Record<string, Record<string, any>> = {
  'snake': defaultSnakeCustomization,
  'snake-arena': defaultSnakeCustomization,
  '2048': defaultTwenty48Customization,
  'reaction': defaultReactionCustomization,
  'reaction-test': defaultReactionCustomization,
  'minesweeper': defaultMinesweeperCustomization,
  'sudoku': defaultSudokuCustomization,
  'typing': defaultTypingCustomization,
  'typing-test': defaultTypingCustomization,
};

