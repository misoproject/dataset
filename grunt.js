/*global config:true, task:true*/
module.exports = function(grunt) {

  grunt.initConfig({
    pkg : '<json:package.json>',

    meta : {
      banner :  '/**\n' +
                '* <%= pkg.title %> - v<%= pkg.version %> - <%= grunt.template.today("m/d/yyyy") %>\n' +
                '* <%= pkg.homepage %>\n' +
                '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.authors %>;\n' +
                '* Dual Licensed: <%= _.pluck(pkg.licenses, "type").join(", ") %>\n' +
                '*/',

      node :    'var _ = require("underscore");\n' +
                'var moment = require("moment");'
    },

    server : {
      port: 9292,
      base: "."
    },

    concat : {
      "dist/miso.ds.js" : [
        "<banner>",
        "src/types.js",
        "src/sync.js",
        "src/builder.js",
        "src/view.js",
        "src/dataset.js",
        "src/product.js",
        "src/derived.js",
        "src/importer.js",
        "src/importers/local.js",
        "src/importers/remote.js",
        "src/importers/polling.js",
        "src/importers/google_spreadsheet.js",
        "src/parser.js",
        "src/parsers/strict.js",
        "src/parsers/object.js",
        "src/parsers/google_spreadsheet.js",
        "src/parsers/delimited.js"
      ],

      "dist/miso.ds.deps.js" : [
        "<banner>",
        "lib/moment.js",
        "lib/underscore.js",
        "lib/underscore.math.js",
        "lib/underscore.deferred.js",
        "dist/miso.ds.js"
      ],

      // Update to the latest node version
      "node/index.js" : [
        // Need to figure these two out...
        "<banner:meta.node>",
        "lib/underscore.math.js",
        "lib/underscore.deferred.js",
        "dist/miso.ds.js"
      ]
    },

    min : {
      "dist/miso.ds.min.js" : [
        "<banner>",
        "dist/miso.ds.js"
      ],

      "dist/miso.ds.deps.min.js" : [
        "<banner>",
        "dist/miso.ds.deps.js"
      ]
    },

    qunit : {
      urls : [ 
        "http://localhost:9292/test/index.html"
      ]
    },

    lint : {
      files : [
        "grunt.js",
        "src/**/*.js",
        "test/unit/**/*.js"
      ]
    },

    watch : {
      files : "<config:lint.files>",
      tasks : "lint qunit"
    },

    jshint : {
      options : {
        unused : true,
        unuseds : true,
        devel : true,
        noempty : true,
        forin : false,
        evil : true,
        maxerr : 100,
        boss : true,
        curly : true,
        eqeqeq : true,
        immed : true,
        latedef : true,
        newcap : true,
        noarg : true,
        sub : true,
        undef : true,
        eqnull : true,
        browser : true,
        bitwise  : true,
        loopfunc : true,
        predef : [ "_", "moment" ]
      },
      globals : {
        QUnit : true,
        module : true,
        test : true,
        asyncTest : true,
        expect : true,
        ok : true,
        equals : true,
        JSLitmus : true,
        start : true,
        stop : true,
        $ : true,
        strictEqual : true,
        raises : true
      }
    },

    uglify : {
      "mangle" : {
        "except" : [ "_", "$", "moment" ]
      },
      "squeeze" : {},
      "codegen" : {}
    }
  });

  // Default task.
  grunt.registerTask('default', 'lint server qunit concat min');

};
