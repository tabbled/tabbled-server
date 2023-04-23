export interface Context {
    accountId: number,
    userId: number,
    [name: string]: any | never
}