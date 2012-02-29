/*global config:true, task:true*/
config.init({
  pkg : '<json:package.json>',

  meta : {
    banner :  '/**\n' +
              '* <%= pkg.title %> - v<%= pkg.version %> - <%= template.today("m/d/yyyy") %>\n' +
              '* <%= pkg.homepage %>\n' +
              '* Copyright (c) <%= template.today("yyyy") %> <%= pkg.authors %>;\n' +
              '* Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %>\n' +
              '*/'
  },

  concat : {
    'dist/miso.ds.js' : [
      '<banner>',
      "src/core.js",
      "src/sync.js",
      "src/view.js",
      "src/dataset.js",
      "src/product.js",
      "src/derived.js",
      "src/importers.js",
      "src/importers/google_spreadsheet.js",
      "src/importers/delimited.js"
    ],

    'dist/miso.ds.deps.js' : [
      '<banner>',
      "lib/moment.js",
      "lib/underscore.js",
      "lib/underscore.math.js",
      "lib/underscore.deferred.js",
      "src/core.js",
      "src/sync.js",
      "src/view.js",
      "src/dataset.js",
      "src/product.js",
      "src/derived.js",
      "src/importers.js",
      "src/importers/google_spreadsheet.js",
      "src/importers/delimited.js"
    ]
  },

  min : {
    'dist/miso.ds.min.js' : [
      '<banner>',
      'dist/miso.ds.js'
    ],

    'dist/miso.ds.deps.min.js' : [
      '<banner>',
      'dist/miso.ds.deps.js'
    ]
  },

  qunit : {
    urls : [ 
      'http://localhost:9292/test/index.html'
    ]
  },

  lint : {
    files : [
      'grunt.js',
      'src/**/*.js',
      'test/unit/**/*.js'
    ]
  },

  watch : {
    files : '<config:lint.files>',
    tasks : 'lint qunit'
  },

  jshint : {
    options : {
      unused: true,
      unuseds: true,
      devel: true,
      noempty: true,
      forin: false,
      evil: true,
      maxerr: 100,
      boss: true,
      curly: true,
      eqeqeq: true,
      immed: true,
      latedef: true,
      newcap: true,
      noarg: true,
      sub: true,
      undef: true,
      eqnull: true,
      browser: true,
      bitwise : true,
      loopfunc: true,
      predef: [ "_", "moment" ]
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
      raises: true
    }
  },

  uglify : {
    "mangle": {
      "except": [ "_", "$", "moment" ]
    },
    "squeeze": {},
    "codegen": {}
  }
});

// Default task.
task.registerTask('default', 'lint qunit concat min');