function() {
  var row, ddoc = this,
  mustache = require("vendor/couchapp/lib/mustache"),
  markdown = require("vendor/couchapp/lib/markdown"),

  data = {
    title : "All Reports",
    site_title : this.couchapp.name,
    //path : "reports/_list/reports/reportByDate",
    reports : []
  };

  provides("html", function() {
    while (row = getRow()) {
      log(row)
      //data.reports.concat(row.value);
      data.reports.push({
        id : row.id,
        type : row.value.report_type,
        time_start : row.value.time_start,
        time_end : row.value.time_end,
        product : row.value.application_name,
        version : row.value.application_version,
        build : row.value.platform_buildid,
        locale : row.value.application_locale,
        system : row.value.system_info.system,
        system_version : row.value.system_info.version,
        cpu : row.value.system_info.processor,
        passed : row.value.tests_passed,
        failed : row.value.tests_failed,
        skipped : row.value.tests_skipped
      });
    }
    send(mustache.to_html(ddoc.templates.reports, data, ddoc.templates.partials));
  });
};
