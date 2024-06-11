import { NextFunction, Request, Response } from "express";
import path from "node:path";
import fs from "node:fs";

import cloudinary from "../config/cloudinary";
import createHttpError from "http-errors";
import bookModel from "./bookModel";
import { AuthRequest } from "../middlewares/authenticate";
import { Book } from "./bookTypes";

const createBook = async (req: Request, res: Response, next: NextFunction) => {
  const { title, genre } = req.body;
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };

  try {
    const coverImageMimeType = files.coverImage[0].mimetype.split("/").at(-1);
    const coverImageName = files.coverImage[0].filename;
    const coverImagePath = path.resolve(
      __dirname,
      "../../public/data/uploads",
      coverImageName
    );

    const bookFileMimeType = files.file[0].mimetype.split("/").at(-1);
    const bookFileName = files.file[0].filename;
    const bookFilePath = path.resolve(
      __dirname,
      "../../public/data/uploads",
      bookFileName
    );

    const coverImageUpload = await cloudinary.uploader.upload(coverImagePath, {
      filename_override: coverImageName,
      folder: "book-covers",
      format: coverImageMimeType,
    });

    const bookFileUpload = await cloudinary.uploader.upload(bookFilePath, {
      filename_override: bookFileName,
      folder: "book-pdfs",
      format: bookFileMimeType,
      resource_type: "raw",
    });

    const _req = req as AuthRequest;

    try {
      const newBook = await bookModel.create({
        title,
        genre,
        author: _req.userId,
        coverImage: coverImageUpload.secure_url,
        file: bookFileUpload.secure_url,
      });

      await fs.promises.unlink(coverImagePath);
      await fs.promises.unlink(bookFilePath);

      res.status(201).json({ id: newBook._id });
    } catch (err) {
      return next(createHttpError(500, "error while publishing book"));
    }
  } catch (err) {
    console.log(err);
    return next(createHttpError(500, "error while uploading files"));
  }
};

const updateBook = async (req: Request, res: Response, next: NextFunction) => {
  const { title, genre } = req.body;
  const bookId = req.params.bookId;
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };

  let book: Book | null;
  try {
    book = await bookModel.findOne({ _id: bookId });

    if (!book) {
      return next(createHttpError(404, "book not found"));
    }

    const _req = req as AuthRequest;
    if (book.author.toString() !== _req.userId) {
      return next(createHttpError(403, "you cannot update others books"));
    }
  } catch (error) {
    return next(createHttpError(500, "server error"));
  }

  try {
    let coverImageUrl = "";
    let bookFileUrl = "";
    if (files?.coverImage) {
      const coverImageMimeType = files.coverImage[0].mimetype.split("/").at(-1);
      const coverImageName = files.coverImage[0].filename;
      const coverImagePath = path.resolve(
        __dirname,
        "../../public/data/uploads",
        coverImageName
      );

      const coverImageUpload = await cloudinary.uploader.upload(
        coverImagePath,
        {
          filename_override: coverImageName,
          folder: "book-covers",
          format: coverImageMimeType,
        }
      );

      coverImageUrl = coverImageUpload.secure_url;
      await fs.promises.unlink(coverImagePath);
    }

    if (files?.file) {
      const bookFileMimeType = files.file[0].mimetype.split("/").at(-1);
      const bookFileName = files.file[0].filename;
      const bookFilePath = path.resolve(
        __dirname,
        "../../public/data/uploads",
        bookFileName
      );

      const bookFileUpload = await cloudinary.uploader.upload(bookFilePath, {
        filename_override: bookFileName,
        folder: "book-pdfs",
        format: bookFileMimeType,
        resource_type: "raw",
      });

      bookFileUrl = bookFileUpload.secure_url;
      await fs.promises.unlink(bookFilePath);
    }

    try {
      const updatedBook = await bookModel.findOneAndUpdate(
        {
          _id: bookId,
        },
        {
          title,
          genre,
          coverImage: coverImageUrl ? coverImageUrl : undefined,
          file: bookFileUrl ? bookFileUrl : undefined,
        },
        {
          new: true,
        }
      );

      res.json(updatedBook);
    } catch (err) {
      return next(createHttpError(500, "error while updating book"));
    }
  } catch (err) {
    console.log(err);
    return next(createHttpError(500, "error while uploading files"));
  }
};

const listBooks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const books = await bookModel.find();

    return res.json(books);
  } catch (err) {
    return next(createHttpError(500, "error while fetching books"));
  }
};

const getBook = async (req: Request, res: Response, next: NextFunction) => {
  const bookId = req.params.bookId;
  try {
    const book = await bookModel.findById(bookId);

    if (!book) {
      return next(createHttpError(404, "book not found"));
    }

    return res.json(book);
  } catch (err) {
    return next(createHttpError(500, "error while fetching the book"));
  }
};

const deleteBook = async (req: Request, res: Response, next: NextFunction) => {
  const bookId = req.params.bookId;
  let book: Book | null;
  try {
    book = await bookModel.findById(bookId);

    if (!book) {
      return next(createHttpError(404, "book not found"));
    }

    const _req = req as AuthRequest;
    if (book.author.toString() !== _req.userId) {
      return next(createHttpError(403, "you cannot delete others book"));
    }
  } catch (err) {
    return next(createHttpError(500, "error while fetching the book"));
  }

  try {
    const coverImageSplits = book.coverImage.split("/");
    const coverImageId =
      coverImageSplits.at(-2) +
      "/" +
      coverImageSplits.at(-1)?.split(".").at(-2);

    const bookFileSplits = book.file.split("/");
    const bookFileId = bookFileSplits.at(-2) + "/" + bookFileSplits.at(-1);

    await cloudinary.uploader.destroy(coverImageId);
    await cloudinary.uploader.destroy(bookFileId, {
      resource_type: "raw",
    });
  } catch (err) {
    return next(createHttpError("error while deleting the files"));
  }

  try {
    await bookModel.deleteOne({
      _id: bookId,
    });

    return res.sendStatus(204);
  } catch (error) {
    return next(createHttpError("error while deleting the book"));
  }
};

export { createBook, updateBook, listBooks, getBook, deleteBook };
