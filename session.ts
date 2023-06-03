import { Card, parseCard } from './card';
import * as Levels from './levels';
import { Options, parseOptions } from './options';
import { parseArray, parseOrNull, parseWholeNumber } from './parse';
import { User, parseUser } from './user';

import { err, isError, ParseError } from './error';

export type SessionID = string;

export type Session = {
    id: SessionID,
    created: Date,
    cards: [ Card[], Card[], Card[], Card[] ],
    currentAsker: number | null,
    currentAnswerer: number | null,
    currentCard: number,
    currentLevel: 1 | 2 | 3 | 4,
    currentRound: number,
    players: User[],
    options: Options
}

function shuffle(cards: Card[]): Card[] {
    let shuffled = [ ...cards ]; // copy array so we don't shuffle in place

    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        
        const temp = shuffled[i];
        shuffled[i] = shuffled[j];
        shuffled[j] = temp;
    }

    return shuffled;
}

export function createSessionFromId(id: SessionID) : Session {
    return { 
        id, 
        created: new Date(), 
        cards: [
            shuffle(Levels.levelOne),
            shuffle(Levels.levelTwo),
            shuffle(Levels.levelThree),
            shuffle(Levels.levelFour)
        ],
        currentAsker: null,
        currentAnswerer: null, 
        currentCard: 0,
        currentLevel: 1, 
        currentRound: 0, 
        options: { rounds: 1, contentTagsOn: true },
        players: []
    };
}

const parseLevelNumber: (level: any) => 1 | 2 | 3 | 4 | ParseError = (level: any) => 
    level === 1 || level === 2 || level === 3 || level == 4
        ? level
        : err<ParseError>("ParseError", "Not a level number: " + JSON.stringify(level));

export function parseSession(rawSession: any): Session | ParseError{
    if (!rawSession)
        return err<ParseError>("ParseError", "Not a Session object: " + JSON.stringify(rawSession));

    const sessionId: SessionID | undefined = String(rawSession.id);
    const created: Date | undefined = rawSession.created instanceof Date ? rawSession.created : undefined;

    const levelOne = parseArray(rawSession.cards?.levelOne, parseCard);
    const levelTwo = parseArray(rawSession.cards?.levelTwo, parseCard);
    const levelThree = parseArray(rawSession.cards?.levelThree, parseCard);
    const levelFour = parseArray(rawSession.cards?.levelFour, parseCard);

    const cards: [ Card[], Card[], Card[], Card[] ] = [ levelOne, levelTwo, levelThree, levelFour ];
    
    const currentAsker = parseOrNull(rawSession.currentAsker, parseWholeNumber);
    const currentAnswerer = parseOrNull(rawSession.currentAnswerer, parseWholeNumber);

    const currentCard = parseWholeNumber(rawSession.currentCard);

    const currentLevel = parseLevelNumber(rawSession.currentLevel);
    const currentRound = parseWholeNumber(rawSession.currentCard);

    const options = parseOptions(rawSession.options);

    if (isError(currentAsker))      return currentAsker;
    if (isError(currentAnswerer))   return currentAnswerer;
    if (isError(currentCard))       return currentCard;
    if (isError(currentLevel))      return currentLevel;
    if (isError(currentRound))      return currentRound;
    if (isError(options))           return options;

    const players = parseArray(rawSession.players, parseUser);

    return sessionId && created
        ? { 
            id: sessionId, 
            created,
            cards,
            currentAsker,
            currentAnswerer,
            currentCard,
            currentLevel,
            currentRound,
            options,
            players
        } : err<ParseError>("ParseError", "Not a Session object: " + JSON.stringify(rawSession));
}