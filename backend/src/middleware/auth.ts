import jwt from "jsonwebtoken";

export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET!);

    // Supabase always puts user.id in "sub"
    (req as any).user = {
      id: decoded.sub,
      ...decoded, // keep other claims too
    };

    next();
  } catch (err) {
    return res.status(401).json({ error: "Auth failed: " + err.message });
  }
}
