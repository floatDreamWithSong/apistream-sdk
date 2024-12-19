#!/usr/bin/env node
import { writeFileSync } from 'fs';
writeFileSync('apistream.config.js', 
`
import { defineAPIStreamConfig } from 'apistream-sdk'

export default defineAPIStreamConfig({
    projectName: 'myProject', // unique name for your project
    key: '', // your key to access your apistream server side service
    url: 'http://localhost:8080', // your apistream server side service url
    path: 'apistream/src/', // your apistream clound modules' code path
    output: 'src/apistream/' // path for the code that call your apistream clound modules
})
`);