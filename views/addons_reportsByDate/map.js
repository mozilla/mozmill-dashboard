function(doc) {
  var report_types = ['firefox-addons'];
  
  if (doc.time_start &&
      doc.report_type && report_types.indexOf(doc.report_type) != -1) {

    emit(doc.time_start, {
      id: doc._id,
      time_start : doc.time_start,
      time_end : doc.time_end,
      application_name : doc.application_name,
      application_version : doc.application_version,
      application_locale : doc.application_locale,
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

