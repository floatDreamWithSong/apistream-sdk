#!/usr/bin/env node
import { initApiStream } from "../dist/main.js";
import { readConfig } from "../dist/config.js";
await initApiStream(await readConfig());