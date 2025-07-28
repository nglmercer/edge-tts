#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SynthesizeCommand_1 = require("../commands/SynthesizeCommand");
const VoiceListCommand_1 = require("../commands/VoiceListCommand");
const commander_1 = require("commander");
const program = new commander_1.Command();
program
    .version('1.3.1')
    .addCommand(SynthesizeCommand_1.SynthesizeCommand)
    .addCommand(VoiceListCommand_1.VoiceListCommand);
try {
    program.parse();
}
catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
}
