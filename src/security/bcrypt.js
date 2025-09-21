import { spawn } from 'child_process';

function runPython(script, args) {
  return new Promise((resolve, reject) => {
    const child = spawn('python3', ['-c', script, ...args], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });

    child.on('error', reject);

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Python process failed: ${stderr || code}`));
      } else {
        resolve(stdout.trim());
      }
    });
  });
}

export async function hashPassword(password) {
  const script = `import sys, crypt\npassword = sys.argv[1]\nsalt = crypt.mksalt(crypt.METHOD_BLOWFISH)\nprint(crypt.crypt(password, salt), end='')`;
  return runPython(script, [password]);
}

export async function verifyPassword(password, hashed) {
  const script = `import sys, crypt\npassword = sys.argv[1]\nhashed = sys.argv[2]\nprint('1' if crypt.crypt(password, hashed) == hashed else '0', end='')`;
  const result = await runPython(script, [password, hashed]);
  return result === '1';
}

export default {
  hashPassword,
  verifyPassword,
};
