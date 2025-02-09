// https://www.charpeni.com/blog/properly-type-object-keys-and-object-entries

export const objectKeys = <Obj extends Object>(obj: Obj): (keyof Obj)[] =>
    Object.keys(obj) as (keyof Obj)[];

type Entries<T> = {
    [K in keyof T]: [K, T[K]];
}[keyof T][];

export const objectEntries = <Obj extends Object>(
    obj: Obj
): [keyof typeof obj, any][] =>
    (Object.entries(obj) as Entries<typeof obj>).map(([key, value]) => [
        key,
        value,
    ]);
