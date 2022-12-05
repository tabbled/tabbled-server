import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn
} from 'typeorm';

@Entity({name: "users"})
export class User {
    @PrimaryGeneratedColumn()
    id: number;
    
    @Column()
    firstname: string;
    
    @Column()
    lastname: string;
    
    @Column()
    username: string;
    
    @Column()
    password: string;
    
    @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(3)" })
    public created_at: Date;
    
    @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(3)", onUpdate: "CURRENT_TIMESTAMP(3)" })
    public updated_at: Date;
}