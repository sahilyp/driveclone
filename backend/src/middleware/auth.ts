import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

// Extend Express Request type so we can attach `user`
declare module "express-serve-static-core" {
  interface Request {
    user?: {
      id: string;
      [key: string]: any;
    };
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Invalid token format" });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.SUPABASE_JWT_SECRET || "default_secret"
    ) as JwtPayload;

    // Supabase always puts user.id in "sub"
    req.user = {
      id: decoded.sub as string,
      ...decoded,
    };

    next();
  } catch (err: unknown) {
    if (err instanceof Error) {
      return res.status(401).json({ error: "Auth failed: " + err.message });
    }
    return res.status(401).json({ error: "Unauthorized" });
  }
}
