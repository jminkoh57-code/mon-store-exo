import jwt from "jsonwebtoken";

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  throw new Error("JWT_SECRET manquant.");
}

function signToken(user) {
  return jwt.sign({ userId: user.id, email: user.email }, jwtSecret, {
    expiresIn: "7d",
  });
}

function createContext({ req }) {
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return { auth: null, invalidToken: false };
  }

  try {
    return { auth: jwt.verify(token, jwtSecret), invalidToken: false };
  } catch {
    return { auth: null, invalidToken: true };
  }
}

export { createContext, signToken };
