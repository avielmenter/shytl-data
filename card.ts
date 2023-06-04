import { ParseError, err, isError } from "./error";

export type ContentTag = "red" | "orange" | "yellow" | "green";

export type Card = {
    text: string,
    contentTag?: ContentTag
}

export function parseContentTag(tag: any): ContentTag | ParseError {
    if (tag === "red" || tag === "orange" || tag === "yellow" || tag === "green")
        return tag;
    return err<ParseError>("ParseError", "Not a valid content tag: " + JSON.stringify(tag));
}

export function parseCard(card: any) : Card | ParseError {
    if (typeof card?.text !== "string")
        return err<ParseError>("ParseError", "Not a valid card object: " + JSON.stringify(card));

    const text = String(card.text);
    const contentTag = card.contentTag === undefined ? undefined : parseContentTag(card.contentTag);

    if (isError(contentTag))
        return contentTag;

    return { text, contentTag };
}

export const FinalCard: Card = {
    text: "You have finished all the cards in this level!",
    contentTag: undefined
};