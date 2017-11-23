# Simple OAuth 2 Client

## Why

I don't like adding hundreds of KBs of vendor SDKs (Google/Facebook/Twitter/etc.) just to let user do "Sign in With ...".

## What is does

1. Opens a popup window and loads vendor oauth endpoint

2. User authenticates in the popup

3. You get the oauth response(`id_token`, `access_token` etc.) or errors in the Promise callbacks

## Usage

The lib consists of two parts:
1. Import and use the OAuth client in the main script

    ```js
    // In the js that initiates the OAuth flow
    import oauth from 'simple-oauth-client'

    oauth(
        endpoint, // oauth endpoint
        {
            // oauth parameters, check vendor(google/facebook/twitter/etc.) docs
            // required param:
            client_id, // client id of your application, check vendor docs
            // typical params:
            scope, // space delimited string
            redirect_uri, // redirect
            response_type, // (used by Google)
            // and others
        },
        {
            // Popup window features
            popupHeight,
            popupWidth
        }
    )
    .then(response => {
        // do things with token, e.g. send it to backend
    })
    .catch(e => {
        // errors, e.g. user cancelled oauth, or errors from vendor
    })
    ```
    For details of oauth parameters please refer to vendor docs

2. Import 'simple-oauth-client/popup' in your `redirect_uri` page:

    ```js
    // In the js of `redirect_uri` page
    import 'simple-oauth-client/popup'
    ```

3. If your app is an SPA you can simply import both in your script:

    ```js
    import oauth from 'simple-oauth-client'
    import 'simple-oauth-client/popup'
    oauth(endpoint, {

        redirect_uri: location.href
    })
    ```

    And set `redirect_uri` to `location.href`, so you don't need to serve a page just for `redirect_uri`


## What it works with

I've only tested with `Google`, `Facebook` and `GitHub`. You can import their endpoints by

```js
import {
    ENDPOINT_GOOGLE, // https://accounts.google.com/o/oauth2/v2/auth
    ENDPOINT_FACEBOOK, // https://www.facebook.com/v2.8/dialog/oauth
    ENDPOINT_GITHUB // http://github.com/login/oauth/authorize
} from 'simple-oauth-client'
```