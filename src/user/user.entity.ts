import { Entity, PrimaryKey, Property } from "@mikro-orm/decorators/legacy";

@Entity()
export class User {
  @PrimaryKey()
  id?: number;

  @Property({ nullable: false, unique: true })
  email!: string;

  @Property()
  password!: string;

  @Property()
  nickname!: string;

  @Property()
  followers: number = 0;

  @Property()
  following: number = 0;

  @Property()
  createdAt: Date = new Date();
}
