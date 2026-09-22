import type { EntityDisplay } from "../../integrations/deezer/entity-display.js";

export type LatestReview = {
  id: number;
  user: {
    id: number;
    nickname: string;
  };
  value: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  entity: EntityDisplay;
};