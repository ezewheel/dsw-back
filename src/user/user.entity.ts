import {
  Entity,
  ManyToOne,
  PrimaryKey,
  Property,
} from "@mikro-orm/decorators/legacy";

export type UserRole = "user" | "moderator";

@Entity()
export class User {
  @PrimaryKey()
  id!: number;

  @Property({ nullable: false, unique: true })
  email!: string;

  @Property()
  password!: string;

  @Property({ nullable: false, unique: true })
  nickname!: string;

  @Property()
  followers: number = 0;

  @Property()
  following: number = 0;

  @Property({ nullable: false, type: "integer" })
  interactionsCount: number = 0;

  @Property()
  createdAt: Date = new Date();

  @Property({ nullable: false, default: "user" })
  role: UserRole = "user";

  @Property({ nullable: true, type: "datetime" })
  bannedAt: Date | null = null;

  @ManyToOne(() => User, { nullable: true })
  bannedBy: User | null = null;
}
