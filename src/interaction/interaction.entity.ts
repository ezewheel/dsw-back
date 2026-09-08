import {
  Entity,
  PrimaryKey,
  Property,
  ManyToOne,
  Unique,
  Enum,
} from "@mikro-orm/decorators/legacy";
import { User } from "../user/user.entity.js";
import { MusicalEntity } from "../musical-entity/musical-entity.entity.js";

@Entity({
  discriminator: "type",
  discriminatorMap: {
    review: "Review",
    rating: "Rating",
  },
})
@Unique({
  properties: ["user", "musicalEntity", "type"],
})
export abstract class Interaction {
  @PrimaryKey()
  id!: number;

  @ManyToOne()
  user!: User;

  @ManyToOne()
  musicalEntity!: MusicalEntity;

  @Enum({
    items: () => ["review", "rating"],
  })
  type!: "review" | "rating";

  @Property({ nullable: false })
  createdAt: Date = new Date();

  @Property({ nullable: false })
  updatedAt: Date = new Date();

  @Property({ nullable: true })
  deletedAt?: Date;
}
