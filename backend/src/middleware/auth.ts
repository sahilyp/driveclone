import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

// Extend Express Request type globally
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        [key: string]: any;
      };
    }
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
    ) as JwtPayload & { sub?: string };

    req.user = {
      id: decoded.sub ?? "", // Supabase puts user.id in "sub"
      ...decoded,
    };

    return next();
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Token verification failed";
    return res.status(401).json({ error: "Auth failed: " + message });
  }
}
