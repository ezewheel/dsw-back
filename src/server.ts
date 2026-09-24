import app from "./app.js";
import { config } from "./shared/config.js";

app.listen(config.port, () => {
  console.log(`Servidor ejecutándose en http://localhost:${config.port}`);
});
