function(doc, req) {
  var name, stub, ddoc = this,
    mustache = require("vendor/couchapp/lib/mustache"),
    markdown = require("vendor/couchapp/lib/markdown"),
    data = {
      docid : JSON.stringify(req.id),
      id : req.id,
      path : "/result/" + req.id,
      site_title : this.couchapp.name
    };

  if (doc) {
    data.title = doc._id;
    data.report_type = doc.report_type
    data.app_name = doc.application_name;
    data.app_version = doc.application_version;
    data.platform_version = doc.platform_version;
    data.app_locale = doc.application_locale;
    data.app_sourcestamp = doc.application_repository + "/rev/" + doc.application_changeset;
    data.system = doc.system_info.system,
    data.system_version = doc.system_info.version,
    data.service_pack = doc.system_info.service_pack,
    data.cpu = doc.system_info.processor,
    data.time_start = doc.time_start;
    data.time_end = doc.time_end;
    data.passed = doc.tests_passed;
    data.failed = doc.tests_failed;
    data.skipped = doc.tests_skipped;
    data.results = [];

    for each (var result in doc.results) {
      var types = {
        'firefox-general' : 'firefox/',
        'mozmill-test' : 'firefox/',
        'mozmill-restart-test' : 'firefox/',
        'firefox-update' : 'softwareUpdate',
        'firefox-addons' : 'addons/'
      };

      var type = types[doc.report_type];
      var filename = type + result.filename.split(type)[1]
      
      var status = "passed";
      if (result.skipped) {
        status = "skipped";
      } else if (result.failed) {
        status = "failed";
      }

      var information = "";
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
        }
      } catch (ex) { }

      data.results.push({
        filename : filename,
        test : result.name,
        status : status,
        information: information
      });
    }

    data.begin = "/";
    data.atts = [];
    if (doc._attachments) {
      for (name in doc._attachments) {
        if (name.indexOf("rev") != 0) {
          stub = doc._attachments[name];
          data.atts.push({
            name : name,
            uri : ["","pages", req.id, name].map(encodeURIComponent).join('/'),
            type : stub.content_type
          });
        }
      }
    }
    if (data.atts.length > 0) {
      data.has_atts = true;
    }
  }
  return mustache.to_html(ddoc.templates.report, data, ddoc.templates.partials);
}
