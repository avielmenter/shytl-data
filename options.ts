import { err, ParseError } from "./error";

export type Options = {
    rounds: number,
    contentTagsOn: boolean
}

export function parseOptions(options: any): Options | ParseError {
    if (!Number.isInteger(options?.rounds))
        return err<ParseError>("ParseError", "Not an Options object: " + JSON.stringify(options));

    const rounds: number = Number.isInteger(options?.rounds) ? options?.rounds : 1;
    const contentTagsOn = options?.contentTagsOn === false ? false : true;

    return { rounds, contentTagsOn };
}