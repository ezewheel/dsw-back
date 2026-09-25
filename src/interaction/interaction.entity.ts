import { OptionalProps } from "@mikro-orm/core";
import {
  Entity,
  PrimaryKey,
  Property,
  ManyToOne,
  Unique,
} from "@mikro-orm/decorators/legacy";
import { User } from "../user/user.entity.js";
import { MusicalEntity } from "../musical-entity/musical-entity.entity.js";

@Entity()
@Unique({
  properties: ["user", "musicalEntity"],
})
export class Interaction {
  [OptionalProps]?: "createdAt" | "updatedAt";

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
  createdAt: Date = new Date();

  @Property({ nullable: false, onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}