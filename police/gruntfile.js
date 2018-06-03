module.exports = function(grunt) {
    var options = {
        styles: {
            main: 'dist2/css/main.css'
        },
        scripts: {
            main: 'dist2/js/main.js',
            admin: 'dist2/admin/js/admin.js',
            libs: ['dist2/js/libs.js', 'https://api-maps.yandex.ru/2.1/?lang=ru_RU'],
            libsOnly: ['dist2/js/libs.js'],
            editor: ['dist2/js/common.js', 'admin/js/editor/editor.js']
        },
        beautify: true,
        sections: {
            home : 'html/home.html',
            toolbar: 'html/toolbar.html',
            details: 'html/details.html',
            map: 'html/map.html',
            comments: 'html/comments.html',
            anketa: 'html/anketa.html',
            static: 'html/static.html',
        }
    }
    grunt.initConfig({
        cssmin: {
            options: {
                mergeIntoShorthands: false,
                roundingPrecision: -1
            },
            target: {
                files: {
                    "dist2/css/main.css": [ 'css/fonts.css', 'css/reset.css', 'css/style.css', 'css/police.css', 'css/view.css', 'css/mobile.css']
                }
            }
        },
        uglify: {
            options: {
                beautify: true
            },
            my_target: {
                files: {
                    'dist2/js/main.js': ['js/common/*.js', 'js/*.js'],
                    'dist2/js/common.js': ['js/common/*.js', 'js/api-types.js', 'js/api.js', 'js/db-api.js', 'js/history-api.js', 'js/history-common.js'],
                    'dist2/js/libs.js': ['libs/*.js'],
                    'dist2/admin/js/admin.js': ['admin/js/*.js']
                }
            }
        },
        copy: {
            main: {
                files: [
                    { expand: true, src: ['css/fonts/**'], dest: 'dist2/' },
                    { expand: true, src: ['.htaccess'], dest: 'dist2/' },
                    { expand: true, src: ['*.php'], dest: 'dist2/' },
                    { expand: true, src: ['php/**'], dest: 'dist2/' },
                    { expand: true, src: ['css/libs/**'], dest: 'dist2/' },
                    { expand: true, src: ['css/img/**'], dest: 'dist2/' },
                    { expand: true, src: ['css/img/icons/geo/**'], dest: 'dist2/' },
                    { expand: true, src: ['css/img/icons/new/**'], dest: 'dist2/' },
                    { expand: true, src: ['css/static.css'], dest: 'dist2/' },
                    { expand: true, src: ['css/static-new.css'], dest: 'dist2/' },
                    { expand: true, src: ['css/style.css'], dest: 'dist2/' },
                    { expand: true, src: ['css/pages.css'], dest: 'dist2/' },
                    { expand: true, src: ['css/editor.css'], dest: 'dist2/' },
                    // { expand: true, src: ['data/**'], dest: 'dist2/' },
                    { expand: true, src: ['admin/php/**'], dest: 'dist2/' },
                    { expand: true, src: ['html/info/**'], dest: 'dist2/' },
                    { expand: true, src: ['js/static/**'], dest: 'dist2/' },
                    { expand: true, src: ['libs/**'], dest: 'dist2/' },
                    { expand: true, src: ['js/share.js'], dest: 'dist2/' },
                ],
            },
            mobile: {
                files: [
                    { expand: true, cwd: 'dist2', src: ['**'], dest: 'dist2/mobile/' },
                ]
            },
            data: {
                files: [
                  { expand: true, src: ['data/**'], dest: 'dist2/' },
                ]
            }
        },
        htmlbuild: {
            dist: {
                src: ['*.html'],
                dest: 'dist2/',
                options: options
            },
            admin: {
                src: ['admin/*.html'],
                dest: 'dist2/admin/',
                options: options
            }
        },
        replace: {
            mobilehtml: {
              src: ['dist2/mobile/admin/*.html', 'dist2/mobile/*.html', 'dist2/mobile/*.php', 'dist2/mobile/js/**', 'dist2/mobile/php/**'],
              overwrite: true,                 // overwrite matched source files
              replacements: [{
                from: 'police.html',
                to: 'mobile.html'
              }]
            },
            datapath: {
              src:['dist2/mobile/admin/js/**', 'dist2/mobile/admin/php/**', 'dist2/mobile/js/**'],
              overwrite: true,
              replacements: [{
                from: 'data/',
                to: '../data/'
              }]
            }
          }

    });

    grunt.loadNpmTasks('grunt-contrib-copy');
    //grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-html-build');
    grunt.loadNpmTasks('grunt-text-replace');
    grunt.registerTask('default', ['copy:main', 'uglify', 'cssmin', 'htmlbuild', 'copy:mobile', 'copy:data', 'replace']);
    grunt.registerTask('build', ['htmlbuild']);
    // grunt.registerTask('mobile', ['copy', 'uglify', 'cssmin', 'htmlbuild']);
};
