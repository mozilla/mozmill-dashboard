var BYTE_TO_MEGABYTE = 1/1048576;

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
    this.use('Mustache');

    var general_reports = function() {
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
      request({url: '/_view/general_reports?' + $.param(query)}, function (err, resp) {
        if (err) window.alert(err);

        context.reports = [ ];
        resp.rows.forEach(function (report) {
          var value = report.value;
          value.report_link = "#/general/report/" + report.id;
          value.time = new Date(value.time).toISOString();
          context.reports.push(value);
        })

        var template = '/templates/general_reports.mustache';
        context.render(template).replace('#content').then(function () {

          $('#branch-selection span').each(function (i, elem) {
            if (elem.textContent == branch) {
              $(elem).addClass("selected")
            }
          })

          $('#branch-selection span').click(function () {
            window.location = '/#/general/reports?branch=' + this.textContent +
                              '&platform=' + platform + '&from=' + $("#start-date").val() +
                              '&to=' + $("#end-date").val();
          })

          $('#os-selection span').each(function (i, elem) {
            if (elem.textContent == platform) {
              $(elem).addClass("selected")
            }
          })

          $('#os-selection span').click(function () {
            window.location = '/#/general/reports?branch=' + branch +
                              '&platform=' + this.textContent +
                              '&from=' + $("#start-date").val() +
                              '&to=' + $("#end-date").val()
          })

          $(".datepicker").datepicker();
          $(".datepicker").datepicker("option", "dateFormat", "yy-mm-dd");

          $('#start-date').datepicker().val(fromDate.format()).trigger('change');
          $('#end-date').datepicker().val(toDate.format()).trigger('change');

          $(".datepicker").change(function() {
            window.location = '/#/general/reports?branch=' + branch + "&platform=" + platform +
                              '&from=' + $("#start-date").val() +
                              '&to=' + $("#end-date").val();
          })

          $("#subtitle").text("General Reports");

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

    var general_failure = function() {
      var context = this;

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

      request({url:'/_view/general_failures?'+$.param(query)}, function (err, resp) {
        if (err) console.og(err);

        context.reports = [ ];
        context.test_module = test;
        context.test_function = test_func;
        resp.rows.forEach(function (row) {
          var value = row.value;

          if (test_func == {} || value.test_function == test_func) {
            value.time = new Date(row.key[3]).toISOString();
            value.report_link = "#/general/report/" + row.id;

            context.reports.push(value);
          }
        });

        var template = '/templates/general_failure.mustache';
        context.render(template).replace('#content').then(function () {

          $('#branch-selection span').each(function (i, elem) {
            if (elem.textContent == branch) {
              $(elem).addClass("selected")
            }
          })
          $('#branch-selection span').click(function () {
            window.location = '/#/general/failure?branch=' + this.textContent +
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
            window.location = '/#/general/failure?branch=' + branch +
                              '&platform=' + this.textContent + '&from=' + fromDate.format() +
                              '&to=' + toDate.format() + "&test=" +
                              encodeURIComponent(test) + '&func=' + encodeURIComponent(test_func);
          })

          $(".datepicker").datepicker();
          $(".datepicker").datepicker("option", "dateFormat", "yy-mm-dd");

          $('#start-date').datepicker().val(fromDate.format()).trigger('change');
          $('#end-date').datepicker().val(toDate.format()).trigger('change');

          $(".datepicker").change(function() {
            window.location = '/#/general/failure?branch=' + branch + "&platform=" + platform +
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

    var general_topFailures = function () {
      var context = this;

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

      request({url:'/_view/general_failures?'+$.param(query)}, function (err, resp) {
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
            failure_link : '/#/general/failure?branch=' + entries[2] + "&platform=" +
                           entries[3] + '&from=' + fromDate.format() +
                          '&to=' + toDate.format() + "&test=" +
                          encodeURIComponent(entries[0]) + "&func=" +
                          encodeURIComponent(entries[1]),
            failure_count : failures[key]
          });
        };

        var template = '/templates/general_failures.mustache';
        context.render(template).replace('#content').then(function () {

          $('#branch-selection span').each(function (i, elem) {
            if (elem.textContent == branch) {
              $(elem).addClass("selected")
            }
          })
          $('#branch-selection span').click(function () {
            window.location = '/#/general/top?branch=' + this.textContent + "&platform=" + platform +
                              '&from=' + $("#start-date").val() +
                              '&to=' + $("#end-date").val();
          })

          $('#os-selection span').each(function (i, elem) {
            if (elem.textContent == platform) {
              $(elem).addClass("selected")
            }
          })
          $('#os-selection span').click(function () {
            window.location = '/#/general/top?branch=' + branch + "&platform=" + this.textContent +
                              '&from=' + $("#start-date").val() +
                              '&to=' + $("#end-date").val();
          })

          $(".datepicker").datepicker();
          $(".datepicker").datepicker("option", "dateFormat", "yy-mm-dd");

          $('#start-date').datepicker().val(fromDate.format()).trigger('change');
          $('#end-date').datepicker().val(toDate.format()).trigger('change');

          $(".datepicker").change(function() {
            window.location = '/#/general/top?branch=' + branch + "&platform=" + platform +
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

    function general_report() {
      var context = this;

      var id = this.params.id ? this.params.id : 'null';
      var template = '/templates/general_report.mustache';

      request({url: '/db/' + id}, function (err, resp) {
        if (err) window.alert(err);

        context.id = resp._id;
        context.app_name = resp.application_name;
        context.app_version = resp.application_version;
        context.platform_version = resp.platform_version;
        context.platform_buildId = resp.platform_buildid;
        context.app_locale = resp.application_locale;
        context.app_sourcestamp = resp.application_repository + "/rev/" + resp.application_changeset;
        context.system = resp.system_info.system;
        context.system_version = resp.system_info.version;
        context.service_pack = resp.system_info.service_pack;
        context.cpu = resp.system_info.processor;
        context.time_start = resp.time_start;
        context.time_end = resp.time_end;
        context.passed = resp.tests_passed;
        context.failed = resp.tests_failed;
        context.skipped = resp.tests_skipped;

        context.results = [];

        for (var i = 0; i < resp.results.length; i++) {
          var result = resp.results[i];

          var types = {
            'firefox-general' : 'firefox',
            'firefox-functional' : 'functional',
            'mozmill-test' : 'functional',
            'mozmill-restart-test' : 'functional'
          };

          var type = types[resp.report_type];
          var filename = result.filename.split(type)[1].replace(/\\/g, '/');

          var status = "passed";
          if (result.skipped) {
            status = "skipped";
          } else if (result.failed) {
            status = "failed";
          }

          var information = "";
          var stack = "";
          try {
            if (result.skipped) {
              information = result.skipped_reason;

              var re = /Bug ([\d]+)/g.exec(information);
              if (re) {
                var tmpl = '<a href="https://bugzilla.mozilla.org/show_bug.cgi?id=%s">Bug %s</a>';
                var link = tmpl.replace(/\%s/g, re[1]);
                information = information.replace(re[0], link);
              }
            } else {
              information = result.fails[0].exception.message;
              stack = result.fails[0].exception.stack;
            }
          } catch (ex) { }

          context.results.push({
            filename : filename,
            test : result.name,
            status : status,
            information: information,
            stack : stack
          });
        }

        context.render(template).replace('#content').then(function () {
          $("#all").fadeOut();
          $("#all").click(function (event) {
            $("#filter a").fadeIn();
            $("#all").fadeOut();
            $("tr.passed").fadeIn("slow");
            $("tr.failed").fadeIn("slow");
            $("tr.skipped").fadeIn("slow");
             event.preventDefault();
          });

          $("#passed").click(function (event) {
            $("#filter a").fadeIn();
            $("#passed").fadeOut();
            $("tr.passed").fadeIn("slow");
            $("tr.failed").fadeOut("slow");
            $("tr.skipped").fadeOut("slow");
             event.preventDefault();
          });

          $("#failed").click(function (event) {
            $("#filter a").fadeIn();
            $("#failed").fadeOut();
            $("tr.passed").fadeOut("slow");
            $("tr.failed").fadeIn("slow");
            $("tr.skipped").fadeOut("slow");
             event.preventDefault();
          });

          $("#skipped").click(function (event) {
            $("#filter a").fadeIn();
            $("#skipped").fadeOut();
            $("tr.passed").fadeOut("slow");
            $("tr.failed").fadeOut("slow");
            $("tr.skipped").fadeIn("slow");
             event.preventDefault();
          });

          $("#subtitle").text("Report Details");

          $(".selection").change(function() {
            window.location = this.value;
          });
        });
      });
    }

    var update_overview = function () {
      var context = this;

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
      request({url: '/_view/update_reports?' + $.param(query)}, function (err, resp) {
        if (err) window.alert(err);

        context.reports = [ ];
        resp.rows.forEach(function (report) {
          var value = report.value;
          value.report_link = "#/update/report/" + report.id;
          value.time = new Date(value.time).toISOString();
          context.reports.push(value);
        })

        var template = '/templates/general_reports.mustache';
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
        context.results = [];

        for (var i = 0; i < resp.results.length; i++) {
          var result = resp.results[i];

          var types = {
            'firefox-update' : 'update'
          };

          var filename = result.filename;
          try {
            var type = types[resp.report_type];
            filename = filename.split(type)[1].replace(/\\/g, '/');
          }
          catch (ex) {
          }

          var status = "passed";
          if (result.skipped) {
            status = "skipped";
          } else if (result.failed) {
            status = "failed";
          }

          var information = "";
          var stack = "";
          try {
            if (result.skipped) {
              information = result.skipped_reason;

              var re = /Bug ([\d]+)/g.exec(information);
              if (re) {
                var tmpl = '<a href="https://bugzilla.mozilla.org/show_bug.cgi?id=%s">Bug %s</a>';
                var link = tmpl.replace(/\%s/g, re[1]);
                information = information.replace(re[0], link);
              }
            } else {
              information = result.fails[0].exception.message;
              stack = result.fails[0].exception.stack;
            }
          } catch (ex) { }

          context.results.push({
            filename : filename,
            test : result.name,
            status : status,
            information: information,
            stack : stack
          });
        }

        context.render(template).replace('#content').then(function () {
          $("#all").fadeOut();
          $("#all").click(function (event) {
            $("#filter a").fadeIn();
            $("#all").fadeOut();
            $("tr.passed").fadeIn("slow");
            $("tr.failed").fadeIn("slow");
            $("tr.skipped").fadeIn("slow");
             event.preventDefault();
          });

          $("#passed").click(function (event) {
            $("#filter a").fadeIn();
            $("#passed").fadeOut();
            $("tr.passed").fadeIn("slow");
            $("tr.failed").fadeOut("slow");
            $("tr.skipped").fadeOut("slow");
             event.preventDefault();
          });

          $("#failed").click(function (event) {
            $("#filter a").fadeIn();
            $("#failed").fadeOut();
            $("tr.passed").fadeOut("slow");
            $("tr.failed").fadeIn("slow");
            $("tr.skipped").fadeOut("slow");
             event.preventDefault();
          });

          $("#skipped").click(function (event) {
            $("#filter a").fadeIn();
            $("#skipped").fadeOut();
            $("tr.passed").fadeOut("slow");
            $("tr.failed").fadeOut("slow");
            $("tr.skipped").fadeIn("slow");
             event.preventDefault();
          });

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
        toDate.setHours(toDate.getHours() + tzOffset);
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
      request({url: '/_view/l10n_reports?' + $.param(query)}, function (err, resp) {
        if (err) window.alert(err);

        context.reports = [ ];
        resp.rows.forEach(function (report) {
          var value = report.value;
          value.report_link = "#/l10n/report/" + report.id;
          value.time = new Date(value.time).toISOString();
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

          $("#subtitle").text("General Reports");

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
        context.app_name = resp.application_name;
        context.app_version = resp.application_version;
        context.platform_version = resp.platform_version;
        context.platform_buildId = resp.platform_buildid;
        context.app_locale = resp.application_locale;
        context.app_sourcestamp = resp.application_repository + "/rev/" + resp.application_changeset;
        context.system = resp.system_info.system;
        context.system_version = resp.system_info.version;
        context.service_pack = resp.system_info.service_pack;
        context.cpu = resp.system_info.processor;
        context.time_start = resp.time_start;
        context.time_end = resp.time_end;
        context.passed = resp.tests_passed;
        context.failed = resp.tests_failed;
        context.skipped = resp.tests_skipped;

        context.results = [];

        for (var i = 0; i < resp.results.length; i++) {
          var result = resp.results[i];

          var types = {
            'firefox-l10n' : 'l10n'
          };

          var type = types[resp.report_type];
          var filename = result.filename.split(type)[1].replace(/\\/g, '/');

          var status = "passed";
          if (result.skipped) {
            status = "skipped";
          } else if (result.failed) {
            status = "failed";
          }

          var failures =  [ ];
          try {
            if (result.skipped) {
              var information = result.skipped_reason;

              var re = /Bug ([\d]+)/g.exec(information);
              if (re) {
                var tmpl = '<a href="https://bugzilla.mozilla.org/show_bug.cgi?id=%s">Bug %s</a>';
                var link = tmpl.replace(/\%s/g, re[1]);
                failures.push(information.replace(re[0], link));
              }
            } else {
              for (var j = 0; j < result.fails.length; j++) {
                if ("exception" in result.fails[j])
                  failures.push(result.fails[j].exception.message);
                else if ("assertion" in result.fails[j])
                  failures.push(result.fails[j].assertion.message);
                else
                  failures.push("unknown failure");
              }
            }
          } catch (ex) { }

          context.results.push({
            filename : filename,
            test : result.name,
            status : status,
            failures: failures
          });
        }

        context.render(template).replace('#content').then(function () {
          $("#all").fadeOut();
          $("#all").click(function (event) {
            $("#filter a").fadeIn();
            $("#all").fadeOut();
            $("tr.passed").fadeIn("slow");
            $("tr.failed").fadeIn("slow");
            $("tr.skipped").fadeIn("slow");
             event.preventDefault();
          });

          $("#passed").click(function (event) {
            $("#filter a").fadeIn();
            $("#passed").fadeOut();
            $("tr.passed").fadeIn("slow");
            $("tr.failed").fadeOut("slow");
            $("tr.skipped").fadeOut("slow");
             event.preventDefault();
          });

          $("#failed").click(function (event) {
            $("#filter a").fadeIn();
            $("#failed").fadeOut();
            $("tr.passed").fadeOut("slow");
            $("tr.failed").fadeIn("slow");
            $("tr.skipped").fadeOut("slow");
             event.preventDefault();
          });

          $("#skipped").click(function (event) {
            $("#filter a").fadeIn();
            $("#skipped").fadeOut();
            $("tr.passed").fadeOut("slow");
            $("tr.failed").fadeOut("slow");
            $("tr.skipped").fadeIn("slow");
             event.preventDefault();
          });

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
      request({url: '/_view/endurance_reports?' + $.param(query)}, function (err, resp) {
        if (err) window.alert(err);

        context.reports = [ ];
        resp.rows.forEach(function (report) {
          var value = report.value;
          value.report_link = "#/endurance/report/" + report.id;
          value.time = new Date(value.time).toISOString();
          value.delay = value.delay * 1/1000;
          value.min_allocated_memory = Math.round(min(value.allocated_memory) * BYTE_TO_MEGABYTE);
          value.max_allocated_memory = Math.round(max(value.allocated_memory) * BYTE_TO_MEGABYTE);
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

    var endurance_report = function() {
      var context = this;

      var id = this.params.id ? this.params.id : 'null';
      var template = '/templates/endurance_report.mustache';

      request({url: '/db/' + id}, function (err, resp) {
        if (err) window.alert(err);

        context.id = resp._id;
        context.app_name = resp.application_name;
        context.app_version = resp.application_version;
        context.platform_version = resp.platform_version;
        context.platform_buildId = resp.platform_buildid;
        context.app_locale = resp.application_locale;
        context.app_sourcestamp = resp.application_repository + "/rev/" + resp.application_changeset;
        if (resp.addons !== undefined) {
          context.extensions = resp.addons.filter(function (item) { return (item.type === "extension") });
          context.themes = resp.addons.filter(function (item) { return (item.type === "theme") });
          context.plugins = resp.addons.filter(function (item) { return (item.type === "plugin") });
        }
        context.system = resp.system_info.system,
        context.system_version = resp.system_info.version,
        context.service_pack = resp.system_info.service_pack,
        context.cpu = resp.system_info.processor,
        context.time_start = resp.time_start;
        context.time_end = resp.time_end;
        context.passed = resp.tests_passed;
        context.failed = resp.tests_failed;
        context.skipped = resp.tests_skipped;
        context.tests = [];
        context.checkpoints = [];

        var tests = resp.endurance.results;
        var testCount = tests.length;
        var allCheckpoints = [];
        var allocatedMemoryResults = [];
        var mappedMemoryResults = [];
        var testAverageAllocatedMemoryResults = [];
        var testAverageMappedMemoryResults = [];

        for (var i=0; i < testCount; i++) {
            var testAllocatedMemoryResults = [];
            var testMappedMemoryResults = [];
            var testIterationCount = tests[i].iterations.length;
            var testCheckpointCount = tests[i].iterations[0].checkpoints.length;

            var types = {
              'firefox-endurance' : 'endurance'
            };

            for (var j=0; j < testIterationCount; j++) {
              for (var k=0; k < testCheckpointCount; k++) {

                var filename = tests[i].testFile;
                try {
                  var type = types[resp.report_type];
                  filename = filename.split(type)[1].replace(/\\/g, '/');
                }
                catch (ex) {
                }

                allCheckpoints.push({
                  testFile : filename,
                  testMethod : tests[i].testMethod,
                  label : tests[i].iterations[j].checkpoints[k].label,
                  allocatedMemory : Math.round(tests[i].iterations[j].checkpoints[k].allocated * BYTE_TO_MEGABYTE),
                  mappedMemory : Math.round(tests[i].iterations[j].checkpoints[k].mapped * BYTE_TO_MEGABYTE)
                });

                testAllocatedMemoryResults.push(Math.round(tests[i].iterations[j].checkpoints[k].allocated * BYTE_TO_MEGABYTE));
                testMappedMemoryResults.push(Math.round(tests[i].iterations[j].checkpoints[k].mapped * BYTE_TO_MEGABYTE));
              }
            }

            allocatedMemoryResults = allocatedMemoryResults.concat(testAllocatedMemoryResults);
            mappedMemoryResults = mappedMemoryResults.concat(testMappedMemoryResults);
            testAverageAllocatedMemoryResults.push(average(testAllocatedMemoryResults));
            testAverageMappedMemoryResults.push(average(testMappedMemoryResults));

            context.tests.push({
              testFile : tests[i].testFile.split(type)[1].replace(/\\/g, '/'),
              testMethod : tests[i].testMethod,
              checkpointCount : testCheckpointCount,
              minAllocatedMemory : min(testAllocatedMemoryResults),
              maxAllocatedMemory : max(testAllocatedMemoryResults),
              averageAllocatedMemory : Math.round(average(testAllocatedMemoryResults)),
              minMappedMemory : min(testMappedMemoryResults),
              maxMappedMemory : max(testMappedMemoryResults),
              averageMappedMemory : Math.round(average(testMappedMemoryResults))
            });
        }

        var maximumCheckpoints = 450;
        var divisor = Math.ceil(allCheckpoints.length / maximumCheckpoints);
        if (allCheckpoints.length < maximumCheckpoints) {
          context.checkpoints = allCheckpoints;
        } else {
          for (var i=0; i < allCheckpoints.length; i++) {
            if (i % divisor === 0) {
              context.checkpoints.push(allCheckpoints[i]);
            }
          }
        };

        context.delay = resp.endurance.delay * 1/1000;
        context.iterations = resp.endurance.iterations;
        context.testCount = testCount;
        context.checkpointCount = allCheckpoints.length;
        context.checkpointsPerTest = Math.round(context.checkpoints.length / testCount);
        context.allocatedMemoryResults = allocatedMemoryResults;
        context.minAllocatedMemory = min(allocatedMemoryResults);
        context.maxAllocatedMemory = max(allocatedMemoryResults);
        context.averageAllocatedMemory = Math.round(average(allocatedMemoryResults));
        context.testAverageAllocatedMemoryResults = testAverageAllocatedMemoryResults;
        context.mappedMemoryResults = mappedMemoryResults;
        context.minMappedMemory = min(mappedMemoryResults);
        context.maxMappedMemory = max(mappedMemoryResults);
        context.averageMappedMemory = Math.round(average(mappedMemoryResults));
        context.testAverageMappedMemoryResults = testAverageMappedMemoryResults;

        context.render(template).replace('#content').then(function () {

          $("#results").tablesorter();
 
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
      request({url: '/_view/addons_reports?' + $.param(query)}, function (err, resp) {
        if (err) window.alert(err);

        context.reports = [ ];
        resp.rows.forEach(function (report) {
          var value = report.value;
          value.report_link = "#/addons/report/" + report.id;
          value.time = new Date(value.time).toISOString();
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

          $("#subtitle").text("General Reports");

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
        context.app_name = resp.application_name;
        context.app_version = resp.application_version;
        context.platform_version = resp.platform_version;
        context.platform_buildId = resp.platform_buildid;
        context.app_locale = resp.application_locale;
        context.app_sourcestamp = resp.application_repository + "/rev/" + resp.application_changeset;
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

        context.results = [];

        for (var i = 0; i < resp.results.length; i++) {
          var result = resp.results[i];

          var types = {
            'firefox-addons' : 'addons'
          };

          var type = types[resp.report_type];
          var filename = result.filename.split(type)[1].replace(/\\/g, '/');

          var status = "passed";
          if (result.skipped) {
            status = "skipped";
          } else if (result.failed) {
            status = "failed";
          }

          var information = "";
          var stack = "";
          try {
            if (result.skipped) {
              information = result.skipped_reason;

              var re = /Bug ([\d]+)/g.exec(information);
              if (re) {
                var tmpl = '<a href="https://bugzilla.mozilla.org/show_bug.cgi?id=%s">Bug %s</a>';
                var link = tmpl.replace(/\%s/g, re[1]);
                information = information.replace(re[0], link);
              }
            } else {
              information = result.fails[0].exception.message;
              stack = result.fails[0].exception.stack;
            }
          } catch (ex) { }

          context.results.push({
            filename : filename,
            test : result.name,
            status : status,
            information: information,
            stack : stack
          });
        }

        context.render(template).replace('#content').then(function () {
          $("#all").fadeOut();
          $("#all").click(function (event) {
            $("#filter a").fadeIn();
            $("#all").fadeOut();
            $("tr.passed").fadeIn("slow");
            $("tr.failed").fadeIn("slow");
            $("tr.skipped").fadeIn("slow");
             event.preventDefault();
          });

          $("#passed").click(function (event) {
            $("#filter a").fadeIn();
            $("#passed").fadeOut();
            $("tr.passed").fadeIn("slow");
            $("tr.failed").fadeOut("slow");
            $("tr.skipped").fadeOut("slow");
             event.preventDefault();
          });

          $("#failed").click(function (event) {
            $("#filter a").fadeIn();
            $("#failed").fadeOut();
            $("tr.passed").fadeOut("slow");
            $("tr.failed").fadeIn("slow");
            $("tr.skipped").fadeOut("slow");
             event.preventDefault();
          });

          $("#skipped").click(function (event) {
            $("#filter a").fadeIn();
            $("#skipped").fadeOut();
            $("tr.passed").fadeOut("slow");
            $("tr.failed").fadeOut("slow");
            $("tr.skipped").fadeIn("slow");
             event.preventDefault();
          });

          $("#subtitle").text("Report Details");

          $(".selection").change(function() {
            window.location = this.value;
          });
        });
      });
    }


    // Index of all databases
    // Database view
    this.get('#/general', general_topFailures);
    this.get('#/general/top', general_topFailures);
    this.get('#/general/failure', general_failure);
    this.get('#/general/reports', general_reports);
    this.get('#/general/report/:id', general_report);
    this.get('#/update', update_reports);
    this.get('#/update/overview', update_overview);
    this.get('#/update/detail', update_detail);
    this.get('#/update/reports', update_reports);
    this.get('#/update/report/:id', update_report);
    this.get('#/l10n', l10n_reports);
    this.get('#/l10n/reports', l10n_reports);
    this.get('#/l10n/report/:id', l10n_report);
    this.get('#/endurance', endurance_reports);
    this.get('#/endurance/reports', endurance_reports);
    this.get('#/endurance/report/:id', endurance_report);
    this.get('#/addons', addons_reports);
    this.get('#/addons/reports', addons_reports);
    this.get('#/addons/report/:id', addons_report);
  });

  $(function() {
    app.run('#/general');
  });

})(jQuery);
