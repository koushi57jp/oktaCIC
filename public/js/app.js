// The Auth0 client, initialized in configureClient()
let auth0Client = null;

/**
 * Starts the authentication flow
 */
const login = async (targetUrl) => {
  try {
    console.log("Logging in", targetUrl);

    const options = {
      authorizationParams: {
        redirect_uri: window.location.origin
      }
    };

    if (targetUrl) {
      options.appState = { targetUrl };
    }

    await auth0Client.loginWithRedirect(options);
  } catch (err) {
    console.log("Log in failed", err);
  }
};

/**
 * Executes the logout flow
 */
const logout = async () => {
  try {
    console.log("Logging out");
    await auth0Client.logout({
      logoutParams: {
        returnTo: window.location.origin
      }
    });
  } catch (err) {
    console.log("Log out failed", err);
  }
};

/**
 * Retrieves the auth configuration from the server
 */
const fetchAuthConfig = () => fetch("/auth_config.json");

/**
 * Initializes the Auth0 client
 */
const configureClient = async () => {
  // const response = await fetchAuthConfig();
  // const config = await response.json();

  auth0Client = await auth0.createAuth0Client({
    // domain: config.domain,
    // clientId: config.clientId
    domain: "dev-n81k8q0skahenxvk.jp.auth0.com",
    clientId: "3zD1nwkevubQI8sJDSXgBfvEIcs6xavq"
  });
};

/**
 * Checks to see if the user is authenticated. If so, `fn` is executed. Otherwise, the user
 * is prompted to log in
 * @param {*} fn The function to execute if the user is logged in
 */
const requireAuth = async (fn, targetUrl) => {
  const isAuthenticated = await auth0Client.isAuthenticated();

  if (isAuthenticated) {
    return fn();
  }

  return login(targetUrl);
};

// Will run when page finishes loading
window.onload = async () => {
  await configureClient();

  // If unable to parse the history hash, default to the root URL
  if (!showContentFromUrl(window.location.pathname)) {
    showContentFromUrl("/");
    window.history.replaceState({ url: "/" }, {}, "/");
  }

  const bodyElement = document.getElementsByTagName("body")[0];

  // Listen out for clicks on any hyperlink that navigates to a #/ URL
  bodyElement.addEventListener("click", (e) => {
    if (isRouteLink(e.target)) {
      const url = e.target.getAttribute("href");

      if (showContentFromUrl(url)) {
        e.preventDefault();
        window.history.pushState({ url }, {}, url);
      }
    }
  });

  const isAuthenticated = await auth0Client.isAuthenticated();

  if (isAuthenticated) {
    console.log("> User is authenticated");
    window.history.replaceState({}, document.title, window.location.pathname);
    updateUI();
    return;
  }

  console.log("> User not authenticated");

  const query = window.location.search;
  const shouldParseResult = query.includes("code=") && query.includes("state=");

  if (shouldParseResult) {
    console.log("> Parsing redirect");
    try {
      const result = await auth0Client.handleRedirectCallback();

      if (result.appState && result.appState.targetUrl) {
        showContentFromUrl(result.appState.targetUrl);
      }

      console.log("Logged in!");
    } catch (err) {
      console.log("Error parsing redirect:", err);
    }

    window.history.replaceState({}, document.title, "/");
  }

  updateUI();
};

/**
 * selmidAPI
 */
const selmidAPI = async (select_type) => {
  try {
    console.log("selmidAPI start");
    console.log("select_type = " + select_type);

    console.log("name = " + document.getElementById('name').value);
    console.log("kana = " + document.getElementById('kana').value);
    console.log("phoneNumber = " + document.getElementById('phoneNumber').value);
    console.log("birthday = " + document.getElementById('birthday').value);

    const selmid_scope = "selmid:read";
    var name_match = document.getElementById('name').value;
    var name_kana_zenkaku_match = document.getElementById('kana').value;
    var mobile_phone_match = document.getElementById('phoneNumber').value;
    var birthdate_match = document.getElementById('birthday').value;
    
    var options = {
      authorizationParams: {
        redirect_uri: window.location.origin,
        audience: 'http://localhost:3000',
        scope: selmid_scope,
        selectedType: select_type,
        name_match: name_match ,
        name_kana_zenkaku_match: name_kana_zenkaku_match ,
        mobile_phone_match: mobile_phone_match ,
        birthdate_match: birthdate_match  
      }
    };

    var verifiedToken = await auth0Client.getTokenWithPopup(options);
    // const verifiedToken = await auth0Client.getTokenSilently(options);

    console.log("verifiedToken = " + verifiedToken);

    var accessToken = decodeJwt(verifiedToken);
    console.log("accessToken = " + accessToken);

    var claims = await auth0Client.getIdTokenClaims();
    const id_token = claims.__raw;
    console.log("id_token = " + id_token);
    
    var id_token_dec = decodeJwt(id_token);
    console.log("id_token_dec = " + id_token_dec);

    var doc0= document.getElementById("selmid-result");  
    doc0.innerHTML= id_token_dec;   

  } catch (err) {
    console.log("getTokenWithPopup failed", err);
  }
  console.log("selmidAPI end");
};

const decodeJwt = (token) => {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  // return JSON.parse(decodeURIComponent(myescape(window.atob(base64))));
  return decodeURIComponent(myescape(window.atob(base64)));

};
const myescape = (str) => {
  return str.replace(/[^a-zA-Z0-9@*_+\-./]/g, m => {
      const code = m.charCodeAt(0);
      if (code <= 0xff) {
          return '%' + ('00' + code.toString(16)).slice(-2).toUpperCase();
      } else {
          return '%u' + ('0000' + code.toString(16)).slice(-4).toUpperCase();
      }
  });
}