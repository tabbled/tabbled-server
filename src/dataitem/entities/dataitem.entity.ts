import {
    Entity,
    Column,
    PrimaryColumn, CreateDateColumn, UpdateDateColumn, PrimaryGeneratedColumn
} from "typeorm";

@Entity({name: "data_items"})
export class DataItem {
    @PrimaryColumn({ type: "bigint"})
    id: string;

    @Column({ type: "bigint", name: 'rev'})
    rev: number;

    @Column({ type: "bigint", name: 'version'})
    version: number;

    @Column({ type: "int", name: "account_id", select: false})
    accountId: number;

    @Column({ type: "int", name: "alias"})
    alias: string;

    @Column({ type: "jsonb"})
    data: object;

    @CreateDateColumn({ type: "timestamp", name: "created_at", default: () => "CURRENT_TIMESTAMP(3)" })
    public createdAt: Date;

    @UpdateDateColumn({ type: "timestamp", name: "updated_at", default: () => "CURRENT_TIMESTAMP(3)" })
    public updatedAt: Date;

    @Column({ type: "timestamp", name: "deleted_at" })
    public deletedAt?: Date;

    @Column({ type: "int", name: "created_by" } )
    public createdBy: number;

    @Column({ type: "int", name: "updated_by" } )
    public updatedBy: number;

    @Column({ type: "int", name: "deleted_by" } )
    public deletedBy?: number;
}

@Entity({name: "revisions"})
export class Revision {
    @PrimaryGeneratedColumn({ type: "bigint"})
    id: BigInteger;

    @Column({ type: "int", name: "version"})
    version: number

    @Column({ type: "int", name: "item_id"})
    itemId: BigInteger

    @Column( {type: "int"} )
    alias: string;

    @Column({ type: "int", name: "account_id", select: false})
    accountId: number;

    @Column({ type: "jsonb"})
    data: object;

    @CreateDateColumn({ type: "timestamp", name: "created_at", default: () => "CURRENT_TIMESTAMP(3)" })
    public createdAt: Date;

    @Column({ type: "int", name: "created_by" } )
    public createdBy: number;
}