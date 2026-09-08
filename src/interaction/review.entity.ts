import { Entity, PrimaryKey, Property } from "@mikro-orm/decorators/legacy";
import { Interaction } from "./interaction.entity.js";

@Entity()
export class Review extends Interaction {
  @Property()
  content!: string;
}
