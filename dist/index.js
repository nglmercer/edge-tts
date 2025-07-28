"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FORMAT_CONTENT_TYPE = exports.ALL_AUDIO_FORMATS = exports.EdgeTTS = void 0;
var EdgeTTS_1 = require("./services/EdgeTTS");
Object.defineProperty(exports, "EdgeTTS", { enumerable: true, get: function () { return EdgeTTS_1.EdgeTTS; } });
var formats_1 = require("./config/formats");
Object.defineProperty(exports, "ALL_AUDIO_FORMATS", { enumerable: true, get: function () { return formats_1.ALL_AUDIO_FORMATS; } });
Object.defineProperty(exports, "FORMAT_CONTENT_TYPE", { enumerable: true, get: function () { return formats_1.FORMAT_CONTENT_TYPE; } });
