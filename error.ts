export type ErrorTypes 
    = "ParseError" 
    | "ServerError" 
    | "UpdateError";

export interface Error {
    type: "Error",
    errorType: ErrorTypes,
    error: any
}

export interface ParseError extends Error {
    type: "Error",
    errorType: "ParseError",
    error: any
}

export interface ServerError extends Error {
    type: "Error",
    errorType: "ServerError",
    error: any
}

export interface UpdateError extends Error {
    type: "Error",
    errorType: "UpdateError",
    error: any
}

export function err<T extends Error>(errorType: ErrorTypes, error: any): T {
    return {
        type: "Error",
        errorType,
        error
    } as T;
}

export function isError(error: any): error is Error {
    return error?.type === "Error";
}