import { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import bcrypt from "bcrypt";

import userModel from "./userModel";
import { sign } from "jsonwebtoken";
import { config } from "../config/config";
import { User } from "./userTypes";

const createUser = async (req: Request, res: Response, next: NextFunction) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    const err = createHttpError(400, "all fields are required");
    return next(err);
  }

  try {
    const user = await userModel.findOne({ email });

    if (user) {
      const err = createHttpError(400, "user already registered");
      return next(err);
    }
  } catch (err) {
    return next(createHttpError(500, "error while registering user"));
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  let newUser: User;

  try {
    newUser = await userModel.create({
      name,
      email,
      password: hashedPassword,
    });
  } catch (err) {
    return next(createHttpError(500, "error while registering the user"));
  }

  try {
    const token = sign({ sub: newUser._id }, config.jwtSecret as string, {
      expiresIn: "7d",
    });

    res.status(201).json({ accessToken: token });
  } catch (err) {
    return next(createHttpError(500, "error while signing jwt token"));
  }
};

const loginUser = async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;

  if (!email || !password) {
    const err = createHttpError(400, "all fields are required");
    return next(err);
  }

  let user: User | null;

  try {
    user = await userModel.findOne({ email });
  } catch (err) {
    return next(createHttpError(500, "error while login user"));
  }

  if (!user) {
    const err = createHttpError(404, "user not found");
    return next(err);
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    return next(createHttpError(400, "username or password incorrect"));
  }

  try {
    const token = sign({ sub: user._id }, config.jwtSecret as string, {
      expiresIn: "7d",
    });

    res.json({ accessToken: token });
  } catch (err) {
    return next(createHttpError(500, "error while signing jwt token"));
  }
};

export { createUser, loginUser };
