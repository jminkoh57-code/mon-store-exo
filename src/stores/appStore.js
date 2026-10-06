import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api } from "../api";

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
            const data = await api("/auth/register", {
              method: "POST",
              body: {
                name: newUser.name,
                email: newUser.email,
                password: newUser.password,
              },
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
              message: error.message || "Impossible de créer le compte.",
            };
          }
        },
        login: async (email, password) => {
          try {
            const data = await api("/auth/login", {
              method: "POST",
              body: { email, password },
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
              message: error.message || "Email ou mot de passe incorrect.",
            };
          }
        },
      },

      todos: {
        value: [],
        loading: false,

        add: async (text) => {
          const token = get().user.token;
          const todo = await api("/todos", {
            method: "POST",
            body: { text },
            token,
          });

          set((state) => ({
            todos: {
              ...state.todos,
              value: [...state.todos.value, todo],
            },
          }));
        },

        show: async (id) => {
          const token = get().user.token;
          return api(`/todos/${id}`, { token });
        },

        update: async (id, text) => {
          const token = get().user.token;
          const todo = await api(`/todos/${id}`, {
            method: "PATCH",
            body: { text },
            token,
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
          const token = get().user.token;
          const current = get().todos.value.find((item) => item.id === id);
          const todo = await api(`/todos/${id}`, {
            method: "PATCH",
            body: { done: !current?.done },
            token,
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
          const token = get().user.token;
          await api(`/todos/${id}`, {
            method: "DELETE",
            token,
          });

          set((state) => ({
            todos: {
              ...state.todos,
              value: state.todos.value.filter((todo) => todo.id !== id),
            },
          }));
        },

        fetch: async () => {
          const token = get().user.token;

          if (!token) return;

          set((state) => ({
            todos: {
              ...state.todos,
              loading: true,
            },
          }));

          try {
            const data = await api("/todos", { token });

            set((state) => ({
              todos: {
                ...state.todos,
                value: data,
                loading: false,
              },
            }));
          } catch (error) {
            if (error.status === 401) {
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