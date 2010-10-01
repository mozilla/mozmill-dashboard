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

var capitalize = function(s) {
  return s.replace( /(^|\s)([a-z])/g , function(m,p1,p2){ return p1+p2.toUpperCase(); } );
};

var a = $.sammy(function () {

  var general_reports = function() {
    var branch = this.params.branch ? this.params.branch : 'All';
    var os = this.params.os ? this.params.os : 'All';
    var template = '/templates/general_reports.mustache';

    this.render(template).replace('#content').then(function () {
      var limit = 0;
      var skip = 0;

      $('#branch-selection span').each(function (i, elem) {
        if (elem.textContent === branch) {
          $(elem).addClass("selected")
        }
      })
        .click(function () { window.location = '/#/general/'+this.textContent+'/'+os })
      
      $('#os-selection span').each(function (i, elem) {
        if (elem.textContent === os) {
          $(elem).addClass("selected")
        }
      }).click(function () {
        window.location = '/#/general/'+branch+'/'+this.textContent
      })

      var addResults = function () {
        var query = {
          startkey: JSON.stringify([branch, os, {}])
          , endkey: JSON.stringify([branch, os])
          , descending: "true"
          , limit: 25 //String(limit) + $("input.pagination").val()
          // , skip: String(skip)
        }
        
        request({url:'/_view/general_reports?'+$.param(query)}, function (err, resp) {
          var entries = '';
          if (err) console.log(err);

          resp.rows.forEach(function (row) {
            var v = row.value;
            entries += ( '<tr>' + 
              '<td><a href="#/general/report/' + v.id + '">' + v.time + '</a></td>' +
              "<td>" + v.application_version + "</td>" + 
              "<td>" + v.buildId + "</td>" + 
              "<td>"+ v.system +"</td>" +
              "<td>" + v.system_version + "</td>" +
              "<td>" + v.processor + "</td>" +
              "<td>" + v.application_locale + "</td>" +
              "<td>" + v.tests_passed + "</td>" +
              "<td>" + v.tests_skipped + "</td>" +
              "<td>" + v.tests_failed + "</td>" +
              "</tr>"
            )
          })
          $("#resultsBody").append(entries)
          limit += $("input.pagination").val();
          skip += $("input.pagination").val();
        });
      }

      addResults();
      $("#results").tablesorter({ 
        // sort on the first column and third column, order asc 
        sortList: [[3,0]] 
      });


      $("span.pagination").click(addResults);
      $("#subtitle").text("General Reports");
    });
  }
  
  
  var general_topFailures = function () {
    var context = this;

    var branch = this.params.branch ? this.params.branch : 'All';
    var os = this.params.os ? this.params.os : 'All';

    var template = '/templates/general_failures.mustache';

    this.render(template).replace('#content').then(function () {
      var limit = 0;
      var skip = 0;

      $('#branch-selection span').each(function (i, elem) {
        if (elem.textContent === branch) {
          $(elem).addClass("selected")
        }
      })
        .click(function () { window.location = '/#/general/top/'+this.textContent+'/'+os })
      
      $('#os-selection span').each(function (i, elem) {
        if (elem.textContent === os) {
          $(elem).addClass("selected")
        }
      }).click(function () {
        window.location = '/#/general/top/'+branch+'/'+this.textContent
      })

      var addResults = function () {
        var query = {
          startkey : JSON.stringify([branch, os, {}]),
          endkey : JSON.stringify([branch, os]),
          descending : true
          //reduce : false
        };

        request({url:'/_view/general_failures?'+$.param(query)}, function (err, resp) {
          if (err) console.log(err);

          // Build up the failures array
          var failures = [ ];
          resp.rows.forEach(function (row) {
            var v = row.value;
            var k = row.key;

            var index = k[3] + "|" + v.application_version + "|" + v.system;
            if (index in failures) {
              failures[index]++;
            } else {
              failures[index] = 1;
            }
          });
 
          var output = "";
          for (var key in failures) {
            var entries = key.split("|");
            var value = failures[key];

            output += ( '<tr>' + 
              '<td><a href="#/general/failure/' + entries[0] + '">' + entries[0] + '</a></td>' +
              "<td>" + entries[1] + "</td>" + 
              "<td>" + entries[2] + "</td>" + 
              "<td>"+ value +"</td>" +
              '<td class="bugs"></td>' +
              "</tr>"
            )
          };
          $("#resultsBody").append(output)
  
          limit += $("input.pagination").val();
          skip += $("input.pagination").val();
        });
      }
  
      addResults();
      $("span.pagination").click(addResults);
      $("#subtitle").text("Top Failures");

      $("#results").tablesorter({ 
        // sort on the first column and third column, order asc 
        sortList: [[3,0]] 
      });

    });
  }

  function general_report() {
    var context = this;
    
    var id = this.params.id ? this.params.id : 'null';
    var template = '/templates/report.mustache';

    request({url: '/db/' + id}, function (err, resp) {
      if (err) console.log(err);

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
        var filename = result.filename.split(type)[1].replace(/\\/, '/');

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
      });
    });

    $("#subtitle").text("Report Details");

  }
  
  // Index of all databases
  // Database view
  this.get('#/general/reports', general_reports);
  this.get('#/general/reports/:branch/:os', general_reports);
  this.get('#/general/top', general_topFailures);
  this.get('#/general/top/:branch/:os', general_topFailures);
  this.get('#/general/report/:id', general_report);

  
})

$(function() {
  a.use('Mustache');
  a.run();
});
