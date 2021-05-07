// src/authService.js

import createAuth0Client from '@auth0/auth0-spa-js';
import { user, isAuthenticated, popupOpen } from "./store";
import config from '../auth_config'

async function createClient() {
  let auth0Client = await createAuth0Client({
    domain: config.domain,
    client_id: config.clientId
  });

  return auth0Client;
}

async function loginWithPopup(client, options) {
  popupOpen.set(true);
  try {
    await client.loginWithPopup(options);

    const usr = await client.getUser();
    console.log(usr);
    user.set(usr);
    isAuthenticated.set(true);
  } catch (e) {
    // eslint-disable-next-line
    console.error(e);
  } finally {
    popupOpen.set(false);
  }
}

async function loginWithRedirect(client, options) {
  try {
    await client.loginWithRedirect(options);

    user.set(await client.getUser());
    isAuthenticated.set(true);
    const user = await auth0.getUser();
    console.log(user);

  } catch (e) {
    // eslint-disable-next-line
    console.error(e);
  } finally {
    isAuthenticated.set(true);
  }
}

function logout(client) {
  return client.logout();
}

const auth = {
  createClient,
  loginWithPopup,
  loginWithRedirect,
  logout
};

export default auth;