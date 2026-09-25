import { OptionalProps } from "@mikro-orm/core";
import { Entity, PrimaryKey, Property, Unique } from "@mikro-orm/decorators/legacy";

export const MUSICAL_ENTITY_TYPES = ["track", "album", "artist"] as const;

export type MusicalEntityType = (typeof MUSICAL_ENTITY_TYPES)[number];

@Entity()
@Unique({ properties: ["type", "deezerId"] })
export class MusicalEntity {
  [OptionalProps]?: "reviewsCount" | "ratingsCount" | "averageRating";

  @PrimaryKey()
  id!: number;

  @Property({ nullable: false, type: "bigint" })
  deezerId!: number;

  @Property({ nullable: false })
  type!: MusicalEntityType;

  @Property({ nullable: false, type: "integer" })
  reviewsCount: number = 0;

  @Property({ nullable: false, type: "integer" })
  ratingsCount: number = 0;

  @Property({ nullable: false, type: "decimal", precision: 3, scale: 2 })
  averageRating: number = 0;
}
