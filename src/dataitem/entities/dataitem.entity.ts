import {
    Entity,
    Column,
    PrimaryColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn
} from "typeorm";

export enum DataItemType {
    'config' = 'config',
    'data'   = 'data'
}

@Entity({name: "data_items"})
export class DataItem {
    @PrimaryColumn({ type: "bigint"})
    id: number;

    @Column({ type: "bigint", name: 'rev'})
    rev: number;

    @Column({ type: "bigint", name: 'version'})
    ver: number;

    @Column({ type: "int", name: "account_id"})
    accountId: number;

    @Column({ type: "int", name: "alias"})
    alias: string;

    @Column( {"enum": DataItemType } )
    type: string;

    @Column({ type: "jsonb"})
    data: object;

    @CreateDateColumn({ type: "timestamp", name: "created_at", default: () => "CURRENT_TIMESTAMP(3)" })
    public createdAt: Date;

    @UpdateDateColumn({ type: "timestamp", name: "updated_at", default: () => "CURRENT_TIMESTAMP(3)" })
    public updatedAt: Date;

    @DeleteDateColumn({ type: "timestamp", name: "deleted_at" })
    public deletedAt?: Date;

    @Column({ type: "int", name: "created_by" } )
    public createdBy: number;

    @Column({ type: "int", name: "updated_at" } )
    public updatedBy: number;

    @Column({ type: "int", name: "deleted_by",} )
    public deletedBy?: number;
}

@Entity({name: "revisions"})
export class Revision {
    @PrimaryColumn({ type: "bigint"})
    id: number;

    @Column({ type: "int"})
    account_id: number;

    @Column( {"enum": DataItemType } )
    type: string;

    @Column({ type: "jsonb"})
    data: object;

    @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(3)" })
    public created_at: Date;

    @Column({ type: "int" } )
    public created_by: number;
}