var couchapp = require('couchapp');
var path = require('path');

ddoc = {
  _id: '_design/dashboard',
  rewrites : [
    { from: "/",      to: 'index.html'},
    { from: "/db/",   to: '../../'},
    { from: "/db/*",  to: '../../*'},
    { from: "/*",     to: '*'}
  ]
};

ddoc.validate_doc_update = function(newDoc, oldDoc, userCtx) {
  const MAX_SIZE = 1024 * 1024 * 10;
  const FIREFOX_APP_ID = "{ec8030f7-c20a-464f-9b0e-13a3a9e97384}";

  if (newDoc._attachments) {
    throw ({ forbidden : "Attachments are not allowed" });
  }
  
  if (JSON.stringify(newDoc).length > MAX_SIZE){
    throw({ forbidden : "Document is too large to be stored" });
  }

  // If we have a document on disk check if user is logged in 
  if (oldDoc && userCtx.roles.indexOf('_admin') === -1) {
    // We only allow deleting if there is an admin
    if (newDoc._deleted) {
      throw ({ forbidden : "Only an admin is allowed to delete data" });
    } else {
      throw ({ forbidden : "Modifying of data is not allowed" });
    }
  }

  var requiredFields = [ "application_id",
                         "mozmill_version",
                         "system_info",
                         "tests_passed",
                         "tests_failed",
                         "tests_skipped",
                         "time_start",
                         "time_end",
                         "report_type",
                         "report_version"];

  requiredFields.forEach(function (field) {
    if (!newDoc[field]) {
      throw ({ forbidden : "This document requires the field " + field });
    }
  });

  if (newDoc.application_id !== FIREFOX_APP_ID) {
    throw ({ forbidden : "This document requires the Firefox Application ID"});
  }
}

var functionalReportsMap = function(doc) {
  const REPORT_TYPES = [
    'firefox-functional',
    'mozmill',
    'mozmill-restart',
  ];

  if (doc.time_start &&
      doc.application_version &&
      doc.system_info.system &&
      doc.report_type &&
      REPORT_TYPES.indexOf(doc.report_type) != -1) {

    var application_branch = doc.application_version.match(/(\d+\.\d+)\.*/)[1];

    var r = {
      time_start : doc.time_start,
      time_end : doc.time_end,
      application_version : doc.application_version,
      build_id : doc.platform_buildid,
      system_name : doc.system_info.system,
      system_version : doc.system_info.version,
      processor : doc.system_info.processor,
      locale : doc.application_locale,
      tests_passed : doc.tests_passed,
      tests_failed : doc.tests_failed,
      tests_skipped : doc.tests_skipped
    };

    emit([application_branch, r.system_name, doc.time_start], r);
    emit(['All', r.system_name, doc.time_start], r);
    emit([application_branch, 'All', doc.time_start], r);
    emit(['All', 'All', doc.time_start], r);
  }
}

var functionalFailuresMap = function(doc) {
  const REPORT_TYPES = [
    'firefox-functional',
    'mozmill',
    'mozmill-restart',
  ];

  if (doc.time_start &&
      doc.application_version &&
      doc.system_info.system &&
      doc.results &&
      doc.report_type &&
      REPORT_TYPES.indexOf(doc.report_type) != -1) {

    var application_branch = doc.application_version.match(/(\d+\.\d+)\.*/)[1];

    doc.results.forEach(function(result) {
      var path = null;

      try {
        path = result.filename.match('.*functional(.*)')[1];
      }
      catch (ex) {
        path = result.filename.match('.*firefox(.*)')[1];
      }
      path = path.replace(/\\/g, "/");

      // Only map result if failures are present
      if (result.failed > 0) {
        for (var i = 0; i < result.fails.length; i++) {
          var failure = result.fails[i];
          var message = "Unknown Failure";

          if ("exception" in failure)
            message = failure.exception.message;
          else if ("fail" in failure)
            message = failure.fail.message;

          // The result object has to be created inside the loop, otherwise the
          // message is always the one from the last iteration. No idea why.
          var r = {
            application_locale : doc.application_locale,
            application_version : doc.application_version,
            application_branch : application_branch,
            platform_buildId : doc.platform_buildid,
            platform_repository : doc.platform_repository,
            platform_changeset : doc.platform_changeset,
            system_name : doc.system_info.system,
            system_version : doc.system_info.version,
            test_module : path,
            test_function : result.name,
            message : message
          };

          emit([application_branch, doc.system_info.system, path, doc.time_start, i], r);
          emit([application_branch, doc.system_info.system, 'All', doc.time_start, i], r);
  
          emit([application_branch, 'All', path, doc.time_start, i], r);
          emit([application_branch, 'All', 'All', doc.time_start, i], r);
  
          emit(['All', doc.system_info.system, path, doc.time_start, i ], r);
          emit(['All', doc.system_info.system, 'All', doc.time_start, i], r);
  
          emit(['All', 'All', path, doc.time_start, i], r);
          emit(['All', 'All', 'All', doc.time_start, i], r);
        }
      }
    });
  }
}

var updateReportsMap = function(doc) {
  const REPORT_TYPES = [
    'firefox-update'
  ];

  if (doc.time_start &&
      doc.application_version &&
      doc.system_info.system &&
      doc.report_type &&
      REPORT_TYPES.indexOf(doc.report_type) != -1) {

    var application_branch = doc.application_version.match(/(\d+\.\d+)\.*/)[1];

    var r = {
      time_start : doc.time_start,
      time_end : doc.time_end,
      application_version : doc.application_version,
      build_id : doc.platform_buildid,
      system_name : doc.system_info.system,
      system_version : doc.system_info.version,
      processor : doc.system_info.processor,
      locale : doc.application_locale,
      tests_passed : doc.tests_passed,
      tests_failed : doc.tests_failed,
      tests_skipped : doc.tests_skipped
    };

    emit([application_branch, r.system_name, doc.time_start], r);
    emit(['All', r.system_name, doc.time_start], r);
    emit([application_branch, 'All', doc.time_start], r);
    emit(['All', 'All', doc.time_start], r);
  }
}

var updateDefaultMap = function(doc) {
  const REPORT_TYPES = [
    'firefox-update'
  ];

  if (doc.time_start &&
      doc.application_version &&
      doc.system_info.system &&
      doc.updates &&
      doc.report_type &&
      REPORT_TYPES.indexOf(doc.report_type) != -1) {

    var application_branch = doc.application_version.match(/(\d+\.\d+)\.*/)[1];

    var r = {
      application_locale : doc.application_locale,
      application_branch : application_branch,
      system_name : doc.system_info.system,
      system_version : doc.system_info.version,
      tests_passed : doc.tests_passed,
      tests_failed : doc.tests_failed
    };

    // Additional information from update results
    var updateCount = doc.updates.length;
    if (updateCount > 0) {
      r.pre_build = doc.updates[0].build_pre.version;
      r.post_build = doc.updates[updateCount - 1].build_post.version;
      r.channel = doc.updates[0].patch.channel;
    }
    else {
      r.pre_build = "n/a";
      r.post_build = doc.application_version;
      r.channel = "n/a";
    }

    emit([application_branch, r.channel, r.pre_build, r.post_build, doc.time_start], r);

    emit([application_branch, r.channel, r.pre_build, 'All', doc.time_start], r);

    emit([application_branch, r.channel, 'All', r.post_build, doc.time_start], r);
    emit([application_branch, r.channel, 'All', 'All', doc.time_start], r);

    emit([application_branch, 'All', r.pre_build, r.post_build, doc.time_start], r);
    emit([application_branch, 'All', r.pre_build, 'All', doc.time_start], r);
    emit([application_branch, 'All', 'All', r.post_build, doc.time_start], r);
    emit([application_branch, 'All', 'All', 'All', doc.time_start], r);

    emit(['All', r.channel, r.pre_build, r.post_build, doc.time_start], r);
    emit(['All', r.channel, r.pre_build, 'All', doc.time_start], r);
    emit(['All', r.channel, 'All', r.post_build, doc.time_start], r);
    emit(['All', r.channel, 'All', 'All', doc.time_start], r);
    emit(['All', 'All', r.pre_build, r.post_build, doc.time_start], r);
    emit(['All', 'All', r.pre_build, 'All', doc.time_start], r);
    emit(['All', 'All', 'All', r.post_build, doc.time_start], r);
    emit(['All', 'All', 'All', 'All', doc.time_start], r);
  }
}

var l10nReportsMap = function (doc) {
  const REPORT_TYPES = [
    'firefox-l10n'
  ];

  if (doc.time_start &&
      doc.application_version &&
      doc.system_info.system &&
      doc.report_type &&
      REPORT_TYPES.indexOf(doc.report_type) != -1) {

    var application_branch = doc.application_version.match(/(\d+\.\d+)\.*/)[1];

    var r = {
      time_start : doc.time_start,
      time_end : doc.time_end,
      application_version : doc.application_version,
      build_id : doc.platform_buildid,
      system_name : doc.system_info.system,
      system_version : doc.system_info.version,
      processor : doc.system_info.processor,
      locale : doc.application_locale,
      tests_passed : doc.tests_passed,
      tests_failed : doc.tests_failed,
      tests_skipped : doc.tests_skipped
    };

    emit([application_branch, r.system_name, doc.time_start], r);
    emit(['All', r.system_name, doc.time_start], r);
    emit([application_branch, 'All', doc.time_start], r);
    emit(['All', 'All', doc.time_start], r);
  }
}

var enduranceReportsMap = function(doc) {
  const REPORT_TYPES = [
    'firefox-endurance'
  ];

  if (doc.time_start &&
      doc.application_version &&
      doc.system_info.system &&
      doc.report_type &&
      REPORT_TYPES.indexOf(doc.report_type) != -1) {

    var application_branch = doc.application_version.match(/(\d+\.\d+)\.*/)[1];

    var r = {
      time_start : doc.time_start,
      time_end : doc.time_end,
      application_version : doc.application_version,
      build_id : doc.platform_buildid,
      system_name : doc.system_info.system,
      system_version : doc.system_info.version,
      processor : doc.system_info.processor,
      locale : doc.application_locale,
      tests_passed : doc.tests_passed,
      tests_failed : doc.tests_failed,
      tests_skipped : doc.tests_skipped,
      delay : doc.endurance.delay,
      iterations : doc.endurance.iterations,
      stats : doc.endurance.stats
    };

    emit([application_branch, r.system_name, doc.time_start], r);
    emit(['All', r.system_name, doc.time_start], r);
    emit([application_branch, 'All', doc.time_start], r);
    emit(['All', 'All', doc.time_start], r);
  }
}

var remoteReportsMap = function(doc) {
  const REPORT_TYPES = [
    'firefox-remote'
  ];

  if (doc.time_start &&
      doc.application_version &&
      doc.system_info.system &&
      doc.report_type &&
      REPORT_TYPES.indexOf(doc.report_type) != -1) {

    var application_branch = doc.application_version.match(/(\d+\.\d+)\.*/)[1];

    var r = {
      time_start : doc.time_start,
      time_end : doc.time_end,
      application_version : doc.application_version,
      build_id : doc.platform_buildid,
      system_name : doc.system_info.system,
      system_version : doc.system_info.version,
      processor : doc.system_info.processor,
      locale : doc.application_locale,
      tests_passed : doc.tests_passed,
      tests_failed : doc.tests_failed,
      tests_skipped : doc.tests_skipped
    };

    emit([application_branch, r.system_name, doc.time_start], r);
    emit(['All', r.system_name, doc.time_start], r);
    emit([application_branch, 'All', doc.time_start], r);
    emit(['All', 'All', doc.time_start], r);
  }
}

var addonsReportsMap = function(doc) {
  const REPORT_TYPES = [
    'firefox-addons'
  ];

  if (doc.time_start &&
      doc.application_version &&
      doc.system_info.system &&
      doc.report_type &&
      REPORT_TYPES.indexOf(doc.report_type) != -1) {

    var application_branch = doc.application_version.match(/(\d+\.\d+)\.*/)[1];

    var r = {
      time_start : doc.time_start,
      time_end : doc.time_end,
      application_version : doc.application_version,
      build_id : doc.platform_buildid,
      system_name : doc.system_info.system,
      system_version : doc.system_info.version,
      processor : doc.system_info.processor,
      locale : doc.application_locale,
      tests_passed : doc.tests_passed,
      tests_failed : doc.tests_failed,
      tests_skipped : doc.tests_skipped,
      addon_name : doc.target_addon.name,
      addon_version : doc.target_addon.version
    };

    emit([application_branch, r.system_name, doc.time_start], r);
    emit(['All', r.system_name, doc.time_start], r);
    emit([application_branch, 'All', doc.time_start], r);
    emit(['All', 'All', doc.time_start], r);
  }
}


ddoc.views = {
  functional_reports : { map: functionalReportsMap },
  functional_failures : { map: functionalFailuresMap },
  update_reports : { map: updateReportsMap },
  update_default : { map: updateDefaultMap },
  l10n_reports : { map: l10nReportsMap },
  endurance_reports : { map: enduranceReportsMap },
  endurance_charts : { map: enduranceReportsMap },
  remote_reports : { map: remoteReportsMap },
  addons_reports : { map: addonsReportsMap }
}

couchapp.loadAttachments(ddoc, path.join(__dirname, '_attachments'))

module.exports = ddoc
