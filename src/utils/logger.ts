import path from "path";
import fs from "fs";
import { createLogger, format, transports } from "winston";
import "winston-daily-rotate-file";

const logsDir = path.resolve(__dirname, "../../logs");

if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

const transport = new transports.DailyRotateFile({
  filename: path.join(logsDir, "grpc-%DATE%.log"),
  datePattern: "YYYY-MM-DD",
  zippedArchive: true,
  maxSize: "20m",
});

export const logger = createLogger({
  level: "info",
  format: format.combine(
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    format.printf(
      ({ timestamp, level, message }) =>
        `${timestamp} [${level.toUpperCase()}] ${message}`,
    ),
  ),
  transports: [transport, new transports.Console()],
});
