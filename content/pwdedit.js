/*
    Saved Password Editor, extension for Firefox 3.0+
    Copyright (C) 2010  Daniel Dawson <ddawson@icehouse.net>

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

var stringsBundle, nologinform_string;

function el (name) {
  return document.getElementById(name);
}

function init (oldSignon) {
  if (!oldSignon) {
    oldSignon = Components.classes["@mozilla.org/login-manager/loginInfo;1"].
                  createInstance(Components.interfaces.nsILoginInfo);
    oldSignon.init("", "", "", "", "", "", "");
  }

  el("hostname_text").value = oldSignon.hostname;
  el("formSubmitURL_text").value = oldSignon.formSubmitURL;
  el("httpRealm_text").value = oldSignon.httpRealm;
  el("username_text").value = oldSignon.username;
  el("password_text").value = oldSignon.password;
  el("usernameField_text").value = oldSignon.usernameField;
  el("passwordField_text").value = oldSignon.passwordField;
  var st = el("signon_type");
  st.addEventListener("command", handle_typeSelect, false);
  if (oldSignon.httpRealm != null && oldSignon.httpRealm != "") {
    st.selectedIndex = 1;
    handle_typeSelect(null);
  }
}

window.addEventListener(
  "load",
  function (ev) {
    stringsBundle = document.getElementById("string-bundle");
    nologinform_string = stringsBundle.getString("nologinform");
    init(window.arguments[0]);
  },
  false);

function handle_typeSelect (evt) {
  var idx = el("signon_type").selectedIndex;
  if (idx == 0) {
    el("formSubmitURL_row").collapsed = false;
    el("httpRealm_row").collapsed = true;
    el("usernameField_row").collapsed = false;
    el("passwordField_row").collapsed = false;
    el("guessfrompage_btn").collapsed = false;
  } else {
    el("formSubmitURL_row").collapsed = true;
    el("httpRealm_row").collapsed = false;
    el("usernameField_row").collapsed = true;
    el("passwordField_row").collapsed = true;
    el("guessfrompage_btn").collapsed = true;
  }
}

function guessParameters () {
  // Locate the browser object for the last seen tab
  var curBrowser =
    Components.classes["@mozilla.org/appshell/window-mediator;1"].
    getService(Components.interfaces.nsIWindowMediator).
    getMostRecentWindow("navigator:browser").document.
    getElementById("content").selectedBrowser;

  // Get the host prefix
  var curLocation = curBrowser.contentWindow.location;
  var hostname = curLocation.protocol + "//" + curLocation.host;

  // Locate a likely login form and its fields
  var curDoc = curBrowser.contentDocument;
  var pwdField = curDoc.evaluate(
    '//form//input[@type="password"]', curDoc, null,
    XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
  if (!pwdField) {
    window.alert(nologinform_string);
    return;
  }
  var form = pwdField.form;
  var unameField = curDoc.evaluate(
    './/input[@type="text" and not(preceding::input[@type="password"])][last()]',
    form, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
  if (!unameField) {
    window.alert(nologinform_string);
    return;
  }

  // Construct the submit prefix
  var formAction = form.getAttribute("action");
  var re = /^([0-9-_A-Za-z]+:\/\/[^/]+)\//;
  var res = re.exec(formAction);
  var formSubmitURL;
  if (res)
    formSubmitURL = res[1];
  else
    formSubmitURL = hostname;

  // Get the field names and values
  var usernameField = unameField.getAttribute("name");
  var username = unameField.value;
  var passwordField = pwdField.getAttribute("name");
  var password = pwdField.value;

  // Populate the editor form
  el("hostname_text").value = hostname;
  el("formSubmitURL_text").value = formSubmitURL;
  el("username_text").value = username;
  el("password_text").value = password;
  el("usernameField_text").value = usernameField;
  el("passwordField_text").value = passwordField;
}

function setNewSignon () {
  var hostname = el("hostname_text").value,
    formSubmitURL, httpRealm,
    username = el("username_text").value,
    password = el("password_text").value,
    usernameField, passwordField;
  var idx = el("signon_type").selectedIndex;

  if (idx == 0) {
    formSubmitURL = el("formSubmitURL_text").value;
    httpRealm = null;
    usernameField = el("usernameField_text").value;
    passwordField = el("passwordField_text").value;
  } else {
    formSubmitURL = null;
    httpRealm = el("httpRealm_text").value;
    usernameField = passwordField = "";
  }

  var newSignon = Components.classes["@mozilla.org/login-manager/loginInfo;1"].
                    createInstance(Components.interfaces.nsILoginInfo);
  newSignon.init(hostname, formSubmitURL, httpRealm, username, password,
                 usernameField, passwordField);
  window.arguments[1].newSignon = newSignon;
}