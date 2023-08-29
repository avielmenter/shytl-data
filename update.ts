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
    event: { level: number }
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
    const nextAsker = game.currentAsker === null
        ? 0
        : game.currentAsker + 1;
    
    const currentCard = game.cards[game.currentLevel].length >= 0 ? game.cards[game.currentLevel][0] : undefined;
    
    // if we end up drawing a new card 1 card from the front, 
    // remove the card by updating this level's cards to be 1 card less from the front
    let updatedCards = game.cards;
    if (currentCard !== undefined) updatedCards[game.currentLevel] = updatedCards[game.currentLevel].slice(1);

    const updatedCardHistory = game.currentCard !== undefined ? [game.currentCard, ... game.cardHistory] : game.cardHistory;

    if (nextAsker < game.players.length && currentCard !== undefined) {   // if we don't need to go to the next round or level
        const updatedCurrentAskerIndex = nextAsker;
        const updatedCurrentAnswererIndex = randIntExcept(0, game.players.length, nextAsker);

        const updatedCurrentCard = {
            ...currentCard,
            cards: updatedCards,
            cardHistory: updatedCardHistory,
            asker: game.players[updatedCurrentAskerIndex].name,
            answerer: game.players[updatedCurrentAnswererIndex].name 
        };

        return {
            ...game,
            cards: updatedCards,
            cardHistory: updatedCardHistory,
            currentAsker: nextAsker,
            currentAnswerer: randIntExcept(0, game.players.length, nextAsker),
            currentCard: updatedCurrentCard
        }
    } else if (game.currentRound < game.options.rounds - 1 && currentCard !== undefined) { // if we need to go to the next round, but not the next level 
        const updatedCurrentAskerIndex = 0;
        const updatedCurrentAnswererIndex = randIntExcept(0, game.players.length, 0);

        const updatedCurrentCard = {
            ...currentCard,
            cards: updatedCards,
            cardHistory: updatedCardHistory,
            asker: game.players[updatedCurrentAskerIndex].name,
            answerer: game.players[updatedCurrentAnswererIndex].name 
        };

        return {
            ...game,
            cards: updatedCards,
            cardHistory: updatedCardHistory,
            currentAsker: 0,
            currentAnswerer: randIntExcept(0, game.players.length, 0),
            currentCard: updatedCurrentCard,
            currentRound: game.currentRound + 1
        }
    } else if (game.currentLevel < game.cards.length-1) {    // if we need to go to the next level
        const updatedCurrentAskerIndex = 0;
        const updatedCurrentAnswererIndex = randIntExcept(0, game.players.length, 0);

        const updatedCurrentCard = {
            ... game.cards[game.currentLevel + 1][0],
            asker: game.players[updatedCurrentAskerIndex].name,
            answerer: game.players[updatedCurrentAnswererIndex].name
        };

        return {
            ...game,
            cards: updatedCards,
            cardHistory: updatedCardHistory,
            currentAsker: 0,
            currentAnswerer: randIntExcept(0, game.players.length, 0),
            currentCard: updatedCurrentCard,
            currentLevel: game.currentLevel + 1,
            currentRound: 0
        }
    } else {    // if the game needs to end/we are on the last level
        return {
            ...game,
            cards: updatedCards,
            cardHistory: updatedCardHistory,
            currentAsker: null,
            currentAnswerer: null,
            currentCard: undefined,
            currentLevel: game.cards.length-1,
            currentRound: game.options.rounds
        }
    }
}

function jumpToLevel(game: Game, event: JumpToLevelEvent): Game {
    return {
        ...game,
        currentCard: game.cards[event.event.level][0],
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
    if (game.currentCard === undefined)
        return game;
    
    const updatedCardToSkipped = {
        ...game.currentCard,
        skipped: true
    };

    const updatedCurrentCard = game.cards[game.currentLevel].length >= 0 && game.currentAsker !== null && game.currentAnswerer !== null
        ? {
            ...game.cards[game.currentLevel][0],
            asker: game.players[game.currentAsker].name,
            answerer: game.players[game.currentAnswerer].name
        }
        : undefined;
    
    // if we end up drawing a new card 1 card from the front, 
    // remove the card by updating this level's cards to be 1 card less from the front
    let updatedCards = game.cards;
    if (updatedCurrentCard !== undefined) updatedCards[game.currentLevel] = updatedCards[game.currentLevel].slice(1);

    const updatedCardHistory = [
        updatedCardToSkipped,
        ...game.cardHistory
    ]

    return {
        ...game,
        cards: updatedCards,
        cardHistory: updatedCardHistory,
        currentCard: updatedCurrentCard
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