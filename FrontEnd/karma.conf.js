// FrontEnd/karma.conf.js
module.exports = function (config) {
    config.set({
        browsers: ['ChromeHeadless'],
        customLaunchers: {
            ChromeHeadless: {
            base: 'Chrome',
            flags: [
                '--no-sandbox',
                '--headless',
                '--disable-gpu',
                '--remote-debugging-port=9222'
            ]
            }
        },
        basePath: '',
        frameworks: ['jasmine', '@angular-devkit/build-angular'],
        plugins: [
          require('karma-jasmine'),
          require('karma-chrome-launcher'),
          require('karma-jasmine-html-reporter'),
          require('karma-coverage'),
          require('@angular-devkit/build-angular/plugins/karma')
        ],
        client: {
          jasmine: {
            random: false
          },
          clearContext: false
        },
        jasmineHtmlReporter: {
          suppressAll: true
        },
        coverageReporter: {
          dir: require('path').join(__dirname, '../../coverage/estudio_style'),
          subdir: '.',
          reporters: [
            { type: 'html' },
            { type: 'text-summary' }
          ]
        },
        reporters: ['progress', 'kjhtml'],
        port: 9876,
        colors: true,
        logLevel: config.LOG_INFO,
        autoWatch: true,
        browsers: ['Chrome'],
        singleRun: false,
        restartOnFileChange: true
      });
    };