// SMTP Send Edge Function
// Handles server-side SMTP email sending so credentials stay off the client

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type",
};

interface SmtpConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  secure: boolean; // true = SSL/TLS, false = STARTTLS or plain
}

interface EmailPayload {
  smtp: SmtpConfig;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  isHtml: boolean;
}

async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let payload: EmailPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { smtp, from, to, cc, bcc, subject, body, isHtml } = payload;

  if (!smtp?.host || !smtp?.port || !smtp?.username || !smtp?.password) {
    return new Response(JSON.stringify({ error: "SMTP configuration is incomplete" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!from || !to?.length || !subject) {
    return new Response(JSON.stringify({ error: "Missing required fields: from, to, subject" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // Build MIME message
    const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const toList = to.join(", ");
    const ccList = cc && cc.length > 0 ? cc.join(", ") : null;
    const bccList = bcc && bcc.length > 0 ? bcc.join(", ") : null;
    const messageId = `<${Date.now()}.${Math.random().toString(36).substr(2, 9)}@${smtp.host}>`;
    const date = new Date().toUTCString();

    let headers = `From: ${from}\r\nTo: ${toList}\r\n`;
    if (ccList) headers += `Cc: ${ccList}\r\n`;
    if (bccList) headers += `Bcc: ${bccList}\r\n`;
    headers += `Subject: ${subject}\r\n`;
    headers += `Date: ${date}\r\n`;
    headers += `Message-ID: ${messageId}\r\n`;
    headers += `MIME-Version: 1.0\r\n`;

    let mimeBody: string;
    if (isHtml) {
      const plainText = body.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
      headers += `Content-Type: multipart/alternative; boundary="${boundary}"\r\n`;
      mimeBody = `--${boundary}\r\nContent-Type: text/plain; charset="UTF-8"\r\nContent-Transfer-Encoding: 7bit\r\n\r\n${plainText}\r\n\r\n--${boundary}\r\nContent-Type: text/html; charset="UTF-8"\r\nContent-Transfer-Encoding: 7bit\r\n\r\n${body}\r\n\r\n--${boundary}--`;
    } else {
      headers += `Content-Type: text/plain; charset="UTF-8"\r\nContent-Transfer-Encoding: 7bit\r\n`;
      mimeBody = body;
    }

    const fullMessage = `${headers}\r\n${mimeBody}`;

    // Connect to SMTP server
    const port = smtp.port;
    const useSSL = smtp.secure || port === 465;

    const conn = useSSL
      ? await Deno.connectTls({ hostname: smtp.host, port })
      : await Deno.connect({ hostname: smtp.host, port });

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const readLine = async (conn: Deno.Conn | Deno.TlsConn): Promise<string> => {
      const buf = new Uint8Array(4096);
      let result = "";
      while (true) {
        const n = await conn.read(buf);
        if (n === null) break;
        result += decoder.decode(buf.subarray(0, n));
        if (result.includes("\r\n")) break;
      }
      return result.trim();
    };

    const send = async (cmd: string) => {
      await conn.write(encoder.encode(cmd + "\r\n"));
    };

    const expect = async (code: string): Promise<string> => {
      const line = await readLine(conn);
      if (!line.startsWith(code)) {
        throw new Error(`Expected ${code}, got: ${line}`);
      }
      return line;
    };

    // SMTP handshake
    await readLine(conn); // server greeting

    await send(`EHLO mailboxclient`);
    let ehloResp = "";
    // Read multi-line EHLO response
    while (true) {
      const line = await readLine(conn);
      ehloResp += line + "\n";
      if (line.startsWith("250 ") || (!line.startsWith("250") && !line.startsWith("2"))) break;
    }

    // STARTTLS if not already SSL and server supports it
    let activeConn: Deno.Conn | Deno.TlsConn = conn;
    if (!useSSL && ehloResp.includes("STARTTLS")) {
      await send("STARTTLS");
      await expect("220");
      activeConn = await Deno.startTls(conn as Deno.Conn, { hostname: smtp.host });
      await send(`EHLO mailboxclient`);
      // drain EHLO again
      while (true) {
        const line = await readLine(activeConn);
        if (line.startsWith("250 ") || (!line.startsWith("250"))) break;
      }
    }

    // AUTH LOGIN
    await send("AUTH LOGIN");
    await expect("334");
    await send(btoa(smtp.username));
    await expect("334");
    await send(btoa(smtp.password));
    await expect("235");

    // Envelope
    await send(`MAIL FROM:<${from}>`);
    await expect("250");

    const allRecipients = [...to, ...(cc || []), ...(bcc || [])];
    for (const recipient of allRecipients) {
      await send(`RCPT TO:<${recipient.trim()}>`);
      await expect("250");
    }

    await send("DATA");
    await expect("354");
    await send(fullMessage + "\r\n.");
    await expect("250");

    await send("QUIT");
    activeConn.close();

    return new Response(
      JSON.stringify({ success: true, messageId }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("SMTP error:", message);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

Deno.serve(handler);
