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
                '*/'
    },

    node: {
      wrapper: "src/node/compat.js",
      misoLib: "dist/miso.ds.js",
      _Math: "lib/underscore.math.js"
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
        "src/parsers/delimited.js",
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

  // Task specific for building Node compatible version
  grunt.registerTask('node', function() {
    var nodeConfig = grunt.config("node");
    var read = grunt.file.read;

    var output = grunt.template.process(read(nodeConfig.wrapper), {
      underscoreMath: read(nodeConfig._Math),
      misoDataSet: read(nodeConfig.misoLib)
    });

    // Write the contents out
    grunt.file.write("dist/node/miso.ds.deps.js", output);
  });

  // Default task.
  grunt.registerTask('default', 'lint qunit concat min node');
};
