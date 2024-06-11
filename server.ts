import app from "./src/app";
import { config } from "./src/config/config";

const startServer = () => {
  try {
    const PORT = config.port || 3000;

    app.listen(PORT, () => {
      console.log(`Server listening on PORT=${PORT}`);
    });
  } catch (err) {
    console.log(err);
  }
};

startServer();
