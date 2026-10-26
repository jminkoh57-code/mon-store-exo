import bcrypt from "bcryptjs";
import express from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import morgan from "morgan";
import multer from "multer";
import { connectDb } from "./db.js";
import { Todo, User } from "./models.js";
import { enqueueImageDelete, enqueueImageUpload } from "./queue.js";
import { imageUrl } from "./storage.js";

const app = express();
const port = Number(process.env.PORT ?? 3000);
const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  throw new Error("JWT_SECRET manquant.");
}

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
    id: todo._id.toString(),
    text: todo.text,
    done: Boolean(todo.done),
    imageUrl: imageUrl(todo.imageKey),
    createdAt: todo.createdAt,
  };
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
});

function withImage(req, res, next) {
  const type = req.headers["content-type"] ?? "";

  if (!type.includes("multipart/form-data")) {
    next();
    return;
  }

  upload.single("image")(req, res, (error) => {
    if (!error) {
      next();
      return;
    }

    if (error.code === "LIMIT_FILE_SIZE") {
      res.status(400).json({ message: "L'image dépasse 2 Mo." });
      return;
    }

    res.status(400).json({ message: "Image invalide." });
  });
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

async function findTodo(id, userId) {
  if (!mongoose.isValidObjectId(id) || !mongoose.isValidObjectId(userId)) {
    return null;
  }

  return Todo.findOne({ _id: id, userId });
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
    const user = await User.create({ name, email, passwordHash });
    const profile = publicUser({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
    });

    res.status(201).json({
      token: signToken(profile),
      user: profile,
    });
  } catch (error) {
    if (error?.code === 11000) {
      res.status(409).json({ message: "Un compte existe déjà avec cet email." });
      return;
    }

    console.error(error);
    res.status(500).json({ message: "Impossible de créer le compte." });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const email = String(req.body?.email ?? "").trim().toLowerCase();
  const password = String(req.body?.password ?? "");
  const user = await User.findOne({ email });

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    res.status(401).json({ message: "Email ou mot de passe incorrect." });
    return;
  }

  const profile = publicUser({
    id: user._id.toString(),
    name: user.name,
    email: user.email,
  });

  res.json({
    token: signToken(profile),
    user: profile,
  });
});

app.get("/api/todos", requireAuth, async (req, res) => {
  const todos = await Todo.find({ userId: req.auth.userId }).sort({ createdAt: 1, _id: 1 });
  res.json(todos.map(publicTodo));
});

app.get("/api/todos/:id", requireAuth, async (req, res) => {
  const todo = await findTodo(req.params.id, req.auth.userId);

  if (!todo) {
    res.status(404).json({ message: "Todo introuvable." });
    return;
  }

  res.json(publicTodo(todo));
});

app.post("/api/todos", requireAuth, withImage, async (req, res) => {
  const text = String(req.body?.text ?? "").trim();

  if (!text) {
    res.status(400).json({ message: "Le texte du todo est requis." });
    return;
  }

  let imageKey = null;

  try {
    if (req.file) {
      imageKey = await enqueueImageUpload(req.auth.userId, req.file);
    }

    const todo = await Todo.create({
      userId: req.auth.userId,
      text,
      imageKey,
    });

    res.status(201).json(publicTodo(todo));
  } catch (error) {
    if (imageKey) {
      await enqueueImageDelete(imageKey).catch((deleteError) => {
        console.error(deleteError);
      });
    }

    res.status(error.status ?? 500).json({
      message: error.status ? error.message : "Impossible de créer le todo.",
    });
  }
});

app.patch("/api/todos/:id", requireAuth, withImage, async (req, res) => {
  const current = await findTodo(req.params.id, req.auth.userId);

  if (!current) {
    res.status(404).json({ message: "Todo introuvable." });
    return;
  }

  const patch = {};
  const removeImageFlag = req.body?.removeImage === true || req.body?.removeImage === "true";

  if (req.body?.text !== undefined) {
    const text = String(req.body.text).trim();

    if (!text) {
      res.status(400).json({ message: "Le texte du todo est requis." });
      return;
    }

    patch.text = text;
  }

  if (req.body?.done !== undefined) {
    patch.done = req.body.done === true || req.body.done === "true" || req.body.done === "1";
  }

  let uploadedKey = null;

  try {
    if (req.file) {
      uploadedKey = await enqueueImageUpload(req.auth.userId, req.file);
      patch.imageKey = uploadedKey;
    } else if (removeImageFlag && current.imageKey) {
      patch.imageKey = null;
    }
  } catch (error) {
    res.status(error.status ?? 500).json({
      message: error.status ? error.message : "Impossible d'enregistrer l'image.",
    });
    return;
  }

  if (Object.keys(patch).length === 0) {
    res.status(400).json({ message: "Aucune modification à enregistrer." });
    return;
  }

  try {
    const todo = await Todo.findOneAndUpdate(
      { _id: current._id, userId: req.auth.userId },
      patch,
      { new: true }
    );

    if (!todo) {
      if (uploadedKey) {
        await enqueueImageDelete(uploadedKey);
      }

      res.status(404).json({ message: "Todo introuvable." });
      return;
    }

    if (current.imageKey && current.imageKey !== todo.imageKey) {
      await enqueueImageDelete(current.imageKey).catch((deleteError) => {
        console.error(deleteError);
      });
    }

    res.json(publicTodo(todo));
  } catch (error) {
    if (uploadedKey) {
      await enqueueImageDelete(uploadedKey);
    }

    console.error(error);
    res.status(500).json({ message: "Impossible de modifier le todo." });
  }
});

app.delete("/api/todos/:id", requireAuth, async (req, res) => {
  const current = await findTodo(req.params.id, req.auth.userId);

  if (!current) {
    res.status(404).json({ message: "Todo introuvable." });
    return;
  }

  await current.deleteOne();
  await enqueueImageDelete(current.imageKey).catch((deleteError) => {
    console.error(deleteError);
  });
  res.status(204).end();
});

await connectDb();

const server = app.listen(port, () => {
  console.log(`API prête sur le port ${port}`);
});

async function shutdown() {
  server.close();
  await mongoose.disconnect();
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
