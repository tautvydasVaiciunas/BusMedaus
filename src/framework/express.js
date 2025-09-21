import http from 'http';
import { URL } from 'url';

class ResponseWrapper {
  constructor(res) {
    this.res = res;
    this.statusCode = 200;
    this.headersSent = false;
  }

  status(code) {
    this.statusCode = code;
    return this;
  }

  set(name, value) {
    this.res.setHeader(name, value);
    return this;
  }

  json(data) {
    if (!this.headersSent) {
      this.set('Content-Type', 'application/json');
      this.res.statusCode = this.statusCode;
      this.headersSent = true;
    }
    this.res.end(JSON.stringify(data));
  }

  send(data) {
    if (!this.headersSent) {
      this.res.statusCode = this.statusCode;
      this.headersSent = true;
    }
    this.res.end(data);
  }

  end() {
    if (!this.headersSent) {
      this.res.statusCode = this.statusCode;
      this.headersSent = true;
    }
    this.res.end();
  }
}

function compilePath(path) {
  const keys = [];
  const pattern = path
    .split('/')
    .map((segment) => {
      if (segment.startsWith(':')) {
        keys.push(segment.slice(1));
        return '([^/]+)';
      }
      return segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    })
    .join('/');
  const regex = new RegExp(`^${pattern}$`);
  return { regex, keys };
}

function createRequestContext(req) {
  const url = new URL(req.url, 'http://localhost');
  req.path = url.pathname;
  req.query = Object.fromEntries(url.searchParams.entries());
  req.params = {};
  req.body = undefined;
  req.user = null;
  req.metadata = {};
  return req;
}

async function runHandlers(handlers, req, res) {
  let index = 0;
  const next = async (err) => {
    if (err) {
      throw err;
    }
    if (index >= handlers.length) {
      return;
    }
    const handler = handlers[index++];
    await handler(req, res, next);
  };
  await next();
}

export class ExpressApp {
  constructor() {
    this.middlewares = [];
    this.routes = [];
    this.errorHandlers = [];
  }

  use(middleware) {
    this.middlewares.push(middleware);
    return this;
  }

  useError(handler) {
    this.errorHandlers.push(handler);
    return this;
  }

  register(method, path, ...handlers) {
    const { regex, keys } = compilePath(path);
    this.routes.push({ method: method.toUpperCase(), path, handlers, regex, keys });
    return this;
  }

  get(path, ...handlers) {
    return this.register('GET', path, ...handlers);
  }

  post(path, ...handlers) {
    return this.register('POST', path, ...handlers);
  }

  put(path, ...handlers) {
    return this.register('PUT', path, ...handlers);
  }

  patch(path, ...handlers) {
    return this.register('PATCH', path, ...handlers);
  }

  delete(path, ...handlers) {
    return this.register('DELETE', path, ...handlers);
  }

  async handle(req, res) {
    const request = createRequestContext(req);
    const response = new ResponseWrapper(res);

    try {
      await runHandlers(this.middlewares, request, response);

      const route = this.routes.find((candidate) => {
        if (candidate.method !== request.method) {
          return false;
        }
        const match = candidate.regex.exec(request.path);
        if (!match) {
          return false;
        }
        request.params = candidate.keys.reduce((params, key, index) => {
          params[key] = match[index + 1];
          return params;
        }, {});
        return true;
      });

      if (!route) {
        response.status(404).json({ message: 'Not Found' });
        return;
      }

      await runHandlers(route.handlers, request, response);
    } catch (error) {
      if (this.errorHandlers.length > 0) {
        for (const handler of this.errorHandlers) {
          await handler(error, request, response, () => {});
        }
      } else {
        console.error('Unhandled error', error);
        response.status(500).json({ message: 'Internal Server Error' });
      }
    }
  }

  listen(port, callback) {
    const server = http.createServer((req, res) => this.handle(req, res));
    server.listen(port, callback);
    return server;
  }
}

export function express() {
  return new ExpressApp();
}

export default express;
