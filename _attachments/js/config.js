/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var FIREFOX_VERSIONS = ["28.0", "27.0", "26.0", "25.0", "24.0"];
var TESTS_REPOSITORY = "http://hg.mozilla.org/qa/mozmill-tests";

var DASHBOARD_SERVERS = [
  {urlVal: "mozmill-addons.blargon7.com", titleId: "Add-ons"},
  {urlVal: "mozmill-ci.blargon7.com", titleId: "CI"},
  {urlVal: "mozmill-crowd.blargon7.com", titleId: "Crowd"},
  {urlVal: "mozmill-daily.blargon7.com", titleId: "Daily"},
  {urlVal: "mozmill-ondemand.blargon7.com", titleId: "On Demand"},
  {urlVal: "mozmill-release.blargon7.com", titleId: "Release"},
  {urlVal: "mozmill-sandbox.blargon7.com", titleId: "Sandbox"},
  {urlVal: "mozmill-staging.blargon7.com", titleId: "Staging"}
];

var BYTE_TO_MEGABYTE = 1/1048576;
var MAX_CHART_CHECKPOINTS = 450;
