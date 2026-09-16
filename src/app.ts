import "reflect-metadata";
import express from "express";
import { orm, syncSchema } from "./shared/db/orm.js";
import { RequestContext } from "@mikro-orm/core";
import authRouter from "./auth/auth.router.js";
import musicalEntityRouter from "./musical-entity/musical-entity.routes.js";

const app = express();

app.use(express.json());

app.use((req, res, next) => {
  RequestContext.create(orm.em, next);
});

app.use("/auth", authRouter);
app.use("/musical-entity", musicalEntityRouter);

await syncSchema();

export default app;
