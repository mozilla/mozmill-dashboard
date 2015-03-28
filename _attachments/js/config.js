/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var FIREFOX_VERSIONS = ["40", "39", "38", "37", "31"];

var UPDATE_CHANNELS = [
  "aurora",
  "auroratest",
  "beta",
  "betatest", // needed as long as not all branches are on aus4
  "beta-cdntest",
  "beta-localtest",
  "esr",
  "esrtest",
  "nightly",
  "nightly-esr31",
  "release",
  "releasetest",
];

var TESTS_REPOSITORY = "http://hg.mozilla.org/qa/mozmill-tests";

var DASHBOARD_SERVERS = [
  {urlVal: "mozmill-addons.blargon7.com", titleId: "Add-ons"},
  {urlVal: "mozmill-crowd.blargon7.com", titleId: "Crowd"},
  {urlVal: "mozmill-daily.blargon7.com", titleId: "Daily"},
  {urlVal: "mozmill-release.blargon7.com", titleId: "Release"},
  {urlVal: "mozmill-sandbox.blargon7.com", titleId: "Sandbox"},
  {urlVal: "mozmill-staging.blargon7.com", titleId: "Staging"}
];

var ROUTES = {
  "#/functional/top": "Functional Tests - Top Failures",
  "#/functional/reports": "Functional Tests - Reports",
  "#/functional/report": "Functional Tests - Report",
  "#/functional/failure": "Functional Tests - Failure",
  "#/update/overview": "Update Tests - Overview",
  "#/update/reports": "Update Tests - Reports",
  "#/update/report": "Update Tests - Report",
  "#/update/details": "Update Tests - Details",
  "#/l10n/reports": "L10n Tests - Reports",
  "#/l10n/report": "L10n Tests - Report",
  "#/endurance/charts": "Endurance Tests - Charts",
  "#/endurance/reports": "Endurance Tests - Reports",
  "#/endurance/report": "Endurance Tests - Report",
  "#/remote/top": "Remote Tests - Top Failures",
  "#/remote/reports": "Remote Tests - Reports",
  "#/remote/report": "Remote Tests - Report",
  "#/remote/failure": "Remote Tests - Failure",
  "#/addons/reports": "Add-ons Tests - Reports",
  "#/addons/report": "Add-ons Tests - Report"
};

var BYTE_TO_MEGABYTE = 1/1048576;
var MAX_CHART_CHECKPOINTS = 450;
