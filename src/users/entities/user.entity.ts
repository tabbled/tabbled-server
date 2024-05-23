import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    PrimaryColumn,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToMany,
    JoinTable,
} from 'typeorm'
import { Account } from '../../accounts/entities/account.entity'

@Entity({ name: 'users' })
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    firstname: string

    @Column()
    lastname: string

    @Column()
    username: string

    @Column()
    password: string

    @Column('jsonb')
    settings: object

    @ManyToMany(() => Account, (account) => account.users)
    @JoinTable({
        name: 'account_users', // table name for the junction table of this relation
        joinColumn: {
            name: 'user_id',
            referencedColumnName: 'id',
        },
        inverseJoinColumn: {
            name: 'account_id',
            referencedColumnName: 'id',
        },
    })
    accounts: Account[]

    @CreateDateColumn({
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP(3)',
    })
    public created_at: Date

    @UpdateDateColumn({
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP(3)',
    })
    public updated_at: Date
}

@Entity({ name: 'account_users' })
export class AccountUsers {
    @PrimaryColumn()
    user_id: number

    @PrimaryColumn()
    account_id: number

    @Column('jsonb')
    permissions: object

    @Column()
    active: boolean
}
