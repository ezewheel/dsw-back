import "reflect-metadata";
import express from "express";
import { orm, syncSchema } from "./shared/db/orm.js";
import { RequestContext } from "@mikro-orm/core";

const app = express();

app.use(express.json());

app.use((req, res, next) => {
  RequestContext.create(orm.em, next);
});

await syncSchema();

export default app;
