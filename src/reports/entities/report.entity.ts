import {
    Entity,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    PrimaryGeneratedColumn,
} from 'typeorm'
import { ReportV2Dto } from "../dto/report.dto";

@Entity({ name: 'reports' })
export class ReportEntity implements ReportV2Dto {
    @PrimaryGeneratedColumn({ type: 'int' })
    id: string

    @Column({ type: 'int', name: 'version' })
    version: number

    @Column({ type: 'int', name: 'account_id', select: false })
    accountId: number

    @Column({ type: 'varchar', name: 'title' })
    title: string

    @Column({ type: 'varchar', name: 'description' })
    description: string

    @Column({ type: 'jsonb', name: 'permissions' })
    permissions: any

    @Column({ type: 'text', name: 'html' })
    html?: string

    @Column({ type: 'jsonb', name: 'datasets' })
    datasets: any

    @Column({ type: 'jsonb', name: 'parameters' })
    parameters: any

    @Column({ type: 'jsonb', name: 'pages' })
    pages: string[]

    @Column({ type: 'jsonb', name: 'page_settings' })
    pageSettings: any

    @Column({ type: 'varchar', name: 'template_type' })
    templateType: 'html' | 'excel'

    @Column({ type: 'varchar', name: 'postprocessing' })
    postprocessing: string

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