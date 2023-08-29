import { err, isError, ParseError } from "./error";

export type ContentTag = "red" | "orange" | "yellow" | "green";

export type Card = {
    asker?: string | undefined,
    answerer?: string | undefined,
    contentTag?: ContentTag,
    skipped: boolean,
    text: string
}

export function parseContentTag(tag: any): ContentTag | ParseError {
    if (tag === "red" || tag === "orange" || tag === "yellow" || tag === "green")
        return tag;
    return err<ParseError>("ParseError", "Not a valid content tag: " + JSON.stringify(tag));
}

export function parseCard(card: any) : Card | ParseError {
    if (typeof card?.text !== "string")
        return err<ParseError>("ParseError", "Not a valid card object: " + JSON.stringify(card));
    
    const asker = card.asker === undefined ? undefined : card.asker;
    const answerer = card.answerer === undefined ? undefined : card.answerer;
    const contentTag = card.contentTag === undefined ? undefined : parseContentTag(card.contentTag);
    const skipped = card === undefined ? undefined : card.skipped;
    const text = String(card.text);

    if (isError(contentTag))
        return contentTag;

    return { asker, answerer, contentTag, skipped, text };
}

export const FinalCard: Card = {
    contentTag: undefined,
    skipped: false,
    text: "You have finished all the cards in this game!"
};