function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

export async function jsonParser(req, res, next) {
  const methodsWithBody = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
  if (!methodsWithBody.has(req.method)) {
    req.body = {};
    return next();
  }

  try {
    const raw = await readRequestBody(req);
    if (!raw) {
      req.body = {};
    } else {
      req.body = JSON.parse(raw);
    }
    return next();
  } catch (error) {
    return res.status(400).json({ message: 'Invalid JSON payload' });
  }
}

export default jsonParser;
