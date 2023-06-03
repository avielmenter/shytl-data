import { err, ParseError } from './error';

export type UserID = string;

export type User = {
    id: UserID,
    name: string
}

export function parseUser(user: any) : User | ParseError {
    const id = user.id;
    const name = user.name;

    if (id && name)
        return { id: String(id), name: String(name) };
    else
        return err<ParseError>("ParseError", "Not a User object: " + JSON.stringify(user));
}