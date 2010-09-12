function(doc) {
  var report_types = ['firefox-general', 'mozmill', 'mozmill-restart'];
  var platform_versions = {'4.0' : 'mozilla2.0',
                           '3.6' : 'mozilla1.9.2',
                           '3.5' : 'mozilla1.9.1'
                          };
  
  if (doc.time_start &&
      doc.report_type && report_types.indexOf(doc.report_type) != -1) {

      var application_branch = doc.application_version.match(/(\d\.\d)\.*/)[1];
      var platform_branch = platform_versions[application_branch];

    emit([doc.time_start, application_branch],
    {
      id: doc._id,
      time_start : doc.time_start,
      time_end : doc.time_end,
      application_name : doc.application_name,
      application_version : doc.application_version,
      application_locale : doc.application_locale,
      platform_branch : platform_branch,
      buildId : doc.platform_buildid,
      system : doc.system_info.system,
      system_version : doc.system_info.version,
      processor : doc.system_info.processor,
      tests_passed : doc.tests_passed,
      tests_failed : doc.tests_failed,
      tests_skipped : doc.tests_skipped
    });
  }
}

