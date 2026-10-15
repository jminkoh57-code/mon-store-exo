async function api(path, { method = "GET", body, form, token } = {}) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  let payload;

  if (form) {
    payload = form;
  } else if (body) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  const response = await fetch(`/api${path}`, {
    method,
    headers,
    body: payload,
  });

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || "Erreur serveur.");
    error.status = response.status;
    throw error;
  }

  return data;
}

export { api };
