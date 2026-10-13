import { OptionalProps } from "@mikro-orm/core";
import {
  Entity,
  PrimaryKey,
  Property,
  ManyToOne,
  Filter,
} from "@mikro-orm/decorators/legacy";
import { User } from "../user/user.entity.js";
import { MusicalEntity } from "../musical-entity/musical-entity.entity.js";

@Entity()
@Filter({ name: "notDeleted", cond: { deletedAt: null }, default: true })
export class Interaction {
  [OptionalProps]?: "publishedAt" | "deletedAt" | "deletedBy";

  @PrimaryKey()
  id!: number;

  @ManyToOne()
  user!: User;

  @ManyToOne()
  musicalEntity!: MusicalEntity;

  @Property({ nullable: false, type: "decimal", precision: 3, scale: 2 })
  value!: number;

  @Property({ nullable: true, type: "text" })
  content?: string | null;

  @Property({ nullable: false })
  publishedAt: Date = new Date();

  @Property({ nullable: true, type: "datetime" })
  deletedAt: Date | null = null;

  @ManyToOne(() => User, { nullable: true })
  deletedBy: User | null = null;
}