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
html = html.replace(/(<link[^>]+href=")([^"]+)"/g, (match, prefix, url) => {
  if (url.startsWith("http")) return `${prefix}/fetch?url=${url}"`;
  if (url.startsWith("//")) return `${prefix}/fetch?url=https:${url}"`;
  if (url.startsWith("/")) return `${prefix}/fetch?url=${baseUrl}${url}"`;
  if (
    !url.startsWith("http") &&
    !url.startsWith("//") &&
    !url.startsWith("/")
  ) {
    return match.replace(url, `/fetch?url=${baseUrl}/${url}`);
  }
  
  return match;
});

// Fix <meta property="og:image">, <meta name="twitter:image">, <meta itemprop="image">
html = html.replace(/(<meta[^>]+(?:property|name|itemprop)="(?:og:image|twitter:image|image)"[^>]+content=")([^"]+)"/g,
  (match, prefix, url) => {
    if (url.startsWith("http")) return `${prefix}/fetch?url=${url}"`;
    if (url.startsWith("//")) return `${prefix}/fetch?url=https:${url}"`;
    if (url.startsWith("/")) return `${prefix}/fetch?url=${baseUrl}${url}"`;
    return match;
  }
);

// Fix icon + manifest links
html = html.replace(/(<link[^>]+rel="(?:icon|shortcut icon|apple-touch-icon|apple-touch-icon-precomposed|mask-icon|manifest)"[^>]+href=")([^"]+)"/g,
  (match, prefix, url) => {
    if (url.startsWith("http")) return `${prefix}/fetch?url=${url}"`;
    if (url.startsWith("//")) return `${prefix}/fetch?url=https:${url}"`;
    if (url.startsWith("/")) return `${prefix}/fetch?url=${baseUrl}${url}"`;
    return match;
  }
);


// 3. Fix <script src="">
html = html.replace(/(<script[^>]+src=")([^"]+)"/g, (match, prefix, url) => {
  if (url.startsWith("http")) return `${prefix}/fetch?url=${url}"`;
  if (url.startsWith("//")) return `${prefix}/fetch?url=https:${url}"`;
  if (url.startsWith("/")) return `${prefix}/fetch?url=${baseUrl}${url}"`;
  return match;
});

  // 4. Fix <img src="">
  html = html.replace(/<img[^>]+src="([^"]+)"/g, (match, url) => {
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

  // 8. Fix <a href="">
  html = html.replace(/<a[^>]+href="([^"]+)"/g, (match, url) => {
    if (url.startsWith("http")) return match.replace(url, `/fetch?url=${url}`);
    if (url.startsWith("//")) return match.replace(url, `/fetch?url=https:${url}`);
    if (url.startsWith("/")) return match.replace(url, `/fetch?url=${baseUrl}${url}`);
    return match;
  });

  // 9. Fix <img srcset="">
  html = html.replace(/srcset="([^"]+)"/g, (match, srcset) => {
    const rewritten = srcset
      .split(",")
      .map(part => {
        const [url, size] = part.trim().split(" ");
        if (url.startsWith("http")) return `/fetch?url=${url} ${size || ""}`.trim();
        if (url.startsWith("//")) return `/fetch?url=https:${url} ${size || ""}`.trim();
        if (url.startsWith("/")) return `/fetch?url=${baseUrl}${url} ${size || ""}`.trim();
        return part;
      })
      .join(", ");
    return `srcset="${rewritten}"`;
  });

  // 10. Fix <picture> <source srcset="">
  html = html.replace(/<source[^>]+srcset="([^"]+)"/g, (match, srcset) => {
    const rewritten = srcset
      .split(",")
      .map(part => {
        const [url, size] = part.trim().split(" ");
        if (url.startsWith("http")) return `/fetch?url=${url} ${size || ""}`.trim();
        if (url.startsWith("//")) return `/fetch?url=https:${url} ${size || ""}`.trim();
        if (url.startsWith("/")) return `/fetch?url=${baseUrl}${url} ${size || ""}`.trim();
        return part;
      })
      .join(", ");
    return match.replace(srcset, rewritten);
  });

    // 5. Fix <source src="">
    html = html.replace(/<source[^>]+src="([^"]+)"/g, (match, url) => {
      if (url.startsWith("http")) return match.replace(url, `/fetch?url=${url}`);
      if (url.startsWith("//")) return match.replace(url, `/fetch?url=https:${url}`);
      if (url.startsWith("/")) return match.replace(url, `/fetch?url=${baseUrl}${url}`);
      return match;
    });

  // 11. Fix <svg><use href="">
  html = html.replace(/<use[^>]+href="([^"]+)"/g, (match, url) => {
    if (url.startsWith("http")) return match.replace(url, `/fetch?url=${url}`);
    if (url.startsWith("//")) return match.replace(url, `/fetch?url=https:${url}`);
    if (url.startsWith("/")) return match.replace(url, `/fetch?url=${baseUrl}${url}`);
    return match;
  });

  // 12. Fix <link rel="preload" as="image">
  html = html.replace(/<link[^>]+as="image"[^>]+href="([^"]+)"/g, (match, url) => {
    if (url.startsWith("http")) return match.replace(url, `/fetch?url=${url}`);
    if (url.startsWith("//")) return match.replace(url, `/fetch?url=https:${url}`);
    if (url.startsWith("/")) return match.replace(url, `/fetch?url=${baseUrl}${url}`);
    return match;
  });

  // 13. Fix <iframe src="">
  html = html.replace(/<iframe[^>]+src="([^"]+)"/g, (match, url) => {
    if (url.startsWith("http")) return match.replace(url, `/fetch?url=${url}`);
    if (url.startsWith("//")) return match.replace(url, `/fetch?url=https:${url}`);
    if (url.startsWith("/")) return match.replace(url, `/fetch?url=${baseUrl}${url}`);
    return match;
  });

  // 14. Fix <form action="">
  html = html.replace(/<form[^>]+action="([^"]+)"/g, (match, url) => {
    if (url.startsWith("http")) return match.replace(url, `/fetch?url=${url}`);
    if (url.startsWith("//")) return match.replace(url, `/fetch?url=https:${url}`);
    if (url.startsWith("/")) return match.replace(url, `/fetch?url=${baseUrl}${url}`);
    return match;
  });

  // 15. Fix <meta http-equiv="refresh" content="0; url=...">
  html = html.replace(/http-equiv="refresh" content="([^"]+)"/g, (match, content) => {
    const parts = content.split("url=");
    if (parts.length < 2) return match;
    const url = parts[1];
    let rewritten = url;
    if (url.startsWith("http")) rewritten = `/fetch?url=${url}`;
    else if (url.startsWith("//")) rewritten = `/fetch?url=https:${url}`;
    else if (url.startsWith("/")) rewritten = `/fetch?url=${baseUrl}${url}`;
    return `http-equiv="refresh" content="${parts[0]}url=${rewritten}"`;
  });

  return html;
}

function rewriteJS(js, baseUrl) {
  // Rewrite Webpack public path (__webpack_require__.p)
js = js.replace(/__webpack_require__\.p\s*=\s*["']([^"']+)["']/g, (match, p) => {
  return `__webpack_require__.p = "/fetch?url=${baseUrl}${p}"`;
});

// Rewrite Webpack dynamic chunk loading
js = js.replace(/\.src\s*=\s*(__webpack_require__\.p\s*\+\s*[^;]+);/g, (match, expr) => {
  return `.src = "/fetch?url=" + ${expr};`;
});

// Rewrite Webpack asset resolver
js = js.replace(/(__webpack_require__\.p\s*\+\s*["'][^"']+["'])/g, (match) => {
  return `"/fetch?url=" + ${match}`;
});

// Rewrite Webpack JSON/data fetches
js = js.replace(/fetch\((__webpack_require__\.p\s*\+\s*["'][^"']+["'])\)/g, (match, expr) => {
  return `fetch("/fetch?url=" + ${expr})`;
});

  
  // 1. Rewrite static ES module imports: import x from "..."
  js = js.replace(/(import\s+[^'"]*?from\s*["'])([^"']+)(["'])/g, (match, prefix, url, suffix) => {
    if (url.startsWith("http")) return `${prefix}/fetch?url=${url}${suffix}`;
    if (url.startsWith("//")) return `${prefix}/fetch?url=https:${url}${suffix}`;
    if (url.startsWith("/")) return `${prefix}/fetch?url=${baseUrl}${url}${suffix}`;
    return match;
  });

  // 2. Rewrite bare side-effect imports: import "..."
  js = js.replace(/(import\s*["'])([^"']+)(["'])/g, (match, prefix, url, suffix) => {
    if (url.startsWith("http")) return `${prefix}/fetch?url=${url}${suffix}`;
    if (url.startsWith("//")) return `${prefix}/fetch?url=https:${url}${suffix}`;
    if (url.startsWith("/")) return `${prefix}/fetch?url=${baseUrl}${url}${suffix}`;
    return match;
  });

  // 3. Rewrite dynamic imports: import("...")
  js = js.replace(/(import\s*\(\s*["'])([^"']+)(["']\s*\))/g, (match, prefix, url, suffix) => {
    if (url.startsWith("http")) return `${prefix}/fetch?url=${url}${suffix}`;
    if (url.startsWith("//")) return `${prefix}/fetch?url=https:${url}${suffix}`;
    if (url.startsWith("/")) return `${prefix}/fetch?url=${baseUrl}${url}${suffix}`;
    return match;
  });

  // 4. Rewrite fetch("...")
  js = js.replace(/(fetch\s*\(\s*["'])([^"']+)(["'])/g, (match, prefix, url, suffix) => {
    if (url.startsWith("http")) return `${prefix}/fetch?url=${url}${suffix}`;
    if (url.startsWith("//")) return `${prefix}/fetch?url=https:${url}${suffix}`;
    if (url.startsWith("/")) return `${prefix}/fetch?url=${baseUrl}${url}${suffix}`;
    return match;
  });

  return js;
}

  


app.get("/fetch", async (req, res) => {
  const target = req.query.url;

  // Safety: allow only specific domains
  const allowed = [
    "https://example.com",
    "https://developer.mozilla.org",
    "https://static.mdn.mozilla.net",
    "https://mdn.mozillademos.org",
    "https://mdn.github.io",
    "https://wikipedia.org",
  
    // Bluesky
    "https://bsky.app",
    "https://cdn.bsky.app",
    "https://static.bsky.app",
    "https://public.api.bsky.app",
  
    // GitHub icon
    "https://github.githubassets.com",
  
    // Twitter/X icon
    "https://abs.twimg.com",
  
    // YouTube thumbnails
    "https://i.ytimg.com"
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

// If it's JavaScript or looks like JS, rewrite it
if (
  contentType &&
  (
    contentType.includes("javascript") ||
    contentType.includes("module") ||
    contentType.includes("text/plain") ||
    contentType.includes("application/octet-stream")
  ) ||
  target.endsWith(".js")
) {
  let js = await response.text();
  const urlObj = new URL(target);
  const baseUrl = `${urlObj.protocol}//${urlObj.host}`;

  js = rewriteJS(js, baseUrl);
  res.set("Content-Type", "application/javascript");
  return res.send(js);
}


  
  // Otherwise return raw content (CSS, JS, images, etc.)
  const buffer = await response.arrayBuffer();
  res.set("Content-Type", contentType);
  res.send(Buffer.from(buffer));
});


app.listen(3000, () => {
  console.log("Server running on port 3000");
});
