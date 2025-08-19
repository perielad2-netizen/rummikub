import { v4 as uuidv4 } from 'uuid'
import type { Tile, TileSet, GameMove, BotPlayer, BotStrategy } from '../types'

// Generate a full deck of Rummikub tiles
export function generateDeck(): Tile[] {
  const tiles: Tile[] = []
  const colors: ('red' | 'blue' | 'black' | 'yellow')[] = ['red', 'blue', 'black', 'yellow']
  
  // Add numbered tiles (2 sets of 1-13 in each color)
  for (let set = 0; set < 2; set++) {
    for (const color of colors) {
      for (let number = 1; number <= 13; number++) {
        tiles.push({
          id: uuidv4(),
          color,
          number,
          isJoker: false
        })
      }
    }
  }
  
  // Add jokers (2 jokers)
  for (let i = 0; i < 2; i++) {
    tiles.push({
      id: uuidv4(),
      color: 'red', // Color doesn't matter for jokers
      number: 'joker',
      isJoker: true
    })
  }
  
  return shuffleDeck(tiles)
}

// Shuffle deck using Fisher-Yates algorithm
export function shuffleDeck(deck: Tile[]): Tile[] {
  const shuffled = [...deck]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// Deal initial hands for players
export function dealInitialHands(deck: Tile[], playerCount: number, gameType: 'rummy31' | 'rummyannette'): {
  hands: Tile[][]
  remainingDeck: Tile[]
} {
  const hands: Tile[][] = []
  const handSize = gameType === 'rummyannette' ? 15 : 14 // Rummy Annette uses 15 tiles
  
  const deckCopy = [...deck]
  
  for (let player = 0; player < playerCount; player++) {
    const hand = deckCopy.splice(0, handSize)
    hands.push(hand)
  }
  
  return { hands, remainingDeck: deckCopy }
}

// Check if a set of tiles forms a valid run
export function isValidRun(tiles: Tile[]): boolean {
  if (tiles.length < 3) return false
  
  // Sort tiles by number (handle jokers separately)
  const nonJokers = tiles.filter(t => !t.isJoker).sort((a, b) => (a.number as number) - (b.number as number))
  const jokerCount = tiles.filter(t => t.isJoker).length
  
  if (nonJokers.length === 0) return false // Can't have only jokers
  
  // All non-jokers must be same color
  const color = nonJokers[0].color
  if (!nonJokers.every(t => t.color === color)) return false
  
  // Check for consecutive numbers with jokers filling gaps
  let expectedNumber = nonJokers[0].number as number
  let jokersUsed = 0
  
  for (let i = 0; i < nonJokers.length; i++) {
    const currentNumber = nonJokers[i].number as number
    const gap = currentNumber - expectedNumber
    
    if (gap > 0) {
      // Need jokers to fill the gap
      if (jokersUsed + gap - 1 > jokerCount) return false
      jokersUsed += gap - 1
    } else if (gap < 0) {
      return false // Duplicate or out of order
    }
    
    expectedNumber = currentNumber + 1
  }
  
  return jokersUsed <= jokerCount
}

// Check if a set of tiles forms a valid group
export function isValidGroup(tiles: Tile[]): boolean {
  if (tiles.length < 3 || tiles.length > 4) return false
  
  const nonJokers = tiles.filter(t => !t.isJoker)
  const jokerCount = tiles.filter(t => t.isJoker).length
  
  if (nonJokers.length === 0) return false // Can't have only jokers
  
  // All non-jokers must have same number
  const number = nonJokers[0].number
  if (!nonJokers.every(t => t.number === number)) return false
  
  // All non-jokers must have different colors
  const colors = new Set(nonJokers.map(t => t.color))
  if (colors.size !== nonJokers.length) return false
  
  // Total tiles should not exceed 4 (one of each color)
  const totalUniqueColors = colors.size + jokerCount
  return totalUniqueColors <= 4
}

// Validate a complete tile set
export function validateTileSet(tiles: Tile[]): { isValid: boolean; setType: 'run' | 'group' | null } {
  if (tiles.length < 3) return { isValid: false, setType: null }
  
  const isRun = isValidRun(tiles)
  const isGroup = isValidGroup(tiles)
  
  if (isRun) return { isValid: true, setType: 'run' }
  if (isGroup) return { isValid: true, setType: 'group' }
  
  return { isValid: false, setType: null }
}

// Calculate points for a hand (for scoring at end of game)
export function calculateHandPoints(hand: Tile[]): number {
  return hand.reduce((total, tile) => {
    if (tile.isJoker) return total + 30
    const number = tile.number as number
    if (number >= 11) return total + 10 // Face cards worth 10
    return total + number
  }, 0)
}

// Check if a player can win (valid initial meld + lay down all tiles)
export function canWin(hand: Tile[], gameType: 'rummy31' | 'rummyannette'): boolean {
  if (gameType === 'rummy31') {
    // Rummy 31: Need initial meld of 30+ points, then lay down all remaining tiles
    return checkRummy31Win(hand)
  } else {
    // Rummy Annette: Need one run, can have unmatched tiles
    return checkRummyAnnetteWin(hand)
  }
}

function checkRummy31Win(hand: Tile[]): boolean {
  // Try to find combinations that total 30+ points for initial meld
  // This is a complex combinatorial problem - simplified implementation
  const combinations = generateAllCombinations(hand)
  
  for (const combo of combinations) {
    const points = calculateSetPoints(combo)
    if (points >= 30) {
      // Check if remaining tiles can form valid sets
      const remainingTiles = hand.filter(t => !combo.some(c => c.id === t.id))
      if (canFormValidSets(remainingTiles)) {
        return true
      }
    }
  }
  
  return false
}

function checkRummyAnnetteWin(hand: Tile[]): boolean {
  // Need at least one run, rest can be unmatched
  const allCombinations = generateAllCombinations(hand)
  
  return allCombinations.some(combo => {
    const validation = validateTileSet(combo)
    return validation.isValid && validation.setType === 'run'
  })
}

function calculateSetPoints(tiles: Tile[]): number {
  return tiles.reduce((total, tile) => {
    if (tile.isJoker) return total + 30
    const number = tile.number as number
    return total + (number >= 11 ? 10 : number)
  }, 0)
}

function generateAllCombinations(tiles: Tile[]): Tile[][] {
  const combinations: Tile[][] = []
  
  // Generate all possible combinations of 3+ tiles
  for (let size = 3; size <= tiles.length; size++) {
    const combos = getCombinations(tiles, size)
    combinations.push(...combos)
  }
  
  return combinations
}

function getCombinations(array: Tile[], size: number): Tile[][] {
  if (size === 1) return array.map(item => [item])
  if (size > array.length) return []
  
  const combinations: Tile[][] = []
  
  for (let i = 0; i <= array.length - size; i++) {
    const head = array[i]
    const tail = array.slice(i + 1)
    const tailCombos = getCombinations(tail, size - 1)
    
    for (const combo of tailCombos) {
      combinations.push([head, ...combo])
    }
  }
  
  return combinations
}

function canFormValidSets(tiles: Tile[]): boolean {
  if (tiles.length === 0) return true
  if (tiles.length < 3) return false
  
  // Try to form sets with remaining tiles
  for (let size = 3; size <= tiles.length; size++) {
    const combinations = getCombinations(tiles, size)
    
    for (const combo of combinations) {
      const validation = validateTileSet(combo)
      if (validation.isValid) {
        const remainingTiles = tiles.filter(t => !combo.some(c => c.id === t.id))
        if (canFormValidSets(remainingTiles)) {
          return true
        }
      }
    }
  }
  
  return false
}

// Sort tiles for display (by color, then by number)
export function sortTiles(tiles: Tile[]): Tile[] {
  const colorOrder = { red: 1, blue: 2, black: 3, yellow: 4 }
  
  return [...tiles].sort((a, b) => {
    // Jokers come last
    if (a.isJoker && !b.isJoker) return 1
    if (!a.isJoker && b.isJoker) return -1
    if (a.isJoker && b.isJoker) return 0
    
    // Sort by color first
    const colorDiff = colorOrder[a.color] - colorOrder[b.color]
    if (colorDiff !== 0) return colorDiff
    
    // Then by number
    return (a.number as number) - (b.number as number)
  })
}

// Generate random room key
export function generateRoomKey(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

// Bot AI logic
export function createBotStrategy(difficulty: 'easy' | 'medium' | 'hard'): BotStrategy {
  switch (difficulty) {
    case 'easy':
      return {
        aggressiveness: 0.3,
        riskTolerance: 0.4,
        memoryAccuracy: 0.6,
        reactionTime: 2000 + Math.random() * 3000
      }
    case 'medium':
      return {
        aggressiveness: 0.6,
        riskTolerance: 0.5,
        memoryAccuracy: 0.8,
        reactionTime: 1000 + Math.random() * 2000
      }
    case 'hard':
      return {
        aggressiveness: 0.8,
        riskTolerance: 0.3,
        memoryAccuracy: 0.95,
        reactionTime: 500 + Math.random() * 1000
      }
  }
}

export function calculateBotMove(bot: BotPlayer, gameState: any, availableMoves: GameMove[]): GameMove | null {
  const { strategy } = bot
  
  // Simple bot logic - can be enhanced
  const validMoves = availableMoves.filter(move => {
    // Bot considers move based on strategy
    if (move.type === 'meld') {
      // More aggressive bots meld more often
      return Math.random() < strategy.aggressiveness
    }
    return Math.random() < 0.7 // Default probability
  })
  
  if (validMoves.length === 0) return null
  
  // Choose move based on risk tolerance
  const sortedMoves = validMoves.sort((a, b) => {
    const aRisk = calculateMoveRisk(a)
    const bRisk = calculateMoveRisk(b)
    
    // Risk-averse bots prefer safer moves
    return strategy.riskTolerance > 0.5 ? bRisk - aRisk : aRisk - bRisk
  })
  
  return sortedMoves[0]
}

function calculateMoveRisk(move: GameMove): number {
  // Simple risk calculation - can be enhanced
  switch (move.type) {
    case 'meld':
      return 0.3 // Medium risk
    case 'layoff':
      return 0.1 // Low risk
    case 'rearrange':
      return 0.8 // High risk
    default:
      return 0.5
  }
}