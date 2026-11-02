import { createTRPCClient, httpBatchLink } from "@trpc/client";

let readToken = () => null;

function setTokenReader(reader) {
  readToken = reader;
}

const trpc = createTRPCClient({
  links: [
    httpBatchLink({
      url: "/trpc",
      headers() {
        const token = readToken();
        return token ? { Authorization: `Bearer ${token}` } : {};
      },
    }),
  ],
});

function apiError(error) {
  const wrapped = new Error(error?.message || "Erreur serveur.");
  wrapped.status = error?.data?.httpStatus;
  return wrapped;
}

export { apiError, setTokenReader, trpc };
