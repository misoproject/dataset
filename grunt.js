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
                '* https://github.com/misoproject/dataset/blob/master/LICENSE-MIT \n' +
                '* https://github.com/misoproject/dataset/blob/master/LICENSE-GPL \n' +
                '*/',
      lastbuild : '<%= grunt.template.today("yyyy/mm/dd hh:ss") %>'
    },

    node: {
      wrapper: "src/node/compat.js",
      misoLib: "dist/miso.ds.<%= pkg.version %>.js",
      _Math: "lib/underscore.math.js"
    },


    concat : {
      fullnodeps: {
        dest: "dist/miso.ds.<%= pkg.version %>.js",
        src: [
          "<banner>",
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
          "<banner>",
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
          "<banner>",
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
        dest : "dist/LASTBUILD",
        src : [
          "<banner:meta.lastbuild>"
        ]
      }
    },

    min : {
      minnodeps : {
        dest : "dist/miso.ds.min.<%= pkg.version %>.js",
        src : [
          "<banner>",
          "dist/miso.ds.<%= pkg.version %>.js" 
        ]
      },

      monnodepsrequire : {
        dest : "dist/miso.ds.min.<%= pkg.version %>.m.js",
        src : [
          "<banner>",
          "dist/miso.ds.<%= pkg.version %>.m.js"
        ]
      },

      mindeps : {
        dest : "dist/miso.ds.deps.min.<%= pkg.version %>.js",
        src : [
          "<banner>",
          "dist/miso.ds.deps.<%= pkg.version %>.js" 
        ]
      },

      mindeps_ie : {
        dest : "dist/miso.ds.deps.ie.min.<%= pkg.version %>.js",
        src : [
          "<banner>",
          "dist/miso.ds.deps.ie.<%= pkg.version %>.js" 
        ]
      }
    },

    zip: {
      development: {
        cwd : 'dist',
        src: 'development',
        dest: 'miso.ds.dev.<%= pkg.version %>.zip',
        deletesrc : true
      }
    },

    rm : [
      "dist/development"
    ],

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
        predef : [ "_", "moment", "log", "template", "exports", "define" ]
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

  // task specific to zipping up file for development purposes.
  // taken from jQuery-ui 
  // https://github.com/jquery/jquery-ui/blob/2865a629871b1534b6e32418137f5d249da6f7fb/grunt.js#L298
  grunt.registerTask('zip', 'Create a zip file for release', function() {
    var done = this.async();
    var zipConfig = grunt.config("zip");
    var filesLen = Object.keys(zipConfig).length;
    var filesZipped = 0;

    Object.keys(zipConfig).forEach(function(key) {
      var conf = zipConfig[key];
      grunt.utils.spawn({
        cmd: "zip",
        args: ["-r", grunt.template.process(conf.dest), conf.src],
        opts : {
          cwd : conf.cwd
        }
      }, function(err, result, code) {
        // handle error
        if (err) {
          grunt.log.error(err);
          done();
          return;
        } 

        grunt.log.writeln("Zipped " + conf.cwd + "/" + grunt.template.process(conf.dest));
        
        // increment counter
        filesZipped+=1;

        if (filesZipped === filesLen) {
          done();
        }
      });
    });
  
  });

  // remove files.
  grunt.registerTask("rm", function() {
    var done = this.async();
    var rmConfig = grunt.config("rm");
    var filesRemoved = 0;
    for (var i = 0; i < rmConfig.length; i++) {
      var file = rmConfig[i];
      
      grunt.utils.spawn({
        cmd : 'rm',
        args : ["-rf", file]
      }, function(err, result) {

        if (err) {
          grunt.log.error(err);
          done();
          return;
        }
        grunt.log.writeln("Removed: " + file);

        filesRemoved+=1;

        if (filesRemoved === rmConfig.length) {
          done();
        }
      });
    }
  });

  // Task specific for building Node compatible version
  grunt.registerTask('node', function() {
    var nodeConfig = grunt.config("node");
    var read = grunt.file.read;

    var output = grunt.template.process(read(nodeConfig.wrapper), {
      underscoreMath: read(nodeConfig._Math),
      misoDataSet: read(grunt.template.process(nodeConfig.misoLib))
    });

    // Write the contents out
    grunt.file.write("dist/node/miso.ds.deps." + grunt.template.process(grunt.config("pkg").version) + ".js", output);
  });

  // Default task.
  grunt.registerTask('default', 'lint qunit concat min zip node rm');
};
