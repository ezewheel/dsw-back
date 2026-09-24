import "reflect-metadata";
import express from "express";
import cors from "cors";
import { orm, syncSchema } from "./shared/db/orm.js";
import { config } from "./shared/config.js";
import { RequestContext } from "@mikro-orm/core";
import authRouter from "./auth/auth.router.js";
import musicalEntityRouter from "./musical-entity/musical-entity.routes.js";
import interactionRouter from "./interaction/interaction.router.js";

const app = express();

app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

app.use((req, res, next) => {
  RequestContext.create(orm.em, next);
});

app.use("/auth", authRouter);
app.use("/musical-entity", musicalEntityRouter);
app.use("/interaction", interactionRouter);

await syncSchema();

export default app;
