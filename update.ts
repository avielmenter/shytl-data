import { err, UpdateError } from './error';
import { Options } from './options';
import { Session } from "./session";
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

function addPlayer(session: Session, event: AddPlayerEvent): Session | UpdateError {
    if (session.players.filter(p => p.id == event.event.player.id).length > 0)
        return err<UpdateError>("UpdateError", "User is already playing the game: " + JSON.stringify(event.event.player));

    let players = [ ...session.players ];
    players.push(event.event.player);

    return {
        ...session,
        players 
    };
}

function drawCard(session: Session, event: DrawCardEvent): Session {
    const outOfCards = session.currentCard == session.cards[session.currentLevel - 1].length;

    const nextAsker = session.currentAsker === null
        ? 0
        : session.currentAsker + 1;

    if (nextAsker < session.players.length && !outOfCards) {   // if we don't need to go to the next round or level
        return {
            ...session,
            currentAsker: nextAsker,
            currentAnswerer: randIntExcept(0, session.players.length, nextAsker),
            currentCard: session.currentCard + 1
        }
    } else if (session.currentRound < session.options.rounds - 1 && !outOfCards) { // if we need to go to the next round, but not the next level 
        return {
            ...session,
            currentAsker: 0,
            currentAnswerer: randIntExcept(0, session.players.length, 0),
            currentCard: session.currentCard + 1,
            currentRound: session.currentRound + 1
        }
    } else if (session.currentLevel < 4) {    // if we need to go to the next level
        return {
            ...session,
            currentAsker: 0,
            currentAnswerer: randIntExcept(0, session.players.length, 0),
            currentCard: 0,
            currentLevel: session.currentLevel + 1 as (1 | 2 | 3 | 4),  // typescript doesn't understand that ((1 | 2 | 3 | 4) && !4) + 1 = (2 | 3 | 4)
            currentRound: 0,
        }
    } else {    // if the game needs to end
        return {
            ...session,
            currentAsker: null,
            currentAnswerer: null,
            currentCard: session.cards[3].length,
            currentLevel: 4,
            currentRound: session.options.rounds
        }
    }
}

function removePlayer(session: Session, event: RemovePlayerEvent): Session | UpdateError {
    const playerIndex = session.players.findIndex(p => p.id == event.event.playerID);

    if (playerIndex == -1)
        return session;
    else
        return {
            ...session,
            currentAsker: adjustPlayerIndex(session.currentAsker, playerIndex),
            currentAnswerer: adjustPlayerIndex(session.currentAnswerer, playerIndex),
            players: session.players.filter(p => p.id != event.event.playerID)
        };
}

function skipCard(session: Session, event: SkipCardEvent): Session {
    if (session.currentCard >= session.cards[session.currentLevel - 1].length)
        return session;
    return {
        ...session,
        currentCard: session.currentCard + 1
    };
}

function updateOptions(session: Session, event: UpdateOptionsEvent): Session {
    return { ...session, options: event.event.options };
}

// REDUCER

export function update(session: Session, event: Event) : Session | UpdateError {
    switch (event.eventType) {
        case "AddPlayer":
            return addPlayer(session, event);
        case "DrawCard":
            return drawCard(session, event);
        case "RemovePlayer":
            return removePlayer(session, event);
        case "SkipCard":
        return skipCard(session, event);
        case "UpdateOptions":
            return updateOptions(session, event);   
    }
}