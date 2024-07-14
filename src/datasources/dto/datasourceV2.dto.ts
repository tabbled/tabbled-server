// import { Context } from "../../entities/context";
// import { Revision } from "../entities/dataitem.entity";
// import { IsEmail, IsNotEmpty } from 'class-validator';

export class GetRevisionsDto {
    dataSourceAlias: string
    itemId: string
}

export class GetRevisionByIdDto {
    dataSourceAlias: string
    itemId: string
    revisionId: number
}

export class RevisionItem {
    id:  Uint8Array
    version: number
    createdAt: Date
    createdBy: {
        id: number,
        username: string,
        title: string
    }
    data?: any
}

export class GetRevisionsResponseDto {
    items: RevisionItem[]
    count: number
}