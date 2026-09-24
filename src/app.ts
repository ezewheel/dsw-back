import "reflect-metadata";
import express from "express";
import cors from "cors";
import { orm } from "./shared/db/orm.js";
import { config } from "./shared/config.js";
import { errorHandler } from "./shared/errors.js";
import { RequestContext } from "@mikro-orm/core";
import authRouter from "./auth/auth.routes.js";
import musicalEntityRouter from "./musical-entity/musical-entity.routes.js";
import interactionRouter from "./interaction/interaction.routes.js";

const app = express();

app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

app.use((req, res, next) => {
  RequestContext.create(orm.em, next);
});

app.use("/auth", authRouter);
app.use("/musical-entity", musicalEntityRouter);
app.use("/interaction", interactionRouter);

app.use(errorHandler);

export default app;
