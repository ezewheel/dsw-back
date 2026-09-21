import { Entity, PrimaryKey, Property, Unique } from "@mikro-orm/decorators/legacy";

@Entity()
@Unique({ properties: ["type", "deezerId"] })
export class MusicalEntity {
  @PrimaryKey()
  id?: number;

  @Property({ nullable: false, type: "bigint" })
  deezerId!: number;

  @Property({ nullable: false })
  type!: "artist" | "album" | "track";

  @Property({ nullable: false, type: "integer" })
  reviewsCount: number = 0;

  @Property({ nullable: false, type: "integer" })
  ratingsCount: number = 0;

  @Property({ nullable: false, type: "decimal", precision: 3, scale: 2 })
  averageRating: number = 0;
}
