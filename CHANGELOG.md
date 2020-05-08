# waveform-data.js

## v3.3.2 (2020/05/08)

 * Fixed TypeScript declarations (@chrisn)

## v3.3.1 (2020/02/23)

 * Version bump after fixing Travis CI config (@chrisn)

## v3.3.0 (2020/02/23)

 * Removed unnecessary files to reduce size of NPM package (@chrisn)

## v3.2.0 (2020/02/22)

 * (#66) Added TypeScript declarations (@artemkosenko)
 * Improved documentation (@chrisn)

## v3.1.0 (2019/10/23)

 * Added concat() method (@jdelStrother)

## v3.0.0 (2019/08/23)

 * Added support for multi-channel waveforms (@chrisn)
 * Added fromAudioBuffer() method to create waveform from AudioBuffer
   (@davidturissini)
 * This release has some breaking API changes, refer to doc/migration-guide.md
   for details of how to update your code

## v2.1.2 (2018/11/10)

 * Version bump after updating npm access token (@chrisn)

## v2.1.0 (2018/11/10)

 * Move Web Audio based waveform generation to a Web Worker (@semiaddict)
 * Fix audio decode error handling in Safari (@chrisn)

## v2.0.2 (2016/06/07)

 * Allow offset length to be zero (@chrisn)
 * Improved documentation and code examples (@gr2m, @mdesenfants, @chrisn)

## v2.0.1 (2016/03/14)

 * (#42) Fixed multi-channel audio handling in Web Audio builder (@chrisn)
 * Fixed off-by-one error in waveform data generation (@chrisn)
 * Replaced auto-generated ChangeLog (@chrisn)
 * Apply jshint to test code (@chrisn)

## v2.0.0 (2016/12/10)

 * Auto-generate CHANGELOG.md on version bump (@oncletom)
 * (#40) Drop bower support, remove compiled files from git and include them in
   npm package (#40) (@oncletom)
 * (#39) Replace blanket by nyc for code coverage reporting (@oncletom)
 * Use ES2015 syntax for README examples (@oncletom)
 * (#38) Extracted Web Audio builder from the main package (@oncletom)
 * (#37) Callers must now pass in an AudioContext object (@dodds-cc)

## v1.5.3 (2016/09/21)

 * (#36) Moved the project from github.com/bbcrd to github.com/bbc (@oncletom)
 * Added missing npm dependencies (@oncletom)
 * Deploy to npm from Travis CI (@oncletom)
 * Use working blanket module version (@chrisn)

## v1.5.2 (2016/08/05)

 * Allow zero as a valid segment name (@chrisn)

## v1.5.1 (2015/03/14)

 * (#29) Don't let min/max go outside int8 range (@a1k0n)

## v1.5.0 (2015/03/11)

 * (#28) Changed the Web Audio decoder to pass the decoded AudioBuffer (@a1k0n)

## v1.4.4 (2014/10/09)

 * Fixed an include issue (@oncletom)

## v1.4.3 (2014/10/09)

 * Extracted getAudioDecoder function into a separate module (@oncletom)
 * Added tests for Web Audio builder (@oncletom)
 * Allow the user to specify the scale factor in the Web Audio builder, and
   changed the default from 512 to 128 (@chainlink)

## v1.4.2 (2014/09/25)

 * (#25) Added audio-context module to provide access to a singleton
   AudioContext (@oncletom)

## v1.4.1 (2014/09/10)

 * Improved error messages (@oncletom)

## v1.4.0 (2014/06/25)

 * (#6) Generate partial resampled data (@oncletom)

## v1.2.0 (2014/06/03)

 * (#19) Added Points interface (@chainlink)

## v1.1.3 (2014/04/24)

 * (#16) Replaced dense array with normal array in offsetValues method
   (@jonkoops)

## v1.1.2 (2014/01/30)

 * (#9) Fixed XMLHttpRequest handling in WaveformData.create with IE9
   (@oncletom)

## v1.1.1 (2013/10/30)

 * (#3) Added code coverage reporting with mocha-blanket (@oncletom)

## v1.1.0 (2013/10/14)

 * First release (@oncletom)
