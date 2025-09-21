import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'audit_logs' })
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ nullable: true })
  userId?: string | null;

  @Column()
  action!: string;

  @Column('text')
  details!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
