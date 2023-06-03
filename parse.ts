import { err, isError, ParseError } from "./error";

export function parseOrNull<T>(raw: any, parse: (o: any) => T | ParseError): T | null | ParseError {
    if (raw === undefined || raw === null)
        return null;

    return parse(raw);
}

export function parseArray<T>(arr: any, parser: (o: any) => T | ParseError): T[] {
    if (Array.isArray(arr))
        return arr.map(parser).filter((o: T | ParseError): o is T => !isError(o));
    else
        return [];
}

export function parseWholeNumber(raw: any): number | ParseError {
    if (Number.isInteger(raw) && raw >= 0)
        return raw;
    return err<ParseError>("ParseError", "Not a whole number: " + JSON.stringify(raw));
}