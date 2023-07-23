import {
    Entity,
    Column,
    PrimaryColumn, CreateDateColumn, UpdateDateColumn, PrimaryGeneratedColumn
} from "typeorm";

@Entity({name: "config"})
export class ConfigItem {
    @PrimaryColumn({ type: "bigint"})
    id: string;

    @Column({ type: "bigint", name: 'rev'})
    rev: string;

    @Column({ type: "bigint", name: 'version'})
    version: number;

    @Column({ type: "int", name: "alias"})
    alias: string;

    @Column({ type: "jsonb"})
    data: any;

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

@Entity({name: "config_revisions"})
export class ConfigRevision {
    @PrimaryGeneratedColumn({ type: "bigint"})
    id: BigInteger;

    @Column({ type: "int", name: "version"})
    version: number

    @Column({ type: "int", name: "item_id"})
    itemId: BigInteger

    @Column( {type: "int"} )
    alias: string;

    @Column({ type: "jsonb"})
    data: object;

    @CreateDateColumn({ type: "timestamp", name: "created_at", default: () => "CURRENT_TIMESTAMP(3)" })
    public createdAt: Date;

    @Column({ type: "int", name: "created_by" } )
    public createdBy: number;
}