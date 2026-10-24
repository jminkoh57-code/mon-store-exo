function redisConnection() {
  const url = new URL(process.env.REDIS_URL ?? "redis://redis:6379");

  return {
    host: url.hostname,
    port: Number(url.port || 6379),
    username: url.username || undefined,
    password: url.password || undefined,
    maxRetriesPerRequest: null,
  };
}

export { redisConnection };
