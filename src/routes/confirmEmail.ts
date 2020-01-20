import { Request, Response } from "express";
import { User } from "../entity/User";
import { redis } from "../redis";

export const confirmEmail = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = id;
  const userAlreadyExists = await User.findOne({
    where: { id:userId },
    select: ["email"]
  });
  console.log(userAlreadyExists);
  if (userId) {
    await User.update({ id: userId }, { confirmed: true });
    await redis.del(id);
    res.send("ok");
  } else {
    res.send("invalid");
  }
};
