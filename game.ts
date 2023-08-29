import { Card, parseCard } from './card';
import * as Levels from './levels';
import { Options, parseOptions } from './options';
import { parseArray, parseOrNull, parseWholeNumber } from './parse';
import { User, parseUser } from './user';

import { err, isError, ParseError } from './error';

export type GameID = string;
export type CardIndex = number;

export type Game = {
    id: GameID,
    created: Date,
    cards: [ Card[], Card[], Card[], Card[] ],
    cardHistory: Card[],
    currentAsker: number | null,
    currentAnswerer: number | null,
    currentCard: Card | undefined,
    currentLevel: number,
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

export function createGameFromId(id: GameID) : Game {
    return { 
        id, 
        created: new Date(), 
        cards: [
            shuffle(Levels.levelOne),
            shuffle(Levels.levelTwo),
            shuffle(Levels.levelThree),
            shuffle(Levels.levelFour)
        ],
        cardHistory: [],
        currentAsker: null,
        currentAnswerer: null, 
        currentCard: undefined,
        currentLevel: 0, 
        currentRound: 0, 
        options: { rounds: 1, contentTagsOn: true },
        players: []
    };
}

export function parseGame(rawGame: any): Game | ParseError{
    if (!rawGame)
        return err<ParseError>("ParseError", "Not a Game object: " + JSON.stringify(rawGame));

    const GameID: GameID | undefined = String(rawGame.id);
    const created: Date | undefined = new Date(rawGame.created);

    const levelOne = parseArray(rawGame.cards[0], parseCard);
    const levelTwo = parseArray(rawGame.cards[1], parseCard);
    const levelThree = parseArray(rawGame.cards[2], parseCard);
    const levelFour = parseArray(rawGame.cards[3], parseCard);

    const cards: [ Card[], Card[], Card[], Card[] ] = [ levelOne, levelTwo, levelThree, levelFour ];
    const cardHistory: Card[] = [];

    const currentAsker = parseOrNull(rawGame.currentAsker, parseWholeNumber);
    const currentAnswerer = parseOrNull(rawGame.currentAnswerer, parseWholeNumber);

    const currentCard = parseCard(rawGame.currentCard);

    const currentLevel = parseWholeNumber(rawGame.currentLevel);
    const currentRound = parseWholeNumber(rawGame.currentCard);

    const options = parseOptions(rawGame.options);

    if (isError(currentAsker))      return currentAsker;
    if (isError(currentAnswerer))   return currentAnswerer;
    if (isError(currentCard))       return currentCard;
    if (isError(currentLevel))      return currentLevel;
    if (isError(currentRound))      return currentRound;
    if (isError(options))           return options;

    const players = parseArray(rawGame.players, parseUser);

    return GameID && created
        ? { 
            id: GameID, 
            created,
            cards,
            cardHistory,
            currentAsker,
            currentAnswerer,
            currentCard,
            currentLevel,
            currentRound,
            options,
            players
        } : err<ParseError>("ParseError", "Not a Game object: " + JSON.stringify(rawGame));
}