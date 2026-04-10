// SAFE EXAMPLE — NOT A BYPASS
import express from "express";
import fetch from "node-fetch";

const app = express();

app.get("/", (req, res) => {
  res.send(`
    <html>
      <body>
        <h1>Choose a domain:</h1>

        <button onclick="location.href='/fetch?url=https://example.com'">
          Example.com
        </button>

        <button onclick="location.href='/fetch?url=https://developer.mozilla.org'">
          MDN Docs
        </button>

        <button onclick="location.href='/fetch?url=https://wikipedia.org'">
          Wikipedia
        </button>


      </body>
    </html>
  `);
});

function rewriteHTML(html, baseUrl) {
  // 1. Fix protocol-relative URLs: //example.com/file.css
  html = html.replace(/(src|href)="\/\/([^"]+)"/g, (match, attr, url) => {
    return `${attr}="/fetch?url=https://${url}"`;
  });

  // 2. Fix <link href="">
  html = html.replace(/href="([^"]+)"/g, (match, url) => {
    if (url.startsWith("http")) return `href="/fetch?url=${url}"`;
    if (url.startsWith("//")) return `href="/fetch?url=https:${url}"`;
    if (url.startsWith("/")) return `href="/fetch?url=${baseUrl}${url}"`;
    return match;
  });

  // 3. Fix <script src="">
  html = html.replace(/src="([^"]+)"/g, (match, url) => {
    if (url.startsWith("http")) return `src="/fetch?url=${url}"`;
    if (url.startsWith("//")) return `src="/fetch?url=https:${url}"`;
    if (url.startsWith("/")) return `src="/fetch?url=${baseUrl}${url}"`;
    return match;
  });

  // 4. Fix <img src="">
  html = html.replace(/<img[^>]+src="([^"]+)"/g, (match, url) => {
    if (url.startsWith("http")) return match.replace(url, `/fetch?url=${url}`);
    if (url.startsWith("//")) return match.replace(url, `/fetch?url=https:${url}`);
    if (url.startsWith("/")) return match.replace(url, `/fetch?url=${baseUrl}${url}`);
    return match;
  });

  // 5. Fix <source src="">
  html = html.replace(/<source[^>]+src="([^"]+)"/g, (match, url) => {
    if (url.startsWith("http")) return match.replace(url, `/fetch?url=${url}`);
    if (url.startsWith("//")) return match.replace(url, `/fetch?url=https:${url}`);
    if (url.startsWith("/")) return match.replace(url, `/fetch?url=${baseUrl}${url}`);
    return match;
  });

  // 6. Fix <video poster="">
  html = html.replace(/poster="([^"]+)"/g, (match, url) => {
    if (url.startsWith("http")) return `poster="/fetch?url=${url}"`;
    if (url.startsWith("//")) return `poster="/fetch?url=https:${url}"`;
    if (url.startsWith("/")) return `poster="/fetch?url=${baseUrl}${url}"`;
    return match;
  });

  // 7. Fix URLs inside <style> blocks
  html = html.replace(/<style[^>]*>([\s\S]*?)<\/style>/g, (match, css) => {
    const rewritten = css.replace(/url\(([^)]+)\)/g, (m, url) => {
      url = url.replace(/['"]/g, "");
      if (url.startsWith("http")) return `url(/fetch?url=${url})`;
      if (url.startsWith("//")) return `url(/fetch?url=https:${url})`;
      if (url.startsWith("/")) return `url(/fetch?url=${baseUrl}${url})`;
      return m;
    });
    return `<style>${rewritten}</style>`;
  });

  // 8. Fix <a href=""> (navigation stays inside proxy)
  html = html.replace(/<a[^>]+href="([^"]+)"/g, (match, url) => {
    if (url.startsWith("http")) return match.replace(url, `/fetch?url=${url}`);
    if (url.startsWith("//")) return match.replace(url, `/fetch?url=https:${url}`);
    if (url.startsWith("/")) return match.replace(url, `/fetch?url=${baseUrl}${url}`);
    return match;
  });

  return html;
}


  


app.get("/fetch", async (req, res) => {
  const target = req.query.url;

  // Safety: allow only specific domains
  const allowed = [
    "https://example.com",
    "https://developer.mozilla.org",
    "https://wikipedia.org"
  ];

  const isAllowed = allowed.some(domain => target.startsWith(domain));
  if (!isAllowed) {
    return res.status(400).send("Blocked for safety");
  }

  const response = await fetch(target);
  const contentType = response.headers.get("content-type");

  // If it's HTML, rewrite it
  if (contentType && contentType.includes("text/html")) {
    let html = await response.text();

    // Extract base URL (e.g., https://wikipedia.org)
    const urlObj = new URL(target);
    const baseUrl = `${urlObj.protocol}//${urlObj.host}`;

    html = rewriteHTML(html, baseUrl);
    return res.send(html);
  }

  // Otherwise return raw content (CSS, JS, images, etc.)
  const buffer = await response.arrayBuffer();
  res.set("Content-Type", contentType);
  res.send(Buffer.from(buffer));
});


app.listen(3000, () => {
  console.log("Server running on port 3000");
});
