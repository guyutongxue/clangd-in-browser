import * as fs from "node:fs";

if (fs.existsSync('./dist')) {
  fs.rmSync('./dist', { recursive: true });
}

