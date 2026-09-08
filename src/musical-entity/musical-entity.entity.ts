import { Entity, PrimaryKey, Property } from "@mikro-orm/decorators/legacy";

@Entity()
export class MusicalEntity {
  @PrimaryKey()
  id?: number;

  @Property({ nullable: false, unique: true })
  externalId!: string;

  @Property({ nullable: false, type: "integer" })
  reviewsCount: number = 0;

  @Property({ nullable: false, type: "integer" })
  ratingsCount: number = 0;

  @Property({ nullable: false, type: "decimal", precision: 3, scale: 2 })
  averageRating: number = 0;
}
