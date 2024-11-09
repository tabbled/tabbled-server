import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn, OneToMany } from "typeorm";
import { Access, AccessType, DataSourceType, DataSourceV2Dto } from "../dto/datasourceV2.dto";
import { DatasourceField } from "./field.entity";

@Entity({ name: 'datasource' })
export class DatasourceV2Entity implements DataSourceV2Dto{
    @PrimaryColumn({ type: 'bigint' })
    id: string

    @Column({ type: 'bigint', name: 'version' })
    version: number

    @Column({ type: 'int', name: 'account_id', select: false })
    accountId: number

    @Column({ type: 'int', name: 'alias' })
    alias: string

    @Column({ type: 'int', name: 'title' })
    title: string

    @Column({ type: 'boolean', name: 'is_tree' })
    isTree: any

    @Column({ type: 'boolean', name: 'is_system' })
    isSystem: any

    @Column({ type: 'varchar' })
    type: DataSourceType

    @Column({ type: 'jsonb' })
    permissions: {
        [key in Access]: {
            type: AccessType
            roles?: string[]
        }
    }

    @Column({ type: 'text' })
    script?: string

    @Column({ type: 'text' })
    context?: string

    @OneToMany(() => DatasourceField, (ds) => ds.datasourceAlias)
    fields?: DatasourceField[];

    @CreateDateColumn({
        type: 'timestamp',
        name: 'created_at',
        default: () => 'CURRENT_TIMESTAMP(3)',
    })
    public createdAt: Date

    @UpdateDateColumn({
        type: 'timestamp',
        name: 'updated_at',
        default: () => 'CURRENT_TIMESTAMP(3)',
    })
    public updatedAt: Date

    @Column({ type: 'timestamp', name: 'deleted_at' })
    public deletedAt?: Date

    @Column({ type: 'int', name: 'created_by' })
    public createdBy: number

    @Column({ type: 'int', name: 'updated_by' })
    public updatedBy: number

    @Column({ type: 'int', name: 'deleted_by' })
    public deletedBy?: number
}