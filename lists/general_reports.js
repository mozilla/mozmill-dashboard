function(head, req) {
  var mustache = require("vendor/couchapp/lib/mustache");

  var ddoc = this;
  data = {
    title : "Firefox General Testrun Reports",
    site_title : ddoc.couchapp.name,
    path : "/general/reports",
    reports : []
  };

  provides("html", function() {
    var row = getRow();
    var key, value;
    var index = 1;

    if (row) {
      if (head.offset > 0)
        data.key_prev = row.key[0];
  
      do {
        key = row.key;
        value = row.value;

        if (index < req.query.limit) {
          data.reports.push({
            id : row.id,
            index : head.offset + index,
            time_start : value.time_start,
            time_end : value.time_end,
            application_version : value.application_version,
            application_branch : row.key[1],
            platform_branch : value.platform_branch,
            buildId : value.buildId,
            locale : value.application_locale,
            system : value.system,
            system_version : value.system_version,
            processor : value.processor,
            tests_passed : value.tests_passed,
            tests_failed : value.tests_failed,
            tests_skipped : value.tests_skipped
          });
        }
  
        index++;
      } while (row = getRow());

      if (head.offset + index < head.total_rows)
        data.key_next = key[0];
    }

    send(mustache.to_html(ddoc.templates.general.reports, data, ddoc.templates.partials));
  });
};
