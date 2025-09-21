const levels = ["debug", "info", "warn", "error"];

function formatMessage(level, message, context) {
  const time = new Date().toISOString();
  const base = `[${time}] [${level.toUpperCase()}] ${message}`;
  if (!context) {
    return base;
  }
  try {
    return `${base} ${JSON.stringify(context)}`;
  } catch (err) {
    return `${base} ${context}`;
  }
}

class Logger {
  constructor({ level = "info" } = {}) {
    this.levelIndex = Math.max(0, levels.indexOf(level));
  }

  log(level, message, context) {
    const idx = levels.indexOf(level);
    if (idx < this.levelIndex) {
      return;
    }
    const line = formatMessage(level, message, context);
    if (level === "error") {
      console.error(line);
    } else if (level === "warn") {
      console.warn(line);
    } else {
      console.log(line);
    }
  }

  debug(message, context) {
    this.log("debug", message, context);
  }

  info(message, context) {
    this.log("info", message, context);
  }

  warn(message, context) {
    this.log("warn", message, context);
  }

  error(message, context) {
    this.log("error", message, context);
  }
}

module.exports = { Logger };
