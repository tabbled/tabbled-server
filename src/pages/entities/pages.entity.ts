import {
    Entity,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    PrimaryGeneratedColumn,
} from 'typeorm'
import { PageInterface } from "../dto/pages.dto";

@Entity({ name: 'pages' })
export class PageEntity implements PageInterface{
    @PrimaryGeneratedColumn({ type: 'int' })
    id: string

    @Column({ type: 'int', name: 'version' })
    version: number

    @Column({ type: 'int', name: 'account_id', select: false })
    accountId: number

    @Column({ type: 'int', name: 'alias' })
    alias: string

    @Column({ type: 'varchar', name: 'title' })
    title: string

    @Column({ type: 'varchar', name: 'type' })
    type: any

    @Column({ type: 'jsonb', name: 'permissions' })
    permissions: any

    @Column({ type: 'jsonb', name: 'datasets' })
    datasets: any

    @Column({ type: 'jsonb', name: 'elements' })
    elements: any

    @Column({ type: 'jsonb', name: 'header_actions' })
    headerActions: any

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