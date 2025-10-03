// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'
import 'whatwg-fetch'

// Polyfill Response.json for Next.js edge runtime
if (!global.Response.json) {
  global.Response.json = function(body, init) {
    return new Response(JSON.stringify(body), {
      ...init,
      headers: {
        'content-type': 'application/json',
        ...init?.headers,
      },
    });
  };
}
