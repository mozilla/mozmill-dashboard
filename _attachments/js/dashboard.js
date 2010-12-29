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

var a = $.sammy(function () {

  var general_reports = function() {
    var branch = this.params.branch ? this.params.branch : 'All';
    var platform = this.params.platform ? this.params.platform : 'All';

    var query = {
      startkey: JSON.stringify([branch, platform, {}]),
      endkey: JSON.stringify([branch, platform]),
      descending: "true",
      limit: 300
    };

    var context = this;
    request({url: '/_view/general_reports?' + $.param(query)}, function (err, resp) {
      if (err) window.alert(err);

      context.reports = [ ];
      resp.rows.forEach(function (report) {
        var value = report.value;
        value.report_link = "#/general/report/" + report.id;
        value.time = new Date(value.time).format("yyyy/mm/dd HH:MM:ss");
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
          window.location = '/#/general/reports?branch=' + this.textContent + '&platform=' + platform;
        })
        
        $('#os-selection span').each(function (i, elem) {
          if (elem.textContent == platform) {
            $(elem).addClass("selected")
          }
        })

        $('#os-selection span').click(function () {
          window.location = '/#/general/reports?branch=' + branch + '&platform=' + this.textContent
        })
  
        $("#results").tablesorter({ 
          // sort on the first column and third column, order asc 
          sortList: [[0,1]] 
        });
  
        $("#subtitle").text("General Reports");
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
    if (this.params.from)
      fromDate = new Date(this.params.from);
    else {
      fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - 7);
    }

    var toDate;
    if (this.params.to)
      toDate = new Date(this.params.to);
    else {
      toDate = new Date();
    }

    var query = {
      startkey : JSON.stringify([branch, platform, test, toDate.format("yyyy-mm-dd") + "T23:59:59"]),
      endkey : JSON.stringify([branch, platform, test, fromDate.format("yyyy-mm-dd") + "T00:00:00"]),
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
          value.time = new Date(row.key[3]).format("yyyy/mm/dd HH:MM:ss");
          value.report_link = "#/general/report/" + row.id;

          context.reports.push(value);
        }
      });

      var template = '/templates/general_failure.mustache';
      context.render(template).replace('#content').then(function () {
        var limit = 0;
        var skip = 0;
  
        $('#branch-selection span').each(function (i, elem) {
          if (elem.textContent == branch) {
            $(elem).addClass("selected")
          }
        })
        $('#branch-selection span').click(function () {
          window.location = '/#/general/failure?branch=' + this.textContent +
                            '&platform=' + platform + '&from=' + fromDate.format("yyyy-mm-dd") +
                            '&to=' + toDate.format("yyyy-mm-dd") + "&test=" +
                            encodeURIComponent(test) + '&func=' + encodeURIComponent(test_func);
        })
        
        $('#os-selection span').each(function (i, elem) {
          if (elem.textContent == platform) {
            $(elem).addClass("selected")
          }
        })
        $('#os-selection span').click(function () {
          window.location = '/#/general/failure?branch=' + branch +
                            '&platform=' + this.textContent + '&from=' + fromDate.format("yyyy-mm-dd") +
                            '&to=' + toDate.format("yyyy-mm-dd") + "&test=" +
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
      startkey : JSON.stringify([branch, platform, 'All', toDate.format("yyyy-mm-dd", true) + "T23:59:59"]),
      endkey : JSON.stringify([branch, platform, 'All', fromDate.format("yyyy-mm-dd", true) + "T00:00:00"]),
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
                         entries[3] + '&from=' + fromDate.format("yyyy-mm-dd", true) +
                        '&to=' + toDate.format("yyyy-mm-dd", true) + "&test=" +
                        encodeURIComponent(entries[0]) + "&func=" +
                        encodeURIComponent(entries[1]),
          failure_count : failures[key]
        });
      };

      var template = '/templates/general_failures.mustache';
      context.render(template).replace('#content').then(function () {
        var limit = 0;
        var skip = 0;
  
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

        $('#start-date').datepicker().val(fromDate.format("yyyy-mm-dd", true)).trigger('change');
        $('#end-date').datepicker().val(toDate.format("yyyy-mm-dd", true)).trigger('change');

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
      context.system = resp.system_info.system,
      context.system_version = resp.system_info.version,
      context.service_pack = resp.system_info.service_pack,
      context.cpu = resp.system_info.processor,
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
          'mozmill-test' : 'firefox',
          'mozmill-restart-test' : 'firefox',
          'firefox-update' : 'softwareUpdate',
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
        $("#result").tablesorter({ 
          // sort on the first column and third column, order asc 
          sortList: [[0,0],[1,0]] 
        });
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

  var update_reports = function() {
    var branch = this.params.branch ? this.params.branch : 'All';
    var platform = this.params.platform ? this.params.platform : 'All';

    var query = {
      startkey: JSON.stringify([branch, platform, {}]),
      endkey: JSON.stringify([branch, platform]),
      descending: "true",
      limit: 100
    };

    var context = this;
    request({url: '/_view/update_reports?' + $.param(query)}, function (err, resp) {
      if (err) window.alert(err);

      context.reports = [ ];
      resp.rows.forEach(function (report) {
        var value = report.value;
        value.report_link = "#/update/report/" + report.id;
        value.time = new Date(value.time).format("yyyy/mm/dd HH:MM:ss", true);
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
          window.location = '/#/update/reports?branch=' + this.textContent + '&platform=' + platform;
        })
        
        $('#os-selection span').each(function (i, elem) {
          if (elem.textContent == platform) {
            $(elem).addClass("selected")
          }
        })

        $('#os-selection span').click(function () {
          window.location = '/#/update/reports?branch=' + branch + '&platform=' + this.textContent
        })
  
        $("#results").tablesorter({ 
          // sort on the first column and third column, order asc 
          sortList: [[0,1]] 
        });
  
        $("#subtitle").text("Update Reports");
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
      context.system = resp.system_info.system,
      context.system_version = resp.system_info.version,
      context.service_pack = resp.system_info.service_pack,
      context.cpu = resp.system_info.processor,
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
          'firefox-general' : 'firefox',
          'mozmill-test' : 'firefox',
          'mozmill-restart-test' : 'firefox',
          'firefox-update' : 'softwareUpdate',
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
        $("#result").tablesorter({ 
          // sort on the first column and third column, order asc 
          sortList: [[0,0],[1,0]] 
        });
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


  var fallback = function() {
    window.location = "/#/general";
  }

  // Index of all databases
  // Database view
  this.get('#/general', general_topFailures);
  this.get('#/general/top', general_topFailures);
  this.get('#/general/failure', general_failure);
  this.get('#/general/reports', general_reports);
  this.get('#/general/report/:id', general_report);
  this.get('#/update', update_reports);
  this.get('#/update/reports', update_reports);
  this.get('#/update/report/:id', update_report);
  this.get(/\.*/, fallback);
  
})

$(function() {
  a.use('Mustache');
  a.run();
});
