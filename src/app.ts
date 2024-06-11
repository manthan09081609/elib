import express from "express";
import cors from "cors";
import globalErrorHandler from "./middlewares/globalErrorHandler";
import userRouter from "./user/userRouter";
import bookRouter from "./book/bookRouter";
import { config } from "./config/config";

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: config.frontendDomain,
  })
);

app.get("/", (req, res) => {
  res.json({ message: "Ok" });
});

app.use("/api/users", userRouter);
app.use("/api/books", bookRouter);

app.use(globalErrorHandler);

export default app;
