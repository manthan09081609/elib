import express from "express";
import multer from "multer";
import path from "node:path";

import {
  createBook,
  deleteBook,
  getBook,
  listBooks,
  updateBook,
} from "./bookController";
import authenticate from "../middlewares/authenticate";

const bookRouter = express.Router();

const upload = multer({
  dest: path.resolve(__dirname, "../../public/data/uploads"),
  limits: {
    fileSize: 1e7, //10mb
  },
});

bookRouter.post(
  "/",
  authenticate,
  upload.fields([
    { name: "coverImage", maxCount: 1 },
    { name: "file", maxCount: 1 },
  ]),
  createBook
);

bookRouter.patch(
  "/:bookId",
  authenticate,
  upload.fields([
    { name: "coverImage", maxCount: 1 },
    { name: "file", maxCount: 1 },
  ]),
  updateBook
);

bookRouter.get("/", listBooks);

bookRouter.get("/:bookId", getBook);

bookRouter.delete("/:bookId", authenticate, deleteBook);

export default bookRouter;
