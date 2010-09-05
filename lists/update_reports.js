function(head, req) {
  var ddoc = this;
  var mustache = require("vendor/couchapp/lib/mustache");

  data = {
    title : "All Firefox Update Testrun Reports",
    site_title : ddoc.couchapp.name,
    reports : []
  };

  provides("html", function() {
    while (row = getRow()) {
      var value = row.value;

      data.reports.push({
        id : value.id,
        time_start : value.time_start,
        time_end : value.time_end,
        version : value.application_version,
        build : value.buildId,
        locale : value.application_locale,
        system : value.system,
        system_version : value.system_version,
        cpu : value.processor,
        passed : value.tests_passed,
        failed : value.tests_failed,
        skipped : value.tests_skipped
      });
    }
    send(mustache.to_html(ddoc.templates.general.reports, data, ddoc.templates.partials));
  });
};
