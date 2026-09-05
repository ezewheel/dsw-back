import { MikroORM } from "@mikro-orm/core";
import { MySqlDriver } from "@mikro-orm/mysql";
import { SqlHighlighter } from "@mikro-orm/sql-highlighter";

export const orm = await MikroORM.init({
  driver: MySqlDriver,
  entities: ["./dist/shared/db/entities"],
  entitiesTs: ["./src/shared/db/entities"],
  dbName: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  clientUrl: process.env.DB_URL,
  highlighter: new SqlHighlighter(),
  debug: process.env.NODE_ENV !== "production",
  schemaGenerator: {
    disableForeignKeys: true,
    createForeignKeyConstraints: true,
    ignoreSchema: [],
  },
});

export const syncSchema = async () => {
  await orm.schema.update();
};
