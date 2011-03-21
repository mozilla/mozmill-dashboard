var couchapp = require('couchapp');
var path = require('path');

ddoc = {
  _id: '_design/dashboard',
  rewrites : [
    { from: "/",      to: 'index.html'},
    { from: "/db/*",  to: '../../*'},
    { from: "/*",     to: '*'}
  ]
};


var generalReportsMap = function(doc) {
  const APP_TO_PLATFORM_BRANCH = {
    '4.0' : 'mozilla2.0',
    '3.7' : 'mozilla1.9.3',
    '3.6' : 'mozilla1.9.2',
    '3.5' : 'mozilla1.9.1'
  };

  const REPORT_TYPES = [
    'firefox-functional',
    'mozmill',
    'mozmill-restart',

    // For compatibility with older reports
    'firefox-general'
  ];

  if (doc.time_start &&
      doc.application_version &&
      doc.system_info.system &&
      doc.report_type &&
      REPORT_TYPES.indexOf(doc.report_type) != -1) {

    var application_branch = doc.application_version.match(/(\d\.\d)\.*/)[1];
    var platform_branch = APP_TO_PLATFORM_BRANCH[application_branch];

    var r = {
      time : doc.time_start,
      application_version : doc.application_version,
      build_id : doc.platform_buildid,
      platform_branch : platform_branch,
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

var generalFailuresMap = function(doc) {
  const REPORT_TYPES = [
    'firefox-functional',
    'mozmill',
    'mozmill-restart',

    // For compatibility with older reports
    'firefox-general'
  ];

  if (doc.time_start &&
      doc.application_version &&
      doc.system_info.system &&
      doc.results &&
      doc.report_type &&
      REPORT_TYPES.indexOf(doc.report_type) != -1) {

    var application_branch = doc.application_version.match(/(\d\.\d)\.*/)[1];

    doc.results.forEach(function(result) {
      var path = null;

      try {
        path = result.filename.match('.*functional(.*)')[1];
      }
      catch (ex) {
        path = result.filename.match('.*firefox(.*)')[1];
      }
      path = path.replace(/\\/g, "/");

      if (result.failed > 0) {
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
          message : (result.fails.length > 0) ? result.fails[0].exception.message : ""
        };

        emit([application_branch, doc.system_info.system, path, doc.time_start], r);
        emit([application_branch, doc.system_info.system, 'All', doc.time_start], r);

        emit([application_branch, 'All', path, doc.time_start], r);
        emit([application_branch, 'All', 'All', doc.time_start], r);

        emit(['All', doc.system_info.system, path, doc.time_start], r);
        emit(['All', doc.system_info.system, 'All', doc.time_start], r);

        emit(['All', 'All', path, doc.time_start], r);
        emit(['All', 'All', 'All', doc.time_start], r);
      }
    });
  }
}

var updateReportsMap = function(doc) {
  const APP_TO_PLATFORM_BRANCH = {
    '4.0' : 'mozilla2.0',
    '3.7' : 'mozilla1.9.3',
    '3.6' : 'mozilla1.9.2',
    '3.5' : 'mozilla1.9.1'
  };

  const REPORT_TYPES = [
    'firefox-update'
  ];

  if (doc.time_start &&
      doc.application_version &&
      doc.system_info.system &&
      doc.report_type &&
      REPORT_TYPES.indexOf(doc.report_type) != -1) {

    var application_branch = doc.application_version.match(/(\d\.\d)\.*/)[1];
    var platform_branch = APP_TO_PLATFORM_BRANCH[application_branch];

    var r = {
      time : doc.time_start,
      application_version : doc.application_version,
      build_id : doc.platform_buildid,
      platform_branch : platform_branch,
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

    var application_branch = doc.application_version.match(/(\d\.\d)\.*/)[1];

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
  const APP_TO_PLATFORM_BRANCH = {
    '4.0' : 'mozilla2.0',
    '3.7' : 'mozilla1.9.3',
    '3.6' : 'mozilla1.9.2',
    '3.5' : 'mozilla1.9.1'
  };

  const REPORT_TYPES = [
    'firefox-l10n'
  ];

  if (doc.time_start &&
      doc.application_version &&
      doc.system_info.system &&
      doc.report_type &&
      REPORT_TYPES.indexOf(doc.report_type) != -1) {

    var application_branch = doc.application_version.match(/(\d\.\d)\.*/)[1];
    var platform_branch = APP_TO_PLATFORM_BRANCH[application_branch];

    var r = {
      time : doc.time_start,
      application_version : doc.application_version,
      build_id : doc.platform_buildid,
      platform_branch : platform_branch,
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


ddoc.views = {
  general_reports : { map: generalReportsMap },
  general_failures : { map: generalFailuresMap },
  update_reports : { map: updateReportsMap },
  update_default : { map: updateDefaultMap },
  l10n_reports : { map: l10nReportsMap }
}

couchapp.loadAttachments(ddoc, path.join(__dirname, '_attachments'))

module.exports = ddoc
