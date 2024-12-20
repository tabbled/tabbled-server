import {
    Entity,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    PrimaryGeneratedColumn,
    ManyToOne,
    JoinColumn
} from "typeorm";
import {FieldType, EnumValue} from "../dto/datasourceV2.dto";
import { DatasourceV2Entity } from "./datasourceV2.entity";

@Entity({ name: 'datasource_fields' })
export class DatasourceField {
    @PrimaryGeneratedColumn({ type: 'int' })
    id: string

    @Column({ type: 'int', name: 'account_id' })
    accountId?: number

    @Column({ type: 'int', name: 'version' })
    version?: number

    @Column({ type: 'varchar', name: 'alias' })
    alias: string

    @Column({ type: 'varchar', name: 'datasource_alias' })
    datasourceAlias?: string

    @Column({ type: 'bigint', name: 'datasource_id', select:false })
    datasourceId?: string

    @Column({ type: 'varchar', name: 'type' })
    type: FieldType

    @Column({ type: 'varchar', name: 'title' })
    title: string

    @Column({ type: 'boolean', name: 'searchable' })
    searchable?: boolean

    @Column({ type: 'boolean', name: 'filterable' })
    filterable?: boolean

    @Column({ type: 'boolean', name: 'sortable' })
    sortable?: boolean

    @Column({ type: 'boolean', name: 'is_multiple' })
    isMultiple?: boolean

    @Column({ type: 'varchar', name: 'default_value' })
    defaultValue?: string

    @Column({ type: 'varchar', name: 'datasource_ref' })
    datasourceReference?: string

    @Column({ type: 'boolean', name: 'autoincrement' })
    autoincrement?: boolean

    @Column({ type: 'boolean', name: 'nullable' })
    isNullable?: boolean

    @Column({ type: 'int', name: 'precision' })
    precision?: number

    @Column({ type: 'varchar', name: 'format' })
    format?: string

    @Column({ type: 'jsonb', name: 'enum_values' })
    enumValues?: EnumValue[]

    @CreateDateColumn({
        type: 'timestamp',
        name: 'created_at',
        default: () => 'CURRENT_TIMESTAMP(3)',
    })
    public createdAt?: Date

    @UpdateDateColumn({
        type: 'timestamp',
        name: 'updated_at',
        default: () => 'CURRENT_TIMESTAMP(3)',
    })
    public updatedAt?: Date

    @Column({ type: 'timestamp', name: 'deleted_at' })
    public deletedAt?: Date

    @Column({ type: 'int', name: 'created_by' })
    public createdBy?: number

    @Column({ type: 'int', name: 'updated_by' })
    public updatedBy?: number

    @Column({ type: 'int', name: 'deleted_by' })
    public deletedBy?: number

    public isSystem?: boolean

    public isLinked?:boolean


    @ManyToOne(() => DatasourceV2Entity, (ds) => ds.alias)
    @JoinColumn({ name: 'datasource_ref', referencedColumnName: 'alias' })
    linkedDatasource?: DatasourceV2Entity
}