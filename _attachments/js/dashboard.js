/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var report_type_mappings = {
  'firefox-functional' : 'functional',
  'firefox-update' : 'update',
  'firefox-l10n' : 'l10n',
  'firefox-endurance' : 'endurance',
  'firefox-remote' : 'remote',
  'firefox-addons' : 'addons',

  'mozmill-test' : 'functional',
  'mozmill-restart-test' : 'functional'
};


/**
 * Distinguish title for usability and bookmarking
 */
function buildTitle() {
  // Always return nothing if we don't find a match
  var domainTitle = "";

  // Get the real domain for comparison
  var domainActual = document.domain;

  // Loop through the domain ids above to see if we have a match
  for (var i = 0; i < DASHBOARD_SERVERS.length; i++) {
    var domainUrl = DASHBOARD_SERVERS[i].urlVal;

    // If we have a match return the title, if we don't we fallback to value in index.html
    if (domainUrl === domainActual) {
      var domainTitle = "Mozmill" + " " + DASHBOARD_SERVERS[i].titleId + " " + "Results Dashboard";
      break;
    }
  }
  return domainTitle;
}


/**
 * Process all results of a test method and build list with failure information
 *
 * @param {Object} aTestResults Results of a test method
 * @returns {[Object]} Array of failure information
 */
function processTestResults(aReport) {
  var report_type = report_type_mappings[aReport.report_type];
  var results = [ ];

  for (var i = 0; i < aReport.results.length; i++) {
    var result = aReport.results[i];
    var info = [ ];

    // Split absolute path and only keep the relative path below the test-run folder
    var parts = result.filename.split(report_type)
    var filename = parts[parts.length - 1].replace(/\\/g, '/');

    var repository_url = TESTS_REPOSITORY + '/file/' +
                         aReport.tests_changeset + '/firefox/tests/' +
                         report_type + filename;

    var status = "passed";
    if (result.skipped)
      status = "skipped";
    else if (result.failed)
      status = "failed";

    // Test has been skipped
    if (result.skipped) {
      var message = result.skipped_reason;
      var re = /Bug ([\d]+)/g.exec(message);
      if (re) {
        var tmpl = '<a href="https://bugzilla.mozilla.org/show_bug.cgi?id=%s">Bug %s</a>';
        var link = tmpl.replace(/\%s/g, re[1]);
        message = message.replace(re[0], link);
      }

      info.push({message: message});
    }
    // Test has been failed
    else if (result.fails) {
      for (var j = 0; j < result.fails.length; j++) {
        var failure = result.fails[j];
        var message = "Unknown Failure";
        var stack = null;

        if ("exception" in failure) {
          // An exception has been thrown
          message = failure.exception.message;
          stack = failure.exception.stack;
        }
        else if ("fail" in failure) {
          // An assertion failed
          message = failure.fail.message;
          if ("stack" in failure.fail) {
            stack = JSON.stringify(failure.fail.stack);
          }
        }
        else if ("message" in failure) {
          // A plain JS error has been reported
          message = failure.message;
        }

        info.push({message: message, stack: stack});
      }
    }

    results.push({
      repository_url : repository_url,
      filename : filename,
      test : result.name,
      status : status,
      info: info
    });
  }

  return results;
}


(function($) {

  var request = function (options, callback) {
    options.success = function (obj) {
      callback(null, obj);
    }

    options.error = function (err) {
      if (err) callback(err);
      else callback(true);
    }

    options.dataType = 'json';
    $.ajax(options)
  }

  var app = $.sammy(function () {
    var domain = window.location.protocol + "//" + window.location.hostname;

    this.use('Mustache');

    function setFilters() {

      var filters = [
        { link : "#all", match : "#result tbody tr" },
        { link : "#passed", match : "#result tr.passed" },
        { link : "#failed", match : "#result tr.failed" },
        { link : "#skipped", match : "#result tr.skipped" }
      ];

      filters.forEach(function (filter) {
        $(filter.link).click(function (event) {
          $('#filter a').removeClass('selected');
          $(filter.link).addClass('selected');
          $('#result tbody tr').hide();
          $(filter.match).show();
          $('#noresults').remove();
          if ($('#result tbody tr:visible').length === 0) {
            $('#result tbody').append('<tr id="noresults">' +'<td colspan="' +
            $('#result tr th').length +
            '">No results match the current filter.</td></tr>');
          }
          event.preventDefault();
        });
      });

      // apply the failed filter by default
      $("#failed").click();
    }

    var functional_reports = function() {
      var branch = this.params.branch ? this.params.branch : 'All';
      var platform = this.params.platform ? this.params.platform : 'All';

      var fromDate;
      if (this.params.from) {
        fromDate = new Date(this.params.from);
      }
      else {
        fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - 3);
      }

      var toDate;
      if (this.params.to) {
        toDate = new Date(this.params.to);
      }
      else {
        toDate = new Date();
      }

      var query = {
        startkey: JSON.stringify([branch, platform, toDate.format() + "T23:59:59"]),
        endkey: JSON.stringify([branch, platform, fromDate.format() + "T00:00:00"]),
        descending: "true"
      };

      var context = this;
      this.firefox_versions = FIREFOX_VERSIONS;
      request({url: '/_view/functional_reports?' + $.param(query)}, function (err, resp) {
        if (err) window.alert(err);

        context.reports = [ ];
        resp.rows.forEach(function (report) {
          var value = report.value;
          value.report_link = "#/functional/report/" + report.id;
          value.time_start = new Date(value.time_start).toISOString();
          context.reports.push(value);
        })

        var template = '/templates/functional_reports.mustache';
        context.render(template).replace('#content').then(function () {

          $('#branch-selection span').each(function (i, elem) {
            if (elem.textContent == branch) {
              $(elem).addClass("selected")
            }
          })

          $('#branch-selection span').click(function () {
            window.location = '/#/functional/reports?branch=' + this.textContent +
                              '&platform=' + platform + '&from=' + $("#start-date").val() +
                              '&to=' + $("#end-date").val();
          })

          $('#os-selection span').each(function (i, elem) {
            if (elem.textContent == platform) {
              $(elem).addClass("selected")
            }
          })

          $('#os-selection span').click(function () {
            window.location = '/#/functional/reports?branch=' + branch +
                              '&platform=' + this.textContent +
                              '&from=' + $("#start-date").val() +
                              '&to=' + $("#end-date").val()
          })

          $(".datepicker").datepicker();
          $(".datepicker").datepicker("option", "dateFormat", "yy-mm-dd");

          $('#start-date').datepicker().val(fromDate.format()).trigger('change');
          $('#end-date').datepicker().val(toDate.format()).trigger('change');

          $(".datepicker").change(function() {
            window.location = '/#/functional/reports?branch=' + branch + "&platform=" + platform +
                              '&from=' + $("#start-date").val() +
                              '&to=' + $("#end-date").val();
          })

          $("#results").tablesorter({
            // sort on the first column and third column, order asc
            sortList: [[0,1]]
          });

        });
      });

      $(".selection").change(function() {
        window.location = this.value;
      });
    }

    var functional_failure = function() {
      var context = this;
      this.firefox_versions = FIREFOX_VERSIONS;

      var branch = this.params.branch ? this.params.branch : 'All';
      var platform = this.params.platform ? this.params.platform : 'All';
      var test = this.params.test ? this.params.test : {};
      var test_func = this.params.func ? this.params.func : {};

      var fromDate;
      if (this.params.from) {
        fromDate = new Date(this.params.from);
      }
      else {
        fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - 7);
      }

      var toDate;
      if (this.params.to) {
        toDate = new Date(this.params.to);
      }
      else {
        toDate = new Date();
      }

      var query = {
        startkey : JSON.stringify([branch, platform, test, toDate.format() + "T23:59:59"]),
        endkey : JSON.stringify([branch, platform, test, fromDate.format() + "T00:00:00"]),
        descending : true
      };

      request({url:'/_view/functional_failures?'+$.param(query)}, function (err, resp) {
        if (err) console.og(err);

        context.reports = [ ];
        context.test_module = test;
        context.test_function = test_func;
        resp.rows.forEach(function (row) {
          var value = row.value;

          if (test_func == {} || value.test_function == test_func) {
            value.time_start = new Date(row.key[3]).toISOString();
            value.report_link = "#/functional/report/" + row.id;

            context.reports.push(value);
          }
        });

        var template = '/templates/functional_failure.mustache';
        context.render(template).replace('#content').then(function () {

          $('#branch-selection span').each(function (i, elem) {
            if (elem.textContent == branch) {
              $(elem).addClass("selected")
            }
          })
          $('#branch-selection span').click(function () {
            window.location = '/#/functional/failure?branch=' + this.textContent +
                              '&platform=' + platform + '&from=' + fromDate.format() +
                              '&to=' + toDate.format() + "&test=" +
                              encodeURIComponent(test) + '&func=' + encodeURIComponent(test_func);
          })

          $('#os-selection span').each(function (i, elem) {
            if (elem.textContent == platform) {
              $(elem).addClass("selected")
            }
          })
          $('#os-selection span').click(function () {
            window.location = '/#/functional/failure?branch=' + branch +
                              '&platform=' + this.textContent + '&from=' + fromDate.format() +
                              '&to=' + toDate.format() + "&test=" +
                              encodeURIComponent(test) + '&func=' + encodeURIComponent(test_func);
          })

          $(".datepicker").datepicker();
          $(".datepicker").datepicker("option", "dateFormat", "yy-mm-dd");

          $('#start-date').datepicker().val(fromDate.format()).trigger('change');
          $('#end-date').datepicker().val(toDate.format()).trigger('change');

          $(".datepicker").change(function() {
            window.location = '/#/functional/failure?branch=' + branch + "&platform=" + platform +
                              '&from=' + $("#start-date").val() +
                              '&to=' + $("#end-date").val() + "&test=" +
                              encodeURIComponent(test) + '&func=' + encodeURIComponent(test_func);
          })

          $("#subtitle").text("Top Failures");

          $("#results").tablesorter({
            // sort on the first column and third column, order asc
            sortList: [[3,1]]
          });
        });
      });

      $(".selection").change(function() {
        window.location = this.value;
      });
    }

    var functional_topFailures = function () {
      var context = this;
      this.firefox_versions = FIREFOX_VERSIONS;

      var branch = this.params.branch ? this.params.branch : 'All';
      var platform = this.params.platform ? this.params.platform : 'All';

      var fromDate;
      if (this.params.from) {
        fromDate = new Date(this.params.from);
      }
      else {
        fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - 7);
      }

      var toDate;
      if (this.params.to) {
        toDate = new Date(this.params.to);
      }
      else {
        toDate = new Date();
      }

      var query = {
        startkey : JSON.stringify([branch, platform, 'All', toDate.format() + "T23:59:59"]),
        endkey : JSON.stringify([branch, platform, 'All', fromDate.format()]),
        descending : true
      };

      request({url:'/_view/functional_failures?'+$.param(query)}, function (err, resp) {
        if (err) window.alert(err);

        // Build up the failures array
        var failures = [ ];
        resp.rows.forEach(function (row) {
          var v = row.value;
          var k = row.key;

          var index = v.test_module + "|" + v.test_function + "|" + v.application_branch + "|" + v.system_name;
          if (index in failures) {
            failures[index]++;
          } else {
            failures[index] = 1;
          }
        });

        context.reports = [ ];
        for (var key in failures) {
          var entries = key.split("|");
          context.reports.push({
            test_module : entries[0],
            test_function : entries[1],
            application_branch : entries[2],
            system_name : entries[3],
            failure_link : '/#/functional/failure?branch=' + entries[2] + "&platform=" +
                           entries[3] + '&from=' + fromDate.format() +
                          '&to=' + toDate.format() + "&test=" +
                          encodeURIComponent(entries[0]) + "&func=" +
                          encodeURIComponent(entries[1]),
            failure_count : failures[key]
          });
        };

        var template = '/templates/functional_failures.mustache';
        context.render(template).replace('#content').then(function () {

          $('#branch-selection span').each(function (i, elem) {
            if (elem.textContent == branch) {
              $(elem).addClass("selected")
            }
          })
          $('#branch-selection span').click(function () {
            window.location = '/#/functional/top?branch=' + this.textContent + "&platform=" + platform +
                              '&from=' + $("#start-date").val() +
                              '&to=' + $("#end-date").val();
          })

          $('#os-selection span').each(function (i, elem) {
            if (elem.textContent == platform) {
              $(elem).addClass("selected")
            }
          })
          $('#os-selection span').click(function () {
            window.location = '/#/functional/top?branch=' + branch + "&platform=" + this.textContent +
                              '&from=' + $("#start-date").val() +
                              '&to=' + $("#end-date").val();
          })

          $(".datepicker").datepicker();
          $(".datepicker").datepicker("option", "dateFormat", "yy-mm-dd");

          $('#start-date').datepicker().val(fromDate.format()).trigger('change');
          $('#end-date').datepicker().val(toDate.format()).trigger('change');

          $(".datepicker").change(function() {
            window.location = '/#/functional/top?branch=' + branch + "&platform=" + platform +
                              '&from=' + $("#start-date").val() +
                              '&to=' + $("#end-date").val();
          })

          $("#subtitle").text("Top Failures");

          $("#results").tablesorter({
            // sort on the first column and third column, order asc
            sortList: [[4,1], [0,1], [1,1]]
          });

        });
      });

      $(".selection").change(function() {
        window.location = this.value;
      });
    }

    function functional_report() {
      var context = this;

      var id = this.params.id ? this.params.id : 'null';
      var template = '/templates/functional_report.mustache';

      request({url: '/db/' + id}, function (err, resp) {
        if (err) window.alert(err);

        context.id = resp._id;
        context.domain = domain;
        context.app_name = resp.application_name;
        context.app_version = resp.application_version;
        context.platform_version = resp.platform_version;
        context.platform_buildId = resp.platform_buildid;
        context.app_locale = resp.application_locale;
        context.app_sourcestamp = resp.application_repository + "/rev/" + resp.application_changeset;
        context.addonsIncluded = 'addons' in resp;
        if (context.addonsIncluded) {
          context.extensions = resp.addons.filter(function (item) { return (item.type === "extension") });
          context.themes = resp.addons.filter(function (item) { return (item.type === "theme") });
          context.plugins = resp.addons.filter(function (item) { return (item.type === "plugin") });
        }
        context.system = resp.system_info.system;
        context.system_version = resp.system_info.version;
        context.service_pack = resp.system_info.service_pack;
        context.cpu = resp.system_info.processor;
        context.time_start = resp.time_start;
        context.time_end = resp.time_end;
        context.passed = resp.tests_passed;
        context.failed = resp.tests_failed;
        context.skipped = resp.tests_skipped;
        context.mozmill_version = resp.mozmill_version || "n/a";
        context.results = processTestResults(resp);

        context.render(template).replace('#content').then(function () {
          $("#result").tablesorter();

          setFilters();

          $("#subtitle").text("Report Details");

          $(".selection").change(function() {
            window.location = this.value;
          });
        });
      });
    }

    var update_overview = function () {
      var context = this;
      this.firefox_versions = FIREFOX_VERSIONS;
      this.update_channels = UPDATE_CHANNELS;

      var branch = this.params.branch || 'All';
      var channel = this.params.channel || 'All';

      var fromDate;
      if (this.params.from) {
        fromDate = new Date(this.params.from);
      }
      else {
        fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - 7);
      }

      var toDate;
      if (this.params.to) {
        toDate = new Date(this.params.to);
      }
      else {
        toDate = new Date();
      }

      var query = {
        startkey : JSON.stringify([branch, channel, 'All', 'All', toDate.format() + "T23:59:59"]),
        endkey : JSON.stringify([branch, channel, 'All', 'All', fromDate.format() + "T00:00:00"]),
        descending : true
      };

      request({url:'/_view/update_default?'+$.param(query)}, function (err, resp) {
        if (err) window.alert(err);

        // Build up the updates array
        var updates = [ ];
        resp.rows.forEach(function (row) {
          var v = row.value;
          var k = row.key;

          var index = v.post_build + "|" + v.pre_build + "|" + v.channel;
          var failed = (v.tests_failed > 0 || v.tests_passed == 0) ? 1 : 0;
          if (index in updates) {
            updates[index].testruns += 1;
            updates[index].failures += failed;
          }
          else {
            updates[index] = {
              testruns : 1,
              failures : failed
            };
          }
        });

        context.updates = [ ];
        for (var key in updates) {
          var entries = key.split("|");
          context.updates.push({
            post_build : entries[0],
            pre_build : entries[1],
            channel: entries[2],
            testrun_count : updates[key].testruns,
            failure_count : updates[key].failures,
            detail_url : '/#/update/detail?branch=' + branch + "&channel=" +
                         entries[2] + '&from=' + fromDate.format() +
                         '&to=' + toDate.format() + "&target=" +
                         encodeURIComponent(entries[0])
          });
        };

        var template = '/templates/update_overview.mustache';
        context.render(template).replace('#content').then(function () {

          $('#branch-selection span').each(function (i, elem) {
            if (elem.textContent == branch) {
              $(elem).addClass("selected")
            }
          })
          $('#branch-selection span').click(function () {
            window.location = '/#/update/overview?branch=' + this.textContent + "&channel=" + channel +
                              '&from=' + $("#start-date").val() +
                              '&to=' + $("#end-date").val();
          })

          $('#channel-selection span').each(function (i, elem) {
            if (elem.textContent == channel) {
              $(elem).addClass("selected")
            }
          })
          $('#channel-selection span').click(function () {
            window.location = '/#/update/overview?branch=' + branch + "&channel=" + this.textContent +
                              '&from=' + $("#start-date").val() +
                              '&to=' + $("#end-date").val();
          })

          $(".datepicker").datepicker();
          $(".datepicker").datepicker("option", "dateFormat", "yy-mm-dd");

          $('#start-date').datepicker().val(fromDate.format()).trigger('change');
          $('#end-date').datepicker().val(toDate.format()).trigger('change');

          $(".datepicker").change(function() {
            window.location = '/#/update/overview?branch=' + branch + "&channel=" + channel +
                              '&from=' + $("#start-date").val() +
                              '&to=' + $("#end-date").val();
          })

          $("#results").tablesorter({
            // sort on the first column and third column, order asc
            sortList: [[4,1]]
          });

        });
      });

      $(".selection").change(function() {
        window.location = this.value;
      });
    }

    var update_detail = function () {
      var context = this;
      this.firefox_versions = FIREFOX_VERSIONS;
      this.update_channels = UPDATE_CHANNELS;

      var branch = this.params.branch || 'All';
      var channel = this.params.channel || 'All';
      var target = this.params.target || 'n/a';

      var fromDate;
      if (this.params.from) {
        fromDate = new Date(this.params.from);
      }
      else {
        fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - 7);
      }

      var toDate;
      if (this.params.to) {
        toDate = new Date(this.params.to);
      }
      else {
        toDate = new Date();
      }

      var query = {
        startkey : JSON.stringify([branch, channel, 'All', target, toDate.format() + "T23:59:59"]),
        endkey : JSON.stringify([branch, channel, 'All', target, fromDate.format() + "T00:00:00"]),
        descending : true,
        include_docs: true
      };

      request({url:'/_view/update_default?'+$.param(query)}, function (err, resp) {
        if (err) window.alert(err);

        var platforms = [ ];
        var versions = [ ];

        resp.rows.forEach(function (row) {
          var v = row.value;
          var k = row.key;

          // List of tested platforms for table header
          var platform = v.system_name + " " + v.system_version;
          if (platforms.indexOf(platform) == -1)
            platforms.push(platform);

          // List of tested versions
          if (versions.indexOf(v.pre_build) == -1) {
            versions.push(v.pre_build);
          }
        });

        // Sort platforms alphabetically
        platforms = platforms.sort();

        // Prepare map for matrix
        var data = new Array(versions.length);
        for (var i = 0; i < versions.length; i++) {
          data[i] = { "version" : versions[i] };
          data[i]["platform"] = new Array(platforms.length);
          for (var j = 0; j < platforms.length; j++) {
            data[i]["platform"][j] = { "platform" : platforms[j] };
            data[i]["platform"][j]["builds"] = [ ];
          }
        }

        // Populate matrix with builds
        resp.rows.forEach(function (row) {
          var v = row.value;
          var k = row.key;
          var doc = row.doc;

          var platform = v.system_name + " " + v.system_version;

          var index_platform = platforms.indexOf(platform);
          var index_version = versions.indexOf(v.pre_build);

          var builds = data[index_version]["platform"][index_platform]["builds"];
          builds.push({
            "locale" : v.application_locale,
            "updates" : doc.updates,
            "report_link" : "#/update/report/" + row.id
          });
        });

        context.channel = channel;
        context.post_build = target;
        context.platforms = platforms;
        context.data = data;

        var template = '/templates/update_detail.mustache';
        context.render(template).replace('#content').then(function () {

          $('#channel-selection span').each(function (i, elem) {
            if (elem.textContent == channel) {
              $(elem).addClass("selected")
            }
          })
          $('#channel-selection span').click(function () {
            window.location = '/#/update/detail?branch=' + branch + "&channel=" + this.textContent +
                              '&from=' + $("#start-date").val() +
                              '&to=' + $("#end-date").val() + "&target=" + target;
          })

          $(".datepicker").datepicker();
          $(".datepicker").datepicker("option", "dateFormat", "yy-mm-dd");

          $('#start-date').datepicker().val(fromDate.format()).trigger('change');
          $('#end-date').datepicker().val(toDate.format()).trigger('change');

          $(".datepicker").change(function() {
            window.location = '/#/update/detail?branch=' + branch + "&channel=" + channel +
                              '&from=' + $("#start-date").val() +
                              '&to=' + $("#end-date").val() + "&target=" + target;
          })

          $("#results").tablesorter({
            // sort on the first column and third column, order asc
            sortList: [[0,1]]
          });

        });
      });

      $(".selection").change(function() {
        window.location = this.value;
      });
    }

    var update_reports = function() {
      var branch = this.params.branch ? this.params.branch : 'All';
      var platform = this.params.platform ? this.params.platform : 'All';

      var fromDate;
      if (this.params.from) {
        fromDate = new Date(this.params.from);
      }
      else {
        fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - 3);
      }

      var toDate;
      if (this.params.to) {
        toDate = new Date(this.params.to);
      }
      else {
        toDate = new Date();
      }

      var query = {
        startkey: JSON.stringify([branch, platform, toDate.format() + "T23:59:59"]),
        endkey: JSON.stringify([branch, platform, fromDate.format() + "T00:00:00"]),
        descending: "true"
      };

      var context = this;
      this.firefox_versions = FIREFOX_VERSIONS;
      request({url: '/_view/update_reports?' + $.param(query)}, function (err, resp) {
        if (err) window.alert(err);

        context.reports = [ ];
        resp.rows.forEach(function (report) {
          var value = report.value;
          value.report_link = "#/update/report/" + report.id;
          value.time_start = new Date(value.time_start).toISOString();
          context.reports.push(value);
        })

        var template = '/templates/update_reports.mustache';
        context.render(template).replace('#content').then(function () {

          $('#branch-selection span').each(function (i, elem) {
            if (elem.textContent == branch) {
              $(elem).addClass("selected")
            }
          })

          $('#branch-selection span').click(function () {
            window.location = '/#/update/reports?branch=' + this.textContent +
                              '&platform=' + platform + '&from=' + $("#start-date").val() +
                              '&to=' + $("#end-date").val();
          })

          $('#os-selection span').each(function (i, elem) {
            if (elem.textContent == platform) {
              $(elem).addClass("selected")
            }
          })

          $('#os-selection span').click(function () {
            window.location = '/#/update/reports?branch=' + branch + '&platform=' +
                              this.textContent + '&from=' + $("#start-date").val() +
                              '&to=' + $("#end-date").val();
          })

          $(".datepicker").datepicker();
          $(".datepicker").datepicker("option", "dateFormat", "yy-mm-dd");

          $('#start-date').datepicker().val(fromDate.format()).trigger('change');
          $('#end-date').datepicker().val(toDate.format()).trigger('change');

          $(".datepicker").change(function() {
            window.location = '/#/update/reports?branch=' + branch + "&platform=" + platform +
                              '&from=' + $("#start-date").val() +
                              '&to=' + $("#end-date").val();
          })

          $("#subtitle").text("Update Reports");

          $("#results").tablesorter({
            // sort on the first column and third column, order asc
            sortList: [[0,1]]
          });
        });
      });

      $(".selection").change(function() {
        window.location = this.value;
      });
    }

    function update_report() {
      var context = this;

      var id = this.params.id ? this.params.id : 'null';
      var template = '/templates/update_report.mustache';

      request({url: '/db/' + id}, function (err, resp) {
        if (err) window.alert(err);

        context.id = resp._id;
        context.domain = domain;
        context.addonsIncluded = 'addons' in resp;
        if (context.addonsIncluded) {
          context.extensions = resp.addons.filter(function (item) { return (item.type === "extension") });
          context.themes = resp.addons.filter(function (item) { return (item.type === "theme") });
          context.plugins = resp.addons.filter(function (item) { return (item.type === "plugin") });
        }
        context.system = resp.system_info.system;
        context.system_version = resp.system_info.version;
        context.service_pack = resp.system_info.service_pack;
        context.cpu = resp.system_info.processor;
        context.time_start = new Date(resp.time_start).format("yyyy/mm/dd HH:MM:ss", true);
        context.time_end = new Date(resp.time_end).format("yyyy/mm/dd HH:MM:ss", true);
        context.passed = resp.tests_passed;
        context.failed = resp.tests_failed;
        context.skipped = resp.tests_skipped;

        // In the case that no update data is available default to the known values
        context.post_app_name = resp.application_name;
        context.post_app_version = resp.application_version;
        context.post_platform_version = resp.platform_version;
        context.post_platform_buildId = resp.platform_buildid;
        context.post_app_locale = resp.application_locale;
        context.post_app_sourcestamp = resp.application_repository + "/rev/" + resp.application_changeset;
        context.updates = resp.updates;
        context.mozmill_version = resp.mozmill_version || "n/a";
        context.results = processTestResults(resp);

        context.render(template).replace('#content').then(function () {
          $("#result").tablesorter();

          setFilters();

          $("#subtitle").text("Report Details");

          $(".selection").change(function() {
            window.location = this.value;
          });
        });
      });
    }

    var l10n_reports = function () {
      var branch = this.params.branch ? this.params.branch : 'All';
      var platform = this.params.platform ? this.params.platform : 'All';

      var fromDate;
      if (this.params.from) {
        fromDate = new Date(this.params.from);
      }
      else {
        fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - 3);
      }

      var toDate;
      if (this.params.to) {
        toDate = new Date(this.params.to);
      }
      else {
        toDate = new Date();
      }

      var query = {
        startkey: JSON.stringify([branch, platform, toDate.format() + "T23:59:59"]),
        endkey: JSON.stringify([branch, platform, fromDate.format() + "T00:00:00"]),
        descending: "true"
      };

      var context = this;
      this.firefox_versions = FIREFOX_VERSIONS;
      request({url: '/_view/l10n_reports?' + $.param(query)}, function (err, resp) {
        if (err) window.alert(err);

        context.reports = [ ];
        resp.rows.forEach(function (report) {
          var value = report.value;
          value.report_link = "#/l10n/report/" + report.id;
          value.time_start = new Date(value.time_start).toISOString();
          context.reports.push(value);
        })

        var template = '/templates/l10n_reports.mustache';
        context.render(template).replace('#content').then(function () {

          $('#branch-selection span').each(function (i, elem) {
            if (elem.textContent == branch) {
              $(elem).addClass("selected")
            }
          })

          $('#branch-selection span').click(function () {
            window.location = '/#/l10n/reports?branch=' + this.textContent +
                              '&platform=' + platform + '&from=' + $("#start-date").val() +
                              '&to=' + $("#end-date").val();
          })

          $('#os-selection span').each(function (i, elem) {
            if (elem.textContent == platform) {
              $(elem).addClass("selected")
            }
          })

          $('#os-selection span').click(function () {
            window.location = '/#/l10n/reports?branch=' + branch + '&platform=' +
                              this.textContent + '&from=' + $("#start-date").val() +
                              '&to=' + $("#end-date").val();
          })

          $(".datepicker").datepicker();
          $(".datepicker").datepicker("option", "dateFormat", "yy-mm-dd");

          $('#start-date').datepicker().val(fromDate.format()).trigger('change');
          $('#end-date').datepicker().val(toDate.format()).trigger('change');

          $(".datepicker").change(function() {
            window.location = '/#/l10n/reports?branch=' + branch + "&platform=" + platform +
                              '&from=' + $("#start-date").val() +
                              '&to=' + $("#end-date").val();
          })

          $("#subtitle").text("Functional Reports");

          $("#results").tablesorter({
            // sort on the first column and third column, order asc
            sortList: [[0,1]]
          });
        });
      });

      $(".selection").change(function() {
        window.location = this.value;
      });
    }

    function l10n_report() {
      var context = this;

      var id = this.params.id ? this.params.id : 'null';
      var template = '/templates/l10n_report.mustache';

      request({url: '/db/' + id}, function (err, resp) {
        if (err) window.alert(err);

        context.id = resp._id;
        context.domain = domain;
        context.app_name = resp.application_name;
        context.app_version = resp.application_version;
        context.platform_version = resp.platform_version;
        context.platform_buildId = resp.platform_buildid;
        context.app_locale = resp.application_locale;
        context.app_sourcestamp = resp.application_repository + "/rev/" + resp.application_changeset;
        context.addonsIncluded = 'addons' in resp;
        if (context.addonsIncluded) {
          context.extensions = resp.addons.filter(function (item) { return (item.type === "extension") });
          context.themes = resp.addons.filter(function (item) { return (item.type === "theme") });
          context.plugins = resp.addons.filter(function (item) { return (item.type === "plugin") });
        }
        context.system = resp.system_info.system;
        context.system_version = resp.system_info.version;
        context.service_pack = resp.system_info.service_pack;
        context.cpu = resp.system_info.processor;
        context.time_start = resp.time_start;
        context.time_end = resp.time_end;
        context.passed = resp.tests_passed;
        context.failed = resp.tests_failed;
        context.skipped = resp.tests_skipped;
        context.mozmill_version = resp.mozmill_version || "n/a";
        context.results = processTestResults(resp);

        context.render(template).replace('#content').then(function () {
          $("#result").tablesorter();

          setFilters();

          $("#subtitle").text("Report Details");

          $(".selection").change(function() {
            window.location = this.value;
          });

        });
      });
    }

    var endurance_reports = function() {
      var branch = this.params.branch ? this.params.branch : 'All';
      var platform = this.params.platform ? this.params.platform : 'All';

      var fromDate;
      if (this.params.from) {
        fromDate = new Date(this.params.from);
      }
      else {
        fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - 3);
      }

      var toDate;
      if (this.params.to) {
        toDate = new Date(this.params.to);
      }
      else {
        toDate = new Date();
      }

      var query = {
        startkey: JSON.stringify([branch, platform, toDate.format() + "T23:59:59"]),
        endkey: JSON.stringify([branch, platform, fromDate.format() + "T00:00:00"]),
        descending: "true"
      };

      var context = this;
      this.firefox_versions = FIREFOX_VERSIONS;
      request({url: '/_view/endurance_reports?' + $.param(query)}, function (err, resp) {
        if (err) window.alert(err);

        context.reports = [];
        resp.rows.forEach(function (report) {
          var value = report.value;
          value.report_link = "#/endurance/report/" + report.id;
          value.time_start = new Date(value.time_start).toISOString();
          value.delay = value.delay * 1/1000;
          value.memory = get_memory_stats(value.stats);
          context.reports.push(value);
        })

        var template = '/templates/endurance_reports.mustache';
        context.render(template).replace('#content').then(function () {

          $('#branch-selection span').each(function (i, elem) {
            if (elem.textContent == branch) {
              $(elem).addClass("selected")
            }
          })

          $('#branch-selection span').click(function () {
            window.location = '/#/endurance/reports?branch=' + this.textContent +
                              '&platform=' + platform + '&from=' + $("#start-date").val() +
                              '&to=' + $("#end-date").val();
          })

          $('#os-selection span').each(function (i, elem) {
            if (elem.textContent == platform) {
              $(elem).addClass("selected")
            }
          })

          $('#os-selection span').click(function () {
            window.location = '/#/endurance/reports?branch=' + branch +
                              '&platform=' + this.textContent +
                              '&from=' + $("#start-date").val() +
                              '&to=' + $("#end-date").val()
          })

          $(".datepicker").datepicker();
          $(".datepicker").datepicker("option", "dateFormat", "yy-mm-dd");

          $('#start-date').datepicker().val(fromDate.format()).trigger('change');
          $('#end-date').datepicker().val(toDate.format()).trigger('change');

          $(".datepicker").change(function() {
            window.location = '/#/endurance/reports?branch=' + branch + "&platform=" + platform +
                              '&from=' + $("#start-date").val() +
                              '&to=' + $("#end-date").val();
          })

          $("#results").tablesorter({
            // sort on the first column and third column, order asc
            sortList: [[0,1]]
          });

          $("#subtitle").text("Endurance Reports");

        });
      });

      $(".selection").change(function() {
        window.location = this.value;
      });
    }

    var endurance_charts = function() {
      var branch = this.params.branch ? this.params.branch : FIREFOX_VERSIONS[0];
      var platform = this.params.platform ? this.params.platform : 'All';

      var fromDate;
      if (this.params.from) {
        fromDate = new Date(this.params.from);
      }
      else {
        fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - 28);
      }

      var toDate;
      if (this.params.to) {
        toDate = new Date(this.params.to);
      }
      else {
        toDate = new Date();
      }

      var query = {
        startkey: JSON.stringify([branch, platform, toDate.format() + "T23:59:59"]),
        endkey: JSON.stringify([branch, platform, fromDate.format() + "T00:00:00"]),
        descending: "true"
      };

      var context = this;
      context.firefox_versions = FIREFOX_VERSIONS;
      request({url: '/_view/endurance_charts?' + $.param(query)}, function (err, resp) {
        if (err) window.alert(err);

        platform_reports = {};
        context.reports = [];
        resp.rows.forEach(function (report) {
          var value = report.value;
          value.duration = new Date(value.time_end) - new Date(value.time_start);
          value.memory = get_memory_stats(value.stats);
          context.reports.push(value);

          current_platform = value.system_name + " " + value.system_version + " " + value.processor;
          if (platform_reports[current_platform] == undefined) {
            platform_reports[current_platform] = {
              "name": current_platform,
              "reports": [value]
            }
          } else {
            platform_reports[current_platform].reports.push(value);
          }
        })

        context.platform_reports = [];
        for (var key in platform_reports) {
          context.platform_reports.push(platform_reports[key]);
        }

        var template = '/templates/endurance_charts.mustache';
        context.render(template).replace('#content').then(function () {

          $('#branch-selection span').each(function (i, elem) {
            if (elem.textContent == branch) {
              $(elem).addClass("selected")
            }
          })

          $('#branch-selection span').click(function () {
            window.location = '/#/endurance/charts?branch=' + this.textContent +
                              '&platform=' + platform + '&from=' + $("#start-date").val() +
                              '&to=' + $("#end-date").val();
          })

          $('#os-selection span').each(function (i, elem) {
            if (elem.textContent == platform) {
              $(elem).addClass("selected")
            }
          })

          $('#os-selection span').click(function () {
            window.location = '/#/endurance/charts?branch=' + branch +
                              '&platform=' + this.textContent +
                              '&from=' + $("#start-date").val() +
                              '&to=' + $("#end-date").val()
          })

          $(".datepicker").datepicker();
          $(".datepicker").datepicker("option", "dateFormat", "yy-mm-dd");

          $('#start-date').datepicker().val(fromDate.format()).trigger('change');
          $('#end-date').datepicker().val(toDate.format()).trigger('change');

          $(".datepicker").change(function() {
            window.location = '/#/endurance/charts?branch=' + branch + "&platform=" + platform +
                              '&from=' + $("#start-date").val() +
                              '&to=' + $("#end-date").val();
          })

          $("#subtitle").text("Endurance Charts");
        });
      });

      $(".selection").change(function() {
        window.location = this.value;
      });
    }

    var endurance_report = function() {
      var context = this;

      var id = this.params.id ? this.params.id : 'null';
      var template = '/templates/endurance_report.mustache';

      request({url: '/db/' + id}, function (err, resp) {
        if (err) window.alert(err);

        context.id = resp._id;
        context.domain = domain;
        context.app_name = resp.application_name;
        context.app_version = resp.application_version;
        context.platform_version = resp.platform_version;
        context.platform_buildId = resp.platform_buildid;
        context.app_locale = resp.application_locale;
        context.app_sourcestamp = resp.application_repository + "/rev/" + resp.application_changeset;
        context.addonsIncluded = 'addons' in resp;
        if (context.addonsIncluded) {
          context.extensions = resp.addons.filter(function (item) { return (item.type === "extension") });
          context.themes = resp.addons.filter(function (item) { return (item.type === "theme") });
          context.plugins = resp.addons.filter(function (item) { return (item.type === "plugin") });
        }
        context.system = resp.system_info.system;
        context.system_version = resp.system_info.version;
        context.service_pack = resp.system_info.service_pack;
        context.cpu = resp.system_info.processor;
        if (resp.report_version >= 1.2) {
          context.graphics = resp.system_info.graphics;
          context.graphics.info.forEach(function(info) {
            if (info.value === null || info.value === "")
              info.value = "Unknown";
          });
        }
        context.time_start = resp.time_start;
        context.time_end = resp.time_end;
        context.passed = resp.tests_passed;
        context.failed = resp.tests_failed;
        context.skipped = resp.tests_skipped;
        context.tests = [];
        context.checkpoints = [];
        var stats_available = resp.endurance.stats;
        context.stats_available = stats_available;

        var tests = resp.endurance.results;
        var testCount = tests.length;
        var allCheckpoints = [];

        for (var i=0; i < testCount; i++) {
            var testIterationCount = tests[i].iterations.length;

            var types = {
              'firefox-endurance' : 'endurance'
            };

            for (var j=0; j < testIterationCount; j++) {
              var testCheckpointCount = tests[i].iterations[j].checkpoints.length;

              for (var k=0; k < testCheckpointCount; k++) {

                var filename = tests[i].testFile;
                try {
                  var type = types[resp.report_type];
                  filename = filename.split(type)[1].replace(/\\/g, '/');
                }
                catch (ex) {
                }

                var checkpointMemory = {};

                if (tests[i].iterations[j].checkpoints[k].explicit) {
                  checkpointMemory.explicit = Math.round(tests[i].iterations[j].checkpoints[k].explicit * BYTE_TO_MEGABYTE);
                }

                if (tests[i].iterations[j].checkpoints[k].resident) {
                  checkpointMemory.resident = Math.round(tests[i].iterations[j].checkpoints[k].resident * BYTE_TO_MEGABYTE);
                }

                allCheckpoints.push({
                  testFile : filename,
                  testMethod : tests[i].testMethod,
                  label : tests[i].iterations[j].checkpoints[k].label,
                  memory : checkpointMemory
                });

              }
            }

            var testMemory = get_memory_stats(tests[i].stats);

            context.tests.push({
              testFile : tests[i].testFile.split(type)[1].replace(/\\/g, '/'),
              testMethod : tests[i].testMethod,
              memory : testMemory
            });
        }

        if (allCheckpoints.length <= MAX_CHART_CHECKPOINTS) {
          context.checkpoints = allCheckpoints;
        }
        else {
          //reduce the number of checkpoints to improve chart rendering performance
          var divisor = allCheckpoints.length / MAX_CHART_CHECKPOINTS;
          for (var i = 0; i < allCheckpoints.length; i++) {
            if ((i % divisor) < 1) {
              context.checkpoints.push(allCheckpoints[i]);
            }
          }
        };

        context.delay = resp.endurance.delay * 1/1000;
        context.iterations = resp.endurance.iterations;

        if (resp.report_version >= 1.1) {
          context.entities = resp.endurance.entities;
        }
        else {
          context.entities = resp.endurance.micro_iterations ? resp.endurance.micro_iterations : 1;
        }

        context.restart = resp.endurance.restart;
        context.testCount = testCount;
        context.checkpointCount = allCheckpoints.length;
        context.checkpointsPerTest = Math.round(allCheckpoints.length / testCount);
        context.memory = get_memory_stats(resp.endurance.stats);
        context.mozmill_version = resp.mozmill_version || "n/a";
        context.results = processTestResults(resp);

        context.render(template).replace('#content').then(function () {
          $("#toggle_graphics").toggle(function() {
            $('#graphics').show("slow");
            $(this).text("Collapse");
          }, function () {
            $('#graphics').hide("slow");
            $(this).html('Expand');
          });
          $("#endurance_result").tablesorter();
          $("#result").tablesorter();

          setFilters();

          $("#subtitle").text("Report Details");

          $(".selection").change(function() {
            window.location = this.value;
          });

        });
     });
    }

    function get_memory_stats(stats) {
      var memory = {};

      if (stats) {

        if ("explicit" in stats) {
          memory.explicit = {
            min : Math.round(stats.explicit.min * BYTE_TO_MEGABYTE),
            max : Math.round(stats.explicit.max * BYTE_TO_MEGABYTE),
            average : Math.round(stats.explicit.average * BYTE_TO_MEGABYTE)
          }
        }

        if ("resident" in stats) {
          memory.resident = {
            min : Math.round(stats.resident.min * BYTE_TO_MEGABYTE),
            max : Math.round(stats.resident.max * BYTE_TO_MEGABYTE),
            average : Math.round(stats.resident.average * BYTE_TO_MEGABYTE)
          }
        }

      }
      return memory;
    }

    var remote_reports = function() {
      var branch = this.params.branch ? this.params.branch : 'All';
      var platform = this.params.platform ? this.params.platform : 'All';

      var fromDate;
      if (this.params.from) {
        fromDate = new Date(this.params.from);
      }
      else {
        fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - 3);
      }

      var toDate;
      if (this.params.to) {
        toDate = new Date(this.params.to);
      }
      else {
        toDate = new Date();
      }

      var query = {
        startkey: JSON.stringify([branch, platform, toDate.format() + "T23:59:59"]),
        endkey: JSON.stringify([branch, platform, fromDate.format() + "T00:00:00"]),
        descending: "true"
      };

      var context = this;
      this.firefox_versions = FIREFOX_VERSIONS;
      request({url: '/_view/remote_reports?' + $.param(query)}, function (err, resp) {
        if (err) window.alert(err);

        context.reports = [ ];
        resp.rows.forEach(function (report) {
          var value = report.value;
          value.report_link = "#/remote/report/" + report.id;
          value.time_start = new Date(value.time_start).toISOString();
          context.reports.push(value);
        })

        var template = '/templates/remote_reports.mustache';
        context.render(template).replace('#content').then(function () {

          $('#branch-selection span').each(function (i, elem) {
            if (elem.textContent == branch) {
              $(elem).addClass("selected")
            }
          })

          $('#branch-selection span').click(function () {
            window.location = '/#/remote/reports?branch=' + this.textContent +
                              '&platform=' + platform + '&from=' + $("#start-date").val() +
                              '&to=' + $("#end-date").val();
          })

          $('#os-selection span').each(function (i, elem) {
            if (elem.textContent == platform) {
              $(elem).addClass("selected")
            }
          })

          $('#os-selection span').click(function () {
            window.location = '/#/remote/reports?branch=' + branch +
                              '&platform=' + this.textContent +
                              '&from=' + $("#start-date").val() +
                              '&to=' + $("#end-date").val()
          })

          $(".datepicker").datepicker();
          $(".datepicker").datepicker("option", "dateFormat", "yy-mm-dd");

          $('#start-date').datepicker().val(fromDate.format()).trigger('change');
          $('#end-date').datepicker().val(toDate.format()).trigger('change');

          $(".datepicker").change(function() {
            window.location = '/#/remote/reports?branch=' + branch + "&platform=" + platform +
                              '&from=' + $("#start-date").val() +
                              '&to=' + $("#end-date").val();
          })

          $("#results").tablesorter({
            // sort on the first column and third column, order asc
            sortList: [[0,1]]
          });

        });
      });

      $(".selection").change(function() {
        window.location = this.value;
      });
    }

    function remote_report() {
      var context = this;

      var id = this.params.id ? this.params.id : 'null';
      var template = '/templates/remote_report.mustache';

      request({url: '/db/' + id}, function (err, resp) {
        if (err) window.alert(err);

        context.id = resp._id;
        context.domain = domain;
        context.app_name = resp.application_name;
        context.app_version = resp.application_version;
        context.platform_version = resp.platform_version;
        context.platform_buildId = resp.platform_buildid;
        context.app_locale = resp.application_locale;
        context.app_sourcestamp = resp.application_repository + "/rev/" + resp.application_changeset;
        context.addonsIncluded = 'addons' in resp;
        if (context.addonsIncluded) {
          context.extensions = resp.addons.filter(function (item) { return (item.type === "extension") });
          context.themes = resp.addons.filter(function (item) { return (item.type === "theme") });
          context.plugins = resp.addons.filter(function (item) { return (item.type === "plugin") });
        }
        context.system = resp.system_info.system;
        context.system_version = resp.system_info.version;
        context.service_pack = resp.system_info.service_pack;
        context.cpu = resp.system_info.processor;
        context.time_start = resp.time_start;
        context.time_end = resp.time_end;
        context.passed = resp.tests_passed;
        context.failed = resp.tests_failed;
        context.skipped = resp.tests_skipped;
        context.mozmill_version = resp.mozmill_version || "n/a";
        context.results = processTestResults(resp);

        context.render(template).replace('#content').then(function () {
          $("#result").tablesorter();

          setFilters();

          $("#subtitle").text("Report Details");

          $(".selection").change(function() {
            window.location = this.value;
          });
        });
      });
    }

    var addons_reports = function() {
      var branch = this.params.branch ? this.params.branch : 'All';
      var platform = this.params.platform ? this.params.platform : 'All';

      var fromDate;
      if (this.params.from) {
        fromDate = new Date(this.params.from);
      }
      else {
        fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - 3);
      }

      var toDate;
      if (this.params.to) {
        toDate = new Date(this.params.to);
      }
      else {
        toDate = new Date();
      }

      var query = {
        startkey: JSON.stringify([branch, platform, toDate.format() + "T23:59:59"]),
        endkey: JSON.stringify([branch, platform, fromDate.format() + "T00:00:00"]),
        descending: "true"
      };

      var context = this;
      this.firefox_versions = FIREFOX_VERSIONS;
      request({url: '/_view/addons_reports?' + $.param(query)}, function (err, resp) {
        if (err) window.alert(err);

        context.reports = [ ];
        resp.rows.forEach(function (report) {
          var value = report.value;
          value.report_link = "#/addons/report/" + report.id;
          value.time_start = new Date(value.time_start).toISOString();
          context.reports.push(value);
        })

        var template = '/templates/addons_reports.mustache';
        context.render(template).replace('#content').then(function () {

          $('#branch-selection span').each(function (i, elem) {
            if (elem.textContent == branch) {
              $(elem).addClass("selected")
            }
          })

          $('#branch-selection span').click(function () {
            window.location = '/#/addons/reports?branch=' + this.textContent +
                              '&platform=' + platform + '&from=' + $("#start-date").val() +
                              '&to=' + $("#end-date").val();
          })

          $('#os-selection span').each(function (i, elem) {
            if (elem.textContent == platform) {
              $(elem).addClass("selected")
            }
          })

          $('#os-selection span').click(function () {
            window.location = '/#/addons/reports?branch=' + branch +
                              '&platform=' + this.textContent +
                              '&from=' + $("#start-date").val() +
                              '&to=' + $("#end-date").val()
          })

          $(".datepicker").datepicker();
          $(".datepicker").datepicker("option", "dateFormat", "yy-mm-dd");

          $('#start-date').datepicker().val(fromDate.format()).trigger('change');
          $('#end-date').datepicker().val(toDate.format()).trigger('change');

          $(".datepicker").change(function() {
            window.location = '/#/addons/reports?branch=' + branch + "&platform=" + platform +
                              '&from=' + $("#start-date").val() +
                              '&to=' + $("#end-date").val();
          })

          $("#subtitle").text("Functional Reports");

          $("#results").tablesorter({
            // sort on the first column and third column, order asc
            sortList: [[0,1]]
          });

        });
      });

      $(".selection").change(function() {
        window.location = this.value;
      });
    }

    function addons_report() {
      var context = this;

      var id = this.params.id ? this.params.id : 'null';
      var template = '/templates/addons_report.mustache';

      request({url: '/db/' + id}, function (err, resp) {
        if (err) window.alert(err);

        context.id = resp._id;
        context.domain = domain;
        context.app_name = resp.application_name;
        context.app_version = resp.application_version;
        context.platform_version = resp.platform_version;
        context.platform_buildId = resp.platform_buildid;
        context.app_locale = resp.application_locale;
        context.app_sourcestamp = resp.application_repository + "/rev/" + resp.application_changeset;
        context.addonsIncluded = 'addons' in resp;
        if (context.addonsIncluded) {
          context.extensions = resp.addons.filter(function (item) { return (item.type === "extension") });
          context.themes = resp.addons.filter(function (item) { return (item.type === "theme") });
          context.plugins = resp.addons.filter(function (item) { return (item.type === "plugin") });
        }
        context.system = resp.system_info.system;
        context.system_version = resp.system_info.version;
        context.service_pack = resp.system_info.service_pack;
        context.cpu = resp.system_info.processor;
        context.time_start = resp.time_start;
        context.time_end = resp.time_end;
        context.passed = resp.tests_passed;
        context.failed = resp.tests_failed;
        context.skipped = resp.tests_skipped;
        context.target_addon = resp.target_addon;
        context.mozmill_version = resp.mozmill_version || "n/a";
        context.results = processTestResults(resp);

        context.render(template).replace('#content').then(function () {
          $("#result").tablesorter();

          setFilters();

          $("#subtitle").text("Report Details");

          $(".selection").change(function() {
            window.location = this.value;
          });
        });
      });
    }


    // Index of all databases
    // Database view
    this.get('#/functional', functional_topFailures);
    this.get('#/functional/top', functional_topFailures);
    this.get('#/functional/failure', functional_failure);
    this.get('#/functional/reports', functional_reports);
    this.get('#/functional/report/:id', functional_report);
    this.get('#/update', update_reports);
    this.get('#/update/overview', update_overview);
    this.get('#/update/detail', update_detail);
    this.get('#/update/reports', update_reports);
    this.get('#/update/report/:id', update_report);
    this.get('#/l10n', l10n_reports);
    this.get('#/l10n/reports', l10n_reports);
    this.get('#/l10n/report/:id', l10n_report);
    this.get('#/endurance', endurance_charts);
    this.get('#/endurance/charts', endurance_charts);
    this.get('#/endurance/reports', endurance_reports);
    this.get('#/endurance/report/:id', endurance_report);
    this.get('#/remote', remote_reports);
    this.get('#/remote/reports', remote_reports);
    this.get('#/remote/report/:id', remote_report);
    this.get('#/addons', addons_reports);
    this.get('#/addons/reports', addons_reports);
    this.get('#/addons/report/:id', addons_report);
  });

  $(function() {
    app.run('#/functional');
  });

})(jQuery);
