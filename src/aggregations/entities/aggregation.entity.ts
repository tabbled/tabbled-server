import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
} from 'typeorm'

@Entity({ name: 'aggregation_movement' })
export class AggregationMovement {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: string

    @Column({ type: 'bigint', name: 'issuer_id', nullable: true })
    issuerId: string

    @Column({ type: 'varchar', name: 'target_datasource' })
    targetDatasource: string

    @Column({ type: 'varchar', name: 'source_datasource' })
    sourceDatasource: string

    @Column({ type: 'jsonb', name: 'target_keys' })
    targetKeys: object

    @Column({ type: 'jsonb', name: 'source_keys' })
    sourceKeys: object

    @Column({ type: 'jsonb', name: 'target_values' })
    targetValues: object

    @Column({ type: 'jsonb', name: 'source_values' })
    sourceValues: object

    @CreateDateColumn({
        type: 'timestamp',
        name: 'created_at',
        default: () => 'CURRENT_TIMESTAMP(3)',
    })
    public createdAt: Date
}

@Entity({ name: 'aggregation_history' })
export class AggregationHistory {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: string

    @Column({ type: 'bigint', name: 'issuer_id', nullable: true })
    issuerId: string

    @Column({ type: 'varchar', name: 'datasource' })
    datasource: string

    @Column({ type: 'jsonb', name: 'keys' })
    keys: object

    @Column({ type: 'jsonb', name: 'values' })
    values: object

    @CreateDateColumn({
        type: 'timestamp',
        name: 'created_at',
        default: () => 'CURRENT_TIMESTAMP(3)',
    })
    public createdAt: Date
}
