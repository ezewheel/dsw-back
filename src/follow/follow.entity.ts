import {
  Entity,
  ManyToOne,
  PrimaryKey,
  Property,
} from "@mikro-orm/decorators/legacy";
import { User } from "../user/user.entity.js";

@Entity()
export class Follow {
  @PrimaryKey()
  id?: number;

  @ManyToOne()
  follower!: User;

  @ManyToOne()
  followed!: User;

  @Property({ nullable: false })
  followedAt: Date = new Date();
}
