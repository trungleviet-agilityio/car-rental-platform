import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'cars' })
export class Car {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  make!: string;

  @Column()
  model!: string;

  @Column({ type: 'int' })
  seats!: number;

  @Column({ type: 'int' })
  pricePerDayCents!: number;

  @Column({ type: 'int', default: 0 })
  depositCents!: number;

  @Column({ nullable: true })
  ownerEmail?: string;

  @Column({ nullable: true })
  ownerPhone?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
