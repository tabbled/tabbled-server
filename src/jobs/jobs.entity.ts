import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";


@Entity({ name: 'jobs' })
export class Job {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: 'int', name: 'account_id' })
    accountId: number

    @Column({ type: 'varchar' })
    cron: string

    @Column({ type: 'varchar', name: 'function_alias' })
    functionAlias: string

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

// "id serial primary key," +
// "cron varchar(15) not null," +
// "function_alias varchar(100)," +
// "account_id int NOT NULL REFERENCES accounts(id) ON DELETE NO ACTION ON UPDATE CASCADE,"+
// "created_at TIMESTAMP(3) default now()," +
// "created_by int REFERENCES users(id) ON DELETE NO ACTION ON UPDATE CASCADE," +
// "updated_at TIMESTAMP(3) default now()," +
// "updated_by int REFERENCES users(id) ON DELETE NO ACTION ON UPDATE CASCADE," +
// "deleted_at TIMESTAMP(3),"+
// "deleted_by int REFERENCES users(id) ON DELETE NO ACTION ON UPDATE CASCADE" +