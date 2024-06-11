import app from "./src/app";
import { config } from "./src/config/config";
import connectDB from "./src/config/db";

const startServer = async () => {
  try {
    await connectDB();
    const PORT = config.port || 3000;

    app.listen(PORT, () => {
      console.log(`Server listening on PORT=${PORT}`);
    });
  } catch (err) {
    console.log("some error occured", err);
    process.exit(1);
  }
};

void startServer();
