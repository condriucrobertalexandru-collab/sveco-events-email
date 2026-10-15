```javascript
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
  const phone = String(payload.phone || "").trim().slice(0, 80);
  const date = String(payload.date || "").trim().slice(0, 50);
  const guests = String(payload.guests || "").trim().slice(0, 30);
  const msg = String(payload.msg || "").trim().slice(0, 5000);

  if (
    !name ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    email.length > 254
  ) {
    return json(400, { error: "A valid name and email are required" });
  }

  const user = process.env.GMAIL_USER;
  const appPassword = process.env.GMAIL_APP_PASSWORD;
  const notificationEmail = process.env.NOTIFICATION_EMAIL;

  if (!user || !appPassword || !notificationEmail) {
    return json(500, {
      error: "Email environment variables are not configured",
    });
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: user,
      pass: appPassword,
    },
  });

  try {
    await transporter.sendMail({
      from: user,
      to: email,
      subject: "Am primit cererea ta — Sveco Events",
      text:
        "Bună " + name + "!\n\n" +
        "Îți mulțumim că ai contactat Sveco Events — „Pentru că ne pasă!”\n\n" +
        "Am primit cererea ta și vom analiza detaliile evenimentului. " +
        "Revenim către tine în cel mai scurt timp pentru a discuta despre serviciile potrivite.\n\n" +
        "Cu drag,\nEchipa Sveco Events\n" + user,
    });
  } catch (error) {
    console.error("Customer confirmation failed:", error?.message || "unknown error");
    return json(502, { error: "Could not send confirmation email" });
  }

  try {
    await transporter.sendMail({
      from: user,
      to: notificationEmail,
      replyTo: email,
      subject: "Cerere nouă de ofertă — " + name,
      text:
        "Ai primit o cerere nouă prin site-ul Sveco Events.\n\n" +
        "Nume: " + name + "\n" +
        "Email client: " + email + "\n" +
        "Telefon: " + (phone || "Nespecificat") + "\n" +
        "Data evenimentului: " + (date || "Nespecificată") + "\n" +
        "Număr de invitați: " + (guests || "Nespecificat") + "\n\n" +
        "Mesaj și servicii solicitate:\n" +
        (msg || "Nu a fost adăugat un mesaj.") +
        "\n\nNotificare automată de la site-ul Sveco Events.",
    });
  } catch (error) {
    console.error("Company notification failed:", error?.message || "unknown error");
  }

  return json(200, { ok: true });
}
```
