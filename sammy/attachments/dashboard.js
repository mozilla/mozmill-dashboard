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
  
  // var indexRoute = function () {
  //   this.render('/templates/index.mustache').replace('#content').then(app.index);
  // }
  var general = function () {
    var branch = this.params.branch ? this.params.branch : 'All'
      , os = this.params.os ? this.params.os : 'All'
      ;
    
    this.render('/templates/report.mustache').replace('#content').then(function () {
      var limit = 0
        , skip = 0
        ;
              
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
      })
        .click(function () { window.location = '/#/general/'+branch+'/'+this.textContent })
                        
      var addResults = function () {
        var query = {
          startkey: JSON.stringify([branch, os, {}])
          , endkey: JSON.stringify([branch, os])
          , descending: "true"
          // , limit: String(limit) + $("input.pagination").val()
          // , skip: String(skip)
        }
        
        request({url:'/_view/general?'+$.param(query)}, function (err, resp) {
          var entries = '';
          if (err) console.log(err);

          resp.rows.forEach(function (row) {
            var v = row.value;
            entries += ( '<tr>' + 
              "<td><a>" + v.time_start + "</a></td>" +
              "<td>" + v.application_version + "</td>" + 
              "<td>" + v.buildId + "</td>" + 
              "<td>"+ v.system +"</td>" +
              "<td>{{system_version}}</td>" +
              "<td>{{processor}}</td>" +
              "<td>{{application_locale}}</td>" +
              "<td>{{tests_passed}}</td>" +
              "<td>{{tests_skipped}}</td>" +
              "<td>{{tests_failed}}</td>" +
              "</tr>"
            )
          })
          $("#resultsBody").append(entries)
          limit += $("input.pagination").val();
          skip += $("input.pagination").val();
        });
      }
      addResults();
      $("span.pagination").click(addResults);
    });
  }
  
  var topFailures = function () {
    
  }
  
  // Index of all databases
  // this.get('', indexRoute);
  // this.get("#/", indexRoute);
  // Database view
  this.get('#/topFailures', topFailures);
  this.get('#/general', general);
  this.get('#/general/:branch/:os', general);
})

$(function () {a.use('Mustache'); a.run(); });
