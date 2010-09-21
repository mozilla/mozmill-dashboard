function(head, req) {
  var mustache = require("vendor/couchapp/lib/mustache");

  var ddoc = this;

  data = {
    site_title : ddoc.couchapp.name,
    page_title : "Firefox General Testrun Reports",
    path : "/general/reports",
    reports : []
  };

  provides("html", function() {
    var key, report;
    var index = 1;

    var row = getRow();

    if (row) {
      if (head.offset > 0) {
        data.key_prev = row.key[0];
        data.docid_prev = row.id;
      }
  
      do {
        key = row.key;
        report = row.value;

        if (index < req.query.limit) {
          report.id = row.id;
          report.index = head.offset + index,
          report.application_branch = key[1];
          data.reports.push(report);
        }

        index++;
      } while (row = getRow());

      if (head.offset + index < head.total_rows) {
        data.key_next = key[0];
        data.docid_next = report.id;
      }
    }

    send(mustache.to_html(ddoc.templates.general.reports, data, ddoc.templates.partials));
  });
};
