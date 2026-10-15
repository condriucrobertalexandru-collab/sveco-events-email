import nodemailer from "nodemailer";

const json = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify(body),
});

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "Invalid JSON" });
  }

  const name = String(payload.name || "").trim().slice(0, 150);
  const email = String(payload.email || "").trim();
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return json(400, { error: "A valid name and email are required" });
  }

  const user = process.env.GMAIL_USER;
  const appPassword = process.env.GMAIL_APP_PASSWORD;
  if (!user || !appPassword) {
    return json(500, { error: "Email credentials are not configured" });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass: appPassword },
    });

    await transporter.sendMail({
      from: `"Sveco Events" <${user}>`,
      to: email,
      subject: "Am primit cererea ta — Sveco Events",
      text: `Bună${name ? " " + name : ""}!\n\nÎți mulțumim că ai contactat Sveco Events — „Pentru că ne pasă!”\n\nAm primit cererea ta și vom analiza detaliile evenimentului. Revenim către tine în cel mai scurt timp pentru a discuta despre serviciile potrivite.\n\nCu drag,\nEchipa Sveco Events\nfe.svecoevents.srl@gmail.com`,
    });

    return json(200, { ok: true });
  } catch (error) {
    console.error("Confirmation email failed:", error?.message || "unknown error");
    return json(502, { error: "Could not send confirmation email" });
  }
}
