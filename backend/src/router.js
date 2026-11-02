import { initTRPC, TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { z } from "zod";
import { signToken } from "./context.js";
import { Todo, User } from "./models.js";
import { enqueueImageDelete, enqueueImageUpload } from "./queue.js";
import { imageUrl } from "./storage.js";

const t = initTRPC.context().create();
const publicProcedure = t.procedure;

const protectedProcedure = publicProcedure.use(({ ctx, next }) => {
  if (!ctx.auth?.userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: ctx.invalidToken ? "Session expirée." : "Connexion requise.",
    });
  }

  return next({ ctx: { auth: ctx.auth } });
});

const imageSchema = z
  .object({
    mimetype: z.string().min(1),
    data: z.string().min(1),
  })
  .nullish();

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

function toUpload(image) {
  if (!image) return null;

  const buffer = Buffer.from(image.data, "base64");

  if (!buffer.length) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Image invalide." });
  }

  if (buffer.length > 2 * 1024 * 1024) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "L'image dépasse 2 Mo.",
    });
  }

  return { buffer, mimetype: image.mimetype };
}

function rethrowJob(error, fallback) {
  if (error instanceof TRPCError) throw error;

  throw new TRPCError({
    code: error?.status === 400 ? "BAD_REQUEST" : "INTERNAL_SERVER_ERROR",
    message: error?.status ? error.message : fallback,
  });
}

async function findTodo(id, userId) {
  if (!mongoose.isValidObjectId(id) || !mongoose.isValidObjectId(userId)) {
    return null;
  }

  return Todo.findOne({ _id: id, userId });
}

const authRouter = t.router({
  register: publicProcedure
    .input(
      z.object({
        name: z.string(),
        email: z.string(),
        password: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const name = input.name.trim();
      const email = input.email.trim().toLowerCase();
      const password = input.password;

      if (!name || !email || !password) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Nom, email et mot de passe sont requis.",
        });
      }

      const passwordHash = await bcrypt.hash(password, 10);

      try {
        const user = await User.create({ name, email, passwordHash });
        const profile = publicUser({
          id: user._id.toString(),
          name: user.name,
          email: user.email,
        });

        return { token: signToken(profile), user: profile };
      } catch (error) {
        if (error?.code === 11000) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Un compte existe déjà avec cet email.",
          });
        }

        console.error(error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Impossible de créer le compte.",
        });
      }
    }),

  login: publicProcedure
    .input(z.object({ email: z.string(), password: z.string() }))
    .mutation(async ({ input }) => {
      const email = input.email.trim().toLowerCase();
      const user = await User.findOne({ email });

      if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Email ou mot de passe incorrect.",
        });
      }

      const profile = publicUser({
        id: user._id.toString(),
        name: user.name,
        email: user.email,
      });

      return { token: signToken(profile), user: profile };
    }),
});

const todoRouter = t.router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const todos = await Todo.find({ userId: ctx.auth.userId }).sort({
      createdAt: 1,
      _id: 1,
    });

    return todos.map(publicTodo);
  }),

  byId: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const todo = await findTodo(input.id, ctx.auth.userId);

      if (!todo) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Todo introuvable.",
        });
      }

      return publicTodo(todo);
    }),

  create: protectedProcedure
    .input(z.object({ text: z.string(), image: imageSchema }))
    .mutation(async ({ ctx, input }) => {
      const text = input.text.trim();

      if (!text) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Le texte du todo est requis.",
        });
      }

      let imageKey = null;

      try {
        const file = toUpload(input.image);
        if (file) {
          imageKey = await enqueueImageUpload(ctx.auth.userId, file);
        }

        const todo = await Todo.create({
          userId: ctx.auth.userId,
          text,
          imageKey,
        });

        return publicTodo(todo);
      } catch (error) {
        if (imageKey) {
          await enqueueImageDelete(imageKey).catch((deleteError) => {
            console.error(deleteError);
          });
        }

        rethrowJob(error, "Impossible de créer le todo.");
      }
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        text: z.string().optional(),
        done: z.boolean().optional(),
        image: imageSchema,
        removeImage: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const current = await findTodo(input.id, ctx.auth.userId);

      if (!current) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Todo introuvable.",
        });
      }

      const patch = {};

      if (input.text !== undefined) {
        const text = input.text.trim();

        if (!text) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Le texte du todo est requis.",
          });
        }

        patch.text = text;
      }

      if (input.done !== undefined) {
        patch.done = input.done;
      }

      let uploadedKey = null;

      try {
        const file = toUpload(input.image);

        if (file) {
          uploadedKey = await enqueueImageUpload(ctx.auth.userId, file);
          patch.imageKey = uploadedKey;
        } else if (input.removeImage && current.imageKey) {
          patch.imageKey = null;
        }
      } catch (error) {
        rethrowJob(error, "Impossible d'enregistrer l'image.");
      }

      if (Object.keys(patch).length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Aucune modification à enregistrer.",
        });
      }

      try {
        const todo = await Todo.findOneAndUpdate(
          { _id: current._id, userId: ctx.auth.userId },
          patch,
          { new: true },
        );

        if (!todo) {
          if (uploadedKey) {
            await enqueueImageDelete(uploadedKey);
          }

          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Todo introuvable.",
          });
        }

        if (current.imageKey && current.imageKey !== todo.imageKey) {
          await enqueueImageDelete(current.imageKey).catch((deleteError) => {
            console.error(deleteError);
          });
        }

        return publicTodo(todo);
      } catch (error) {
        if (uploadedKey) {
          await enqueueImageDelete(uploadedKey);
        }

        if (error instanceof TRPCError) throw error;

        console.error(error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Impossible de modifier le todo.",
        });
      }
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const current = await findTodo(input.id, ctx.auth.userId);

      if (!current) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Todo introuvable.",
        });
      }

      await current.deleteOne();
      await enqueueImageDelete(current.imageKey).catch((deleteError) => {
        console.error(deleteError);
      });

      return { ok: true };
    }),
});

const appRouter = t.router({
  auth: authRouter,
  todos: todoRouter,
});

export { appRouter };
