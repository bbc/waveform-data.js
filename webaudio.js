"use strict";

var webAudioBuilder = require("./lib/builders/webaudio");
var fromAudioBuffer = require("./lib/builders/audiobuffer");


webAudioBuilder.fromAudioBuffer = fromAudioBuffer;

module.exports = webAudioBuilder;
