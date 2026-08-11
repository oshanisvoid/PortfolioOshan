
import { getStore } from "@netlify/blobs";

const STORE_NAME = "portfolio-guestbook";
const MAX_MESSAGES = 500;

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });

const clean = (value, max) =>
  typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, max)
    : "";

export default async (request) => {
  const store = getStore({ name: STORE_NAME, consistency: "strong" });

  if (request.method === "GET") {
    const { blobs } = await store.list({ prefix: "messages/" });
    const messages = [];

    for (const blob of blobs) {
      const entry = await store.get(blob.key, { type: "json" });
      if (entry) messages.push(entry);
    }

    messages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return json({ messages: messages.slice(0, MAX_MESSAGES) });
  }

  if (request.method !== "POST") {
    return json({ error: "Method not allowed." }, 405);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid request body." }, 400);
  }

  const name = clean(body.name, 60);
  const message = typeof body.message === "string"
    ? body.message.trim().slice(0, 500)
    : "";

  if (name.length < 2) return json({ error: "Please enter a valid name." }, 400);
  if (message.length < 2) return json({ error: "Please enter a message." }, 400);

  const createdAt = new Date().toISOString();
  const id = `${Date.now()}-${crypto.randomUUID()}`;

  await store.setJSON(`messages/${id}`, {
    id,
    name,
    message,
    createdAt,
  });

  return json({ ok: true }, 201);
};
