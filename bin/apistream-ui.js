#!/usr/bin/env node
import express, { static as expressStatic } from 'express';
import { join } from 'path';
import { fileURLToPath } from 'url';
import open from 'open';
import { readConfig } from '../dist/config.js';

const config = await readConfig()

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');
const app = express();
const port = 5174;
app.use(expressStatic(join(__dirname, '../dist/ui')));
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, '../dist/ui/index.html'));
});

app.listen(port, () => {
  const url = `http://localhost:${port}?key=${config.key}`;
  console.log(`Server running at http://localhost:${port}`);
  open(url);
});