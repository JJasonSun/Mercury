const http = require('http')

const host = '127.0.0.1'
const port = Number(process.env.PORT || 8787)

const state = {
  growingHasThirdArticle: false,
  flakyFails: false
}

const baseUrl = `http://${host}:${port}`

const server = http.createServer((request, response) => {
  const url = new URL(request.url || '/', baseUrl)

  if (url.pathname === '/') {
    sendHtml(response, renderIndex())
    return
  }

  if (url.pathname === '/control/growing/add') {
    state.growingHasThirdArticle = true
    sendHtml(response, renderControlResult('Growing feed now includes Article Three.'))
    return
  }

  if (url.pathname === '/control/growing/reset') {
    state.growingHasThirdArticle = false
    sendHtml(response, renderControlResult('Growing feed reset to two articles.'))
    return
  }

  if (url.pathname === '/control/flaky/fail') {
    state.flakyFails = true
    sendHtml(response, renderControlResult('Flaky feed will now return HTTP 503.'))
    return
  }

  if (url.pathname === '/control/flaky/ok') {
    state.flakyFails = false
    sendHtml(response, renderControlResult('Flaky feed is healthy again.'))
    return
  }

  if (url.pathname === '/feed/basic.xml') {
    sendXml(response, basicFeed())
    return
  }

  if (url.pathname === '/feed/growing.xml') {
    sendXml(response, growingFeed())
    return
  }

  if (url.pathname === '/feed/flaky.xml') {
    if (state.flakyFails) {
      sendText(response, 503, 'Mercury flaky feed forced failure')
      return
    }
    sendXml(response, flakyFeed())
    return
  }

  if (url.pathname === '/feed/duplicates.xml') {
    sendXml(response, duplicateFeed())
    return
  }

  if (url.pathname === '/feed/new-from-opml.xml') {
    sendXml(response, newFromOpmlFeed())
    return
  }

  if (url.pathname.startsWith('/articles/')) {
    sendHtml(response, articleHtml(url.pathname))
    return
  }

  sendText(response, 404, 'Not found')
})

server.listen(port, host, () => {
  console.log(`Mercury Module A test server: ${baseUrl}`)
  console.log(`Basic feed: ${baseUrl}/feed/basic.xml`)
})

function basicFeed() {
  return rss('Mercury Basic Feed', 'Stable feed for add/open/read tests', [
    item({
      title: 'Basic Article One',
      link: `${baseUrl}/articles/basic-one.html`,
      guid: 'basic-one',
      author: 'module-a',
      pubDate: 'Mon, 01 Jun 2026 01:00:00 GMT',
      description: 'First stable article for Module A testing.'
    }),
    item({
      title: 'Basic Article Two',
      link: `${baseUrl}/articles/basic-two.html`,
      guid: 'basic-two',
      author: 'module-a',
      pubDate: 'Mon, 01 Jun 2026 02:00:00 GMT',
      description: 'Second stable article for Module A testing.'
    })
  ])
}

function growingFeed() {
  const items = [
    item({
      title: 'Growing Article One',
      link: `${baseUrl}/articles/growing-one.html`,
      guid: 'growing-one',
      pubDate: 'Mon, 01 Jun 2026 03:00:00 GMT',
      description: 'Initial article in growing feed.'
    }),
    item({
      title: 'Growing Article Two',
      link: `${baseUrl}/articles/growing-two.html`,
      guid: 'growing-two',
      pubDate: 'Mon, 01 Jun 2026 04:00:00 GMT',
      description: 'Second initial article in growing feed.'
    })
  ]

  if (state.growingHasThirdArticle) {
    items.push(
      item({
        title: 'Growing Article Three',
        link: `${baseUrl}/articles/growing-three.html`,
        guid: 'growing-three',
        pubDate: 'Mon, 01 Jun 2026 05:00:00 GMT',
        description: 'This article appears only after the control endpoint is opened.'
      })
    )
  }

  return rss('Mercury Growing Feed', 'Feed that can add one article after refresh', items)
}

function flakyFeed() {
  return rss('Mercury Flaky Feed', 'Feed that can be switched between healthy and failing', [
    item({
      title: 'Flaky Article One',
      link: `${baseUrl}/articles/flaky-one.html`,
      guid: 'flaky-one',
      pubDate: 'Mon, 01 Jun 2026 06:00:00 GMT',
      description: 'This feed can later return HTTP 503 for refresh error tests.'
    })
  ])
}

function duplicateFeed() {
  return rss('Mercury Duplicate Feed', 'Feed with duplicate URLs and tracking params', [
    item({
      title: 'Tracked URL Article',
      link: `${baseUrl}/articles/duplicate-url.html?utm_source=newsletter&utm_medium=email`,
      guid: 'tracked-url-a',
      pubDate: 'Mon, 01 Jun 2026 07:00:00 GMT',
      description: 'This item has tracking query params.'
    }),
    item({
      title: 'Tracked URL Article Updated',
      link: `${baseUrl}/articles/duplicate-url.html/`,
      guid: 'tracked-url-b',
      pubDate: 'Mon, 01 Jun 2026 07:05:00 GMT',
      description: 'This item points to the same canonical URL after normalization.'
    }),
    item({
      title: 'Weak Duplicate Article',
      link: `${baseUrl}/articles/weak-duplicate.html?utm_campaign=launch`,
      pubDate: 'Mon, 01 Jun 2026 08:00:00 GMT',
      description: 'This item has no GUID.'
    }),
    item({
      title: 'Weak Duplicate Article',
      link: `${baseUrl}/articles/weak-duplicate.html/`,
      pubDate: 'Mon, 01 Jun 2026 08:00:00 GMT',
      description: 'Same title/date/link after normalization and still no GUID.'
    }),
    item({
      title: 'Unique Article',
      link: `${baseUrl}/articles/unique.html`,
      guid: 'unique-article',
      pubDate: 'Mon, 01 Jun 2026 09:00:00 GMT',
      description: 'A genuinely unique article.'
    })
  ])
}

function newFromOpmlFeed() {
  return rss('Mercury New From OPML Feed', 'Feed used by OPML preview status tests', [
    item({
      title: 'OPML New Feed Article',
      link: `${baseUrl}/articles/opml-new.html`,
      guid: 'opml-new',
      pubDate: 'Mon, 01 Jun 2026 10:00:00 GMT',
      description: 'This feed should be marked as new before import.'
    })
  ])
}

function rss(title, description, items) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(title)}</title>
    <link>${baseUrl}</link>
    <description>${escapeXml(description)}</description>
    ${items.join('\n    ')}
  </channel>
</rss>`
}

function item({ title, link, guid, author, pubDate, description }) {
  const guidLine = guid ? `<guid>${escapeXml(guid)}</guid>` : ''
  const authorLine = author ? `<author>${escapeXml(author)}</author>` : ''
  return `<item>
      <title>${escapeXml(title)}</title>
      <link>${escapeXml(link)}</link>
      ${guidLine}
      ${authorLine}
      <pubDate>${escapeXml(pubDate)}</pubDate>
      <description>${escapeXml(description)}</description>
    </item>`
}

function articleHtml(pathname) {
  const title = pathname
    .replace('/articles/', '')
    .replace(/\.html$/, '')
    .replace(/-/g, ' ')

  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body>
    <article>
      <h1>${escapeHtml(title)}</h1>
      <p>This is raw HTML served by the Module A test server.</p>
      <p>Module A should fetch and store this HTML when the article is opened.</p>
    </article>
  </body>
</html>`
}

function renderIndex() {
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <title>Mercury Module A Test Server</title>
    <style>
      body { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; max-width: 860px; margin: 40px auto; line-height: 1.6; color: #303133; }
      code { background: #f5f7fa; padding: 2px 6px; border-radius: 4px; }
      a { color: #409eff; }
      .status { padding: 12px 14px; border: 1px solid #e4e7ed; border-radius: 6px; background: #f8f9fa; }
      li { margin: 6px 0; }
    </style>
  </head>
  <body>
    <h1>Mercury Module A Test Server</h1>
    <div class="status">
      Growing third article: <strong>${state.growingHasThirdArticle ? 'ON' : 'OFF'}</strong><br />
      Flaky feed failure: <strong>${state.flakyFails ? 'ON' : 'OFF'}</strong>
    </div>
    <h2>Feeds</h2>
    <ul>
      <li><a href="/feed/basic.xml">/feed/basic.xml</a></li>
      <li><a href="/feed/growing.xml">/feed/growing.xml</a></li>
      <li><a href="/feed/flaky.xml">/feed/flaky.xml</a></li>
      <li><a href="/feed/duplicates.xml">/feed/duplicates.xml</a></li>
      <li><a href="/feed/new-from-opml.xml">/feed/new-from-opml.xml</a></li>
    </ul>
    <h2>Controls</h2>
    <ul>
      <li><a href="/control/growing/add">Add Growing Article Three</a></li>
      <li><a href="/control/growing/reset">Reset Growing Feed</a></li>
      <li><a href="/control/flaky/fail">Make Flaky Feed Fail</a></li>
      <li><a href="/control/flaky/ok">Make Flaky Feed Healthy</a></li>
    </ul>
  </body>
</html>`
}

function renderControlResult(message) {
  return `<!doctype html>
<html lang="zh-CN">
  <head><meta charset="utf-8" /><title>Mercury Control</title></head>
  <body>
    <p>${escapeHtml(message)}</p>
    <p><a href="/">Back to test server</a></p>
  </body>
</html>`
}

function sendXml(response, body) {
  response.writeHead(200, { 'Content-Type': 'application/rss+xml; charset=utf-8' })
  response.end(body)
}

function sendHtml(response, body) {
  response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
  response.end(body)
}

function sendText(response, statusCode, body) {
  response.writeHead(statusCode, { 'Content-Type': 'text/plain; charset=utf-8' })
  response.end(body)
}

function escapeXml(value) {
  return escapeHtml(value)
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
