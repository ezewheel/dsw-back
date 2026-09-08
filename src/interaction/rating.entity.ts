import { Entity, Property } from "@mikro-orm/decorators/legacy";
import { Interaction } from "./interaction.entity.js";

@Entity()
export class Rating extends Interaction {
  @Property()
  value!: string;
}
