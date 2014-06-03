"use strict";

// jshint node:true

module.exports = function (grunt) {

  // Project configuration.
  grunt.initConfig({
    baseName: "waveform-data",
    pkg: grunt.file.readJSON('package.json'),
    banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
      '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
      '<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
      '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
      ' Licensed <%= pkg.license %> */\n',

    uglify: {
      options: {
        banner: "<%= banner %>",
        report: "gzip"
      },
      all:{
        src: "dist/<%= baseName %>.js",
        dest: "dist/<%= baseName %>.min.js"
      },
    },

    jshint: {
      options: {
        jshintrc: ".jshintrc"
      },
      gruntfile: {
        src: [
          "Gruntfile.js",
          "lib/grunt/**/*.js"
        ]
      },
      lib_test: {
        src: [
          "lib/**/*.js",
          "!lib/grunt/**/*.js",
          "test/**/*.js"
        ]
      }
    },

    karma: {
      options: {
        configFile: "karma.conf.js"
      },
      unit: {
        singleRun: true
      },
      debug: {
        background: true
      },
      ci: {
        singleRun: true,
        reporters: ["dots"],
        browsers: ["PhantomJS"]
      }

    },

    jsdoc_md: {
      main: {
        files: {
          "doc/WaveformData.md": "lib/core.js",
          "doc/WaveformDataPoint.md": "lib/point.js",
          "doc/WaveformDataSegment.md": "lib/segment.js",
          "doc/WaveformDataArrayBufferAdapter.md": "lib/adapters/arraybuffer.js",
          "doc/WaveformDataObjectAdapter.md": "lib/adapters/object.js"
        },
        options: {
          filters: [
            function excludePrototypeObject(comment){
              return comment.ctx && comment.ctx.type === "prototype";
            },
            function excludeSingleLineComment(comment){
              return comment.description.full.match(/^[ \t]*(globals|jshint|jslint)/);
            },
            function excludeTypedefTag(comment){
              return comment.tags.some(function(tag){ return tag.type === "typedef"; });
            }
          ]
        }
      }
    },

    watch: {
      gruntfile: {
        files: "<%= jshint.gruntfile.src %>",
        tasks: ["jshint:gruntfile"]
      },
      lib_test: {
        files: "<%= jshint.lib_test.src %>",
        tasks: ["jshint:lib_test", "build", "karma:unit:run"]
      }
    }
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks("grunt-contrib-uglify");
  grunt.loadNpmTasks("grunt-contrib-jshint");
  grunt.loadNpmTasks("grunt-contrib-watch");
  grunt.loadNpmTasks("grunt-jsdoc-md");
  grunt.loadNpmTasks("grunt-karma");

  grunt.registerTask("default", ["test"]);
  grunt.registerTask("test", ["jshint", "karma:ci"]);         //single run
  grunt.registerTask("debug", ["karma:debug", "watch"]);       //continuous debug
};
