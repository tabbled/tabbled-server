import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from "typeorm";


@Entity({ name: 'variables' })
export class Variable {
    @PrimaryColumn({ type: 'varchar' })
    name: string

    @Column({ type: 'text' })
    value: string

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

    @Column({ type: 'int', name: 'account_id' })
    accountId: number
}