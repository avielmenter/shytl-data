import { err, UpdateError } from './error';
import { Options } from './options';
import { Game } from "./game";
import { User, UserID } from './user';

// EVENT TYPES

export type AddPlayerEvent = {
    type: "Event",
    eventType: "AddPlayer",
    event: { player: User }
}

export type DrawCardEvent = {
    type: "Event",
    eventType: "DrawCard"
}

export type JumpToLevelEvent = {
    type:  "Event",
    eventType: "JumpToLevel",
    event: { level: 1 | 2 | 3 | 4 }
}

export type RemovePlayerEvent = {
    type: "Event",
    eventType: "RemovePlayer",
    event: { playerID: UserID }
}

export type SkipCardEvent = {
    type: "Event",
    eventType: "SkipCard"
}

export type UpdateOptionsEvent = {
    type: "Event",
    eventType: "UpdateOptions",
    event: { options: Options }
}

export type Event 
    = AddPlayerEvent
    | DrawCardEvent
    | JumpToLevelEvent
    | RemovePlayerEvent
    | SkipCardEvent
    | UpdateOptionsEvent;

// UTILITY FUNCTIONS

function adjustPlayerIndex(currentPlayer: number | null, removedPlayer: number): number | null {
    if (currentPlayer === null || currentPlayer <= removedPlayer)
        return currentPlayer;
    return currentPlayer - 1;
}

function randIntExcept(start: number, end: number, except: number): number {
    while (true) {
        const r = Math.floor(Math.random() * (end - start) + start);
        if (r != except)
            return r;
    }
}

// EVENT FUNCTIONS

function addPlayer(game: Game, event: AddPlayerEvent): Game | UpdateError {
    if (game.players.filter(p => p.id == event.event.player.id).length > 0)
        return err<UpdateError>("UpdateError", "User is already playing the game: " + JSON.stringify(event.event.player));

    let players = [ ...game.players ];
    players.push(event.event.player);

    return {
        ...game,
        players 
    };
}

function drawCard(game: Game, event: DrawCardEvent): Game {
    const outOfCards = game.currentCard == game.cards[game.currentLevel - 1].length;

    const nextAsker = game.currentAsker === null
        ? 0
        : game.currentAsker + 1;

    if (nextAsker < game.players.length && !outOfCards) {   // if we don't need to go to the next round or level
        return {
            ...game,
            currentAsker: nextAsker,
            currentAnswerer: randIntExcept(0, game.players.length, nextAsker),
            currentCard: game.currentCard + 1
        }
    } else if (game.currentRound < game.options.rounds - 1 && !outOfCards) { // if we need to go to the next round, but not the next level 
        return {
            ...game,
            currentAsker: 0,
            currentAnswerer: randIntExcept(0, game.players.length, 0),
            currentCard: game.currentCard + 1,
            currentRound: game.currentRound + 1
        }
    } else if (game.currentLevel < 4) {    // if we need to go to the next level
        return {
            ...game,
            currentAsker: 0,
            currentAnswerer: randIntExcept(0, game.players.length, 0),
            currentCard: 0,
            currentLevel: game.currentLevel + 1 as (1 | 2 | 3 | 4),  // typescript doesn't understand that ((1 | 2 | 3 | 4) && !4) + 1 = (2 | 3 | 4)
            currentRound: 0,
        }
    } else {    // if the game needs to end
        return {
            ...game,
            currentAsker: null,
            currentAnswerer: null,
            currentCard: game.cards[3].length,
            currentLevel: 4,
            currentRound: game.options.rounds
        }
    }
}

function jumpToLevel(game: Game, event: JumpToLevelEvent): Game {
    return {
        ...game,
        currentCard: 0,
        currentLevel: event.event.level,
        currentRound: 0
    }
}

function removePlayer(game: Game, event: RemovePlayerEvent): Game | UpdateError {
    const playerIndex = game.players.findIndex(p => p.id == event.event.playerID);

    if (playerIndex == -1)
        return game;
    else
        return {
            ...game,
            currentAsker: adjustPlayerIndex(game.currentAsker, playerIndex),
            currentAnswerer: adjustPlayerIndex(game.currentAnswerer, playerIndex),
            players: game.players.filter(p => p.id != event.event.playerID)
        };
}

function skipCard(game: Game, event: SkipCardEvent): Game {
    if (game.currentCard >= game.cards[game.currentLevel - 1].length)
        return game;
    
    let skipped = JSON.parse(JSON.stringify(game.skipped));
    skipped[game.currentLevel - 1].push(game.currentCard);

    return {
        ...game,
        skipped,
        currentCard: game.currentCard + 1
    };
}

function updateOptions(game: Game, event: UpdateOptionsEvent): Game {
    return { ...game, options: event.event.options };
}

// REDUCER

export function update(game: Game, event: Event) : Game | UpdateError {
    switch (event.eventType) {
        case "AddPlayer":
            return addPlayer(game, event);
        case "DrawCard":
            return drawCard(game, event);
        case "JumpToLevel":
            return jumpToLevel(game, event);
        case "RemovePlayer":
            return removePlayer(game, event);
        case "SkipCard":
            return skipCard(game, event);
        case "UpdateOptions":
            return updateOptions(game, event);   
    }
}