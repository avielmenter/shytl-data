export type ParseError = {
    type: "Error",
    errorType: "ParseError",
    error: any
}

export type UpdateError = {
    type: "Error",
    errorType: "UpdateError",
    error: any
}

export type ErrorTypes = "ParseError" | "UpdateError";

export type Error 
    = ParseError
    | UpdateError;

export function err<T extends Error>(errorType: ErrorTypes, error: any): T {
    return {
        type: "Error",
        errorType,
        error
    } as T;
}

export function isError(error: any): error is Error {
    return error.type === "Error";
}