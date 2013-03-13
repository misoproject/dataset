/* global module */

module.exports = function(grunt) {

  grunt.initConfig({
    pkg : grunt.file.readJSON("package.json"),

    meta : {
      banner :  "/**\n" +
                "* <%= pkg.title %> - v<%= pkg.version %> - <%= grunt.template.today(\"m/d/yyyy\") %>\n" +
                "* <%= pkg.homepage %>\n" +
                "* Copyright (c) <%= grunt.template.today(\"yyyy\") %> <%= pkg.authors %>;\n" +
                "* Dual Licensed: <%= _.pluck(pkg.licenses, \"type\").join(\", \") %>\n" +
                "* https://github.com/misoproject/dataset/blob/master/LICENSE-MIT \n" +
                "* https://github.com/misoproject/dataset/blob/master/LICENSE-GPL \n" +
                "*/",
      lastbuild : "<%= grunt.template.today(\"yyyy/mm/dd hh:ss\") %>"
    },

    node: {
      wrapper: "src/node/compat.js",
      misoLib: "dist/miso.ds.<%= pkg.version %>.js",
      _Math: "lib/underscore.math.js"
    },


    concat : {
      options: {
        banner :  "/**\n" +
                "* <%= pkg.title %> - v<%= pkg.version %> - <%= grunt.template.today(\"m/d/yyyy\") %>\n" +
                "* <%= pkg.homepage %>\n" +
                "* Copyright (c) <%= grunt.template.today(\"yyyy\") %> <%= pkg.authors %>;\n" +
                "* Dual Licensed: <%= _.pluck(pkg.licenses, \"type\").join(\", \") %>\n" +
                "* https://github.com/misoproject/dataset/blob/master/LICENSE-MIT \n" +
                "* https://github.com/misoproject/dataset/blob/master/LICENSE-GPL \n" +
                "*/\n"
      },

      fullnodeps: {
        dest: "dist/miso.ds.<%= pkg.version %>.js",
        src: [
          "<%= meta.banner %>",
          "src/constructor.js",
          "src/view.js",
          "src/dataset.js",
          "src/types.js",
          "src/sync.js",
          "src/builder.js",
          "src/product.js",
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
          "src/derived.js"
        ]
      },

      fullnodepsrequire: {
        dest : "dist/miso.ds.<%= pkg.version %>.m.js",
        src : [
          "dist/miso.ds.<%= pkg.version %>.js",
          "src/require.js"
        ]
      },

      fulldeps: {
        dest : "dist/miso.ds.deps.<%= pkg.version %>.js",
        src : [
          "<%= meta.banner %>",
          "lib/moment.js",
          "lib/lodash.js",
          "lib/underscore.math.js",
          "lib/underscore.deferred.js",
          "lib/miso.events.js",
          "dist/miso.ds.<%= pkg.version %>.js"
        ]
      },

      fulldeps_ie: {
        dest : "dist/miso.ds.deps.ie.<%= pkg.version %>.js",
        src : [
          "<%= meta.banner %>",
          "lib/moment.js",
          "lib/lodash.js",
          "lib/json2.js",
          "lib/underscore.math.js",
          "lib/underscore.deferred.js",
          "lib/miso.events.js",
          "dist/miso.ds.<%= pkg.version %>.js"
        ]
      },

      devnodeps : {
        dest : "dist/development/miso.ds.<%= pkg.version %>.js",
        src : [
          "dist/miso.ds.<%= pkg.version %>.js"
        ]
      },

      "dist/development/lib/moment.js" : [
        "lib/moment.js"
      ],

      "dist/development/lib/lodash.js" : [
        "lib/lodash.js"
      ],

      "dist/development/lib/json2.js" : [
        "lib/json2.js"
      ],

      "dist/development/lib/underscore.math.js" : [
        "lib/underscore.math.js"
      ],

      "dist/development/lib/underscore.deferred.js" : [
        "lib/underscore.deferred.js"
      ],

      "dist/development/lib/miso.events.js" : [
        "lib/miso.events.js"
      ],

      buildstatus : {
        options : {
          banner : "<%= grunt.template.today(\"yyyy/mm/dd hh:ss\") %>"
        },
        dest : "dist/LASTBUILD",
        src : [
          "<%= 'lastbuild' %>"
        ]
      }
    },

    uglify : {
      options: {
         "mangle" : {
          "except" : [ "_", "$", "moment" ]
        },
        "squeeze" : {},
        "codegen" : {},
        banner :  "/**\n" +
                "* <%= pkg.title %> - v<%= pkg.version %> - <%= grunt.template.today(\"m/d/yyyy\") %>\n" +
                "* <%= pkg.homepage %>\n" +
                "* Copyright (c) <%= grunt.template.today(\"yyyy\") %> <%= pkg.authors %>;\n" +
                "* Dual Licensed: <%= _.pluck(pkg.licenses, \"type\").join(\", \") %>\n" +
                "* https://github.com/misoproject/dataset/blob/master/LICENSE-MIT \n" +
                "* https://github.com/misoproject/dataset/blob/master/LICENSE-GPL \n" +
                "*/\n"
      },

      minnodeps : {
        dest : "dist/miso.ds.min.<%= pkg.version %>.js",
        src : [
          "<%= meta.banner %>",
          "dist/miso.ds.<%= pkg.version %>.js"
        ]
      },

      monnodepsrequire : {
        dest : "dist/miso.ds.min.<%= pkg.version %>.m.js",
        src : [
          "<%= meta.banner %>",
          "dist/miso.ds.<%= pkg.version %>.m.js"
        ]
      },

      mindeps : {
        dest : "dist/miso.ds.deps.min.<%= pkg.version %>.js",
        src : [
          "<%= meta.banner %>",
          "dist/miso.ds.deps.<%= pkg.version %>.js"
        ]
      },

      mindeps_ie : {
        dest : "dist/miso.ds.deps.ie.min.<%= pkg.version %>.js",
        src : [
          "<%= meta.banner %>",
          "dist/miso.ds.deps.ie.<%= pkg.version %>.js"
        ]
      }
    },

    compress : {
      development : {
        options: {
          mode : "zip",
          archive: "dist/miso.ds.dev.<%= pkg.version %>.zip"
        },
        files : [
          {
            cwd: "dist/development",
            src : ["**"],
            expand: true,
            dest: "development"
          }
        ]
      }
    },

    clean : [
      "dist/development"
    ],

    qunit : {
      all : {
        options : {
          urls : [
            "http://localhost:9292/test/index.html"
          ]
        }
      }
    },

    watch : {
      files : "<config:lint.files>",
      tasks : "lint qunit"
    },

    jshint : {
      options : {
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
        predef : [ "_", "moment", "log", "template", "exports", "define" ],
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
    }
  });

  grunt.loadNpmTasks("grunt-contrib-watch");
  grunt.loadNpmTasks("grunt-contrib-uglify");
  grunt.loadNpmTasks("grunt-contrib-jshint");
  grunt.loadNpmTasks("grunt-contrib-copy");
  grunt.loadNpmTasks("grunt-contrib-less");
  grunt.loadNpmTasks("grunt-contrib-connect");
  grunt.loadNpmTasks("grunt-contrib-jst");
  grunt.loadNpmTasks("grunt-contrib-concat");
  grunt.loadNpmTasks("grunt-contrib-compress");
  grunt.loadNpmTasks("grunt-contrib-clean");
  grunt.loadNpmTasks("grunt-contrib-qunit");

  // Task specific for building Node compatible version
  grunt.registerTask("node", function() {

    var nodeConfig = grunt.config("node");
    var read = grunt.file.read;

    var output = grunt.template.process(read(nodeConfig.wrapper), {
      data : {
        underscoreMath: read(nodeConfig._Math),
        misoDataSet: read(grunt.template.process(nodeConfig.misoLib))
      }
    });

    // Write the contents out
    grunt.file.write("dist/node/miso.ds.deps." +
        grunt.template.process(grunt.config("pkg").version) + ".js",
      output);
  });

  // Default task.
  grunt.registerTask("default", ["jshint", "qunit", "concat", "uglify", "compress", "node", "clean"]);
};
