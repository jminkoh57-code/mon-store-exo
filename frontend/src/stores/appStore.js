import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiError, setTokenReader, trpc } from "../trpc";

function readImage(file) {
  if (!file) return null;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = String(reader.result ?? "");
      const data = result.includes(",") ? result.split(",")[1] : result;
      resolve({
        mimetype: file.type || "application/octet-stream",
        data,
      });
    };

    reader.onerror = () => reject(new Error("Image invalide."));
    reader.readAsDataURL(file);
  });
}

export const useAppStore = create(
  persist(
    (set, get) => ({
      darkMode: {
        value: false,
        toggle: () =>
          set((state) => ({
            darkMode: {
              ...state.darkMode,
              value: !state.darkMode.value,
            },
          })),
      },

      count: {
        value: 0,
        increment: () =>
          set((state) => ({
            count: {
              ...state.count,
              value: state.count.value + 1,
            },
          })),
        decrement: () =>
          set((state) => ({
            count: {
              ...state.count,
              value: state.count.value - 1,
            },
          })),
      },

      user: {
        value: null,
        token: null,
        set: (newUser) =>
          set((state) => ({
            user: {
              ...state.user,
              value: newUser,
            },
          })),
        logout: () =>
          set((state) => ({
            user: {
              ...state.user,
              value: null,
              token: null,
            },
            todos: {
              ...state.todos,
              value: [],
              loading: false,
            },
          })),
        register: async (newUser) => {
          try {
            const data = await trpc.auth.register.mutate({
              name: newUser.name,
              email: newUser.email,
              password: newUser.password,
            });

            set((state) => ({
              user: {
                ...state.user,
                value: data.user,
                token: data.token,
              },
              todos: {
                ...state.todos,
                value: [],
              },
            }));

            return { ok: true };
          } catch (error) {
            return {
              ok: false,
              message: apiError(error).message,
            };
          }
        },
        login: async (email, password) => {
          try {
            const data = await trpc.auth.login.mutate({ email, password });

            set((state) => ({
              user: {
                ...state.user,
                value: data.user,
                token: data.token,
              },
              todos: {
                ...state.todos,
                value: [],
              },
            }));

            return { ok: true };
          } catch (error) {
            return {
              ok: false,
              message:
                apiError(error).message || "Email ou mot de passe incorrect.",
            };
          }
        },
      },

      todos: {
        value: [],
        loading: false,

        add: async (text, imageFile) => {
          const todo = await trpc.todos.create.mutate({
            text,
            image: await readImage(imageFile),
          });

          set((state) => ({
            todos: {
              ...state.todos,
              value: [...state.todos.value, todo],
            },
          }));
        },

        show: async (id) => {
          return trpc.todos.byId.query({ id });
        },

        update: async (id, fields) => {
          const todo = await trpc.todos.update.mutate({
            id,
            text: fields.text,
            image: await readImage(fields.imageFile),
            removeImage: Boolean(fields.removeImage),
          });

          set((state) => ({
            todos: {
              ...state.todos,
              value: state.todos.value.map((item) =>
                item.id === id ? todo : item
              ),
            },
          }));

          return todo;
        },

        toggle: async (id) => {
          const current = get().todos.value.find((item) => item.id === id);
          const todo = await trpc.todos.update.mutate({
            id,
            done: !current?.done,
          });

          set((state) => ({
            todos: {
              ...state.todos,
              value: state.todos.value.map((item) =>
                item.id === id ? todo : item
              ),
            },
          }));
        },

        delete: async (id) => {
          await trpc.todos.delete.mutate({ id });

          set((state) => ({
            todos: {
              ...state.todos,
              value: state.todos.value.filter((todo) => todo.id !== id),
            },
          }));
        },

        fetch: async () => {
          if (!get().user.token) return;

          set((state) => ({
            todos: {
              ...state.todos,
              loading: true,
            },
          }));

          try {
            const data = await trpc.todos.list.query();

            set((state) => ({
              todos: {
                ...state.todos,
                value: data,
                loading: false,
              },
            }));
          } catch (error) {
            if (apiError(error).status === 401) {
              get().user.logout();
            }

            set((state) => ({
              todos: {
                ...state.todos,
                loading: false,
              },
            }));
          }
        },
      },
    }),
    {
      name: "app-storage",
      merge: (persistedState, currentState) => ({
        ...currentState,
        darkMode: {
          ...currentState.darkMode,
          value:
            persistedState?.darkMode?.value ?? currentState.darkMode.value,
        },
        count: {
          ...currentState.count,
          value: persistedState?.count?.value ?? currentState.count.value,
        },
        user: {
          ...currentState.user,
          value: persistedState?.user?.token
            ? persistedState.user.value
            : null,
          token: persistedState?.user?.token ?? null,
        },
        todos: {
          ...currentState.todos,
          value: [],
        },
      }),
    }
  )
);

setTokenReader(() => useAppStore.getState().user.token);