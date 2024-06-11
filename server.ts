import app from "./src/app";

const startServer = () => {
  try {
    const PORT = process.env.PORT || 3000;

    app.listen(PORT, () => {
      console.log(`Server listening on PORT=${PORT}`);
    });
  } catch (err) {
    console.log(err);
  }
};

startServer();
