import bcrypt from "bcryptjs";
import express from "express";
import jwt from "jsonwebtoken";
import morgan from "morgan";
import { initDb, pool } from "./db.js";

const app = express();
const port = Number(process.env.PORT ?? 3000);
const jwtSecret = process.env.JWT_SECRET ?? "dev-secret";

app.use(express.json());
app.use(morgan((tokens, req, res) => {
  return `[API] ${tokens.method(req, res)} ${tokens.url(req, res)} ${tokens.status(req, res)} ${tokens["response-time"](req, res)} ms`;
}));

function signToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email },
    jwtSecret,
    { expiresIn: "7d" }
  );
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
}

function publicTodo(todo) {
  return {
    id: todo.id,
    text: todo.text,
    done: Boolean(todo.done),
    createdAt: todo.created_at,
  };
}

async function findTodo(id, userId) {
  const [rows] = await pool.execute(
    "SELECT id, text, done, created_at FROM todos WHERE id = ? AND user_id = ?",
    [id, userId]
  );

  return rows[0] ?? null;
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    res.status(401).json({ message: "Connexion requise." });
    return;
  }

  try {
    req.auth = jwt.verify(token, jwtSecret);
    next();
  } catch {
    res.status(401).json({ message: "Session expirée." });
  }
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/auth/register", async (req, res) => {
  const name = String(req.body?.name ?? "").trim();
  const email = String(req.body?.email ?? "").trim().toLowerCase();
  const password = String(req.body?.password ?? "");

  if (!name || !email || !password) {
    res.status(400).json({ message: "Nom, email et mot de passe sont requis." });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  try {
    const [result] = await pool.execute(
      "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
      [name, email, passwordHash]
    );
    const user = { id: result.insertId, name, email };

    res.status(201).json({
      token: signToken(user),
      user: publicUser(user),
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      res.status(409).json({ message: "Un compte existe déjà avec cet email." });
      return;
    }

    res.status(500).json({ message: "Impossible de créer le compte." });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const email = String(req.body?.email ?? "").trim().toLowerCase();
  const password = String(req.body?.password ?? "");

  const [rows] = await pool.execute(
    "SELECT id, name, email, password_hash FROM users WHERE email = ?",
    [email]
  );
  const user = rows[0];

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    res.status(401).json({ message: "Email ou mot de passe incorrect." });
    return;
  }

  res.json({
    token: signToken(user),
    user: publicUser(user),
  });
});

app.get("/api/todos", requireAuth, async (req, res) => {
  const [rows] = await pool.execute(
    "SELECT id, text, done, created_at FROM todos WHERE user_id = ? ORDER BY id ASC",
    [req.auth.userId]
  );

  res.json(rows.map(publicTodo));
});

app.get("/api/todos/:id", requireAuth, async (req, res) => {
  const todo = await findTodo(Number(req.params.id), req.auth.userId);

  if (!todo) {
    res.status(404).json({ message: "Todo introuvable." });
    return;
  }

  res.json(publicTodo(todo));
});

app.post("/api/todos", requireAuth, async (req, res) => {
  const text = String(req.body?.text ?? "").trim();

  if (!text) {
    res.status(400).json({ message: "Le texte du todo est requis." });
    return;
  }

  const [result] = await pool.execute(
    "INSERT INTO todos (user_id, text) VALUES (?, ?)",
    [req.auth.userId, text]
  );

  const [rows] = await pool.execute(
    "SELECT id, text, done, created_at FROM todos WHERE id = ?",
    [result.insertId]
  );

  res.status(201).json(publicTodo(rows[0]));
});

app.patch("/api/todos/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const updates = [];
  const params = [];

  if (req.body?.text !== undefined) {
    const text = String(req.body.text).trim();

    if (!text) {
      res.status(400).json({ message: "Le texte du todo est requis." });
      return;
    }

    updates.push("text = ?");
    params.push(text);
  }

  if (req.body?.done !== undefined) {
    updates.push("done = ?");
    params.push(req.body.done ? 1 : 0);
  }

  if (updates.length === 0) {
    res.status(400).json({ message: "Aucune modification à enregistrer." });
    return;
  }

  params.push(id, req.auth.userId);

  const [result] = await pool.execute(
    `UPDATE todos SET ${updates.join(", ")} WHERE id = ? AND user_id = ?`,
    params
  );

  if (result.affectedRows === 0) {
    res.status(404).json({ message: "Todo introuvable." });
    return;
  }

  const todo = await findTodo(id, req.auth.userId);
  res.json(publicTodo(todo));
});

app.delete("/api/todos/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const [result] = await pool.execute(
    "DELETE FROM todos WHERE id = ? AND user_id = ?",
    [id, req.auth.userId]
  );

  if (result.affectedRows === 0) {
    res.status(404).json({ message: "Todo introuvable." });
    return;
  }

  res.status(204).end();
});

await initDb();

app.listen(port, () => {
  console.log(`API prête sur le port ${port}`);
});
