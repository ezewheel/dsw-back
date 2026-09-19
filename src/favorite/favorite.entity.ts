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
export class Favorite {
  @PrimaryKey()
  id?: number;

  @ManyToOne()
  user!: User;

  @ManyToOne()
  musicalEntity!: MusicalEntity;

  @Property({ nullable: false })
  favoritedAt: Date = new Date();
}