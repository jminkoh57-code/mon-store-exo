import { create } from "zustand";
import { persist } from "zustand/middleware";

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
        accounts: [],
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
            },
          })),
        register: (newUser) => {
          const email = newUser.email.trim().toLowerCase();
          const exists = get().user.accounts.some(
            (account) => account.email === email
          );

          if (exists) return false;

          set((state) => ({
            user: {
              ...state.user,
              accounts: [
                ...state.user.accounts,
                {
                  name: newUser.name.trim(),
                  email,
                  password: newUser.password,
                },
              ],
              value: {
                name: newUser.name.trim(),
                email,
              },
            },
          }));

          return true;
        },
        login: (email, password) => {
          const account = get().user.accounts.find(
            (item) =>
              item.email === email.trim().toLowerCase() &&
              item.password === password
          );

          if (!account) return false;

          set((state) => ({
            user: {
              ...state.user,
              value: {
                name: account.name,
                email: account.email,
              },
            },
          }));

          return true;
        },
      },

      todos: {
        value: [],

        add: (text) =>
          set((state) => ({
            todos: {
              ...state.todos,
              value: [
                ...state.todos.value,
                {
                  id: Date.now(),
                  text,
                  done: false,
                },
              ],
            },
          })),

        toggle: (id) =>
          set((state) => ({
            todos: {
              ...state.todos,
              value: state.todos.value.map((todo) =>
                todo.id === id
                  ? { ...todo, done: !todo.done }
                  : todo
              ),
            },
          })),

        delete: (id) =>
          set((state) => ({
            todos: {
              ...state.todos,
              value: state.todos.value.filter(
                (todo) => todo.id !== id
              ),
            },
          })),

        fetch: async () => {
          const res = await fetch(
            `${import.meta.env.VITE_TODOS_API_URL}/todos?_limit=5`
          );

          const data = await res.json();

          set((state) => ({
            todos: {
              ...state.todos,
              value: data.map((todo) => ({
                id: todo.id,
                text: todo.title,
                done: todo.completed,
              })),
            },
          }));
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
          value: persistedState?.user?.value ?? currentState.user.value,
          accounts:
            persistedState?.user?.accounts ?? currentState.user.accounts,
        },
        todos: {
          ...currentState.todos,
          value: persistedState?.todos?.value ?? currentState.todos.value,
        },
      }),
    }
  )
);