import { MikroORM } from "@mikro-orm/core";
import { MySqlDriver } from "@mikro-orm/mysql";
import { SqlHighlighter } from "@mikro-orm/sql-highlighter";
import { ReflectMetadataProvider } from "@mikro-orm/decorators/legacy";
import { config } from "../config.js";

export const orm = await MikroORM.init({
  driver: MySqlDriver,
  entities: ["./dist/**/*.entity.js"],
  entitiesTs: ["./src/**/*.entity.ts"],
  clientUrl: config.dbUrl,
  highlighter: new SqlHighlighter(),
  debug: !config.isProduction,
  metadataProvider: ReflectMetadataProvider,
  schemaGenerator: {
    disableForeignKeys: true,
    createForeignKeyConstraints: true,
    ignoreSchema: [],
  },
});

export const syncSchema = async () => {
  await orm.schema.update();
};
