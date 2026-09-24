import app from "./app.js";
import { config } from "./shared/config.js";
import { orm } from "./shared/db/orm.js";

await orm.schema.update();

app.listen(config.port, () => {
  console.log(`Servidor ejecutándose en http://localhost:${config.port}`);
});
