import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToMany,
    CreateDateColumn,
    UpdateDateColumn,
    JoinTable
} from "typeorm";
import { User } from "../../users/entities/user.entity"

@Entity({name: "accounts"})
export class Account {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @ManyToMany(() => User, (user) => user.accounts)
    @JoinTable({
        name: "account_users", // table name for the junction table of this relation
        joinColumn: {
            name: "account_id",
            referencedColumnName: "id"
        },
        inverseJoinColumn: {
            name: "user_id",
            referencedColumnName: "id"
        }
    })
    users: User[]

    @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(3)" })
    public created_at: Date;

    @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(3)", onUpdate: "CURRENT_TIMESTAMP(3)" })
    public updated_at: Date;
}