/**
 *  Simple general purpose OAuth 2.0 Client flow library
 */

const parseParams = hashOrSearch => hashOrSearch.slice(1) // drop '#' or '?'
    .split('&')
    .reduce((obj, curr) => {
        let pair = curr.split('=')
        obj[pair[0]] = pair[1]
        return obj
    }, {})

const buildParams = kv => Object.keys(kv)
    .reduce((str, key) => kv[key] === undefined ? str : str + `${key}=${encodeURIComponent(kv[key])}&`, '?')
    .slice(0, -1) // drop trailing '&'

export const ENDPOINT_GOOGLE = 'https://accounts.google.com/o/oauth2/v2/auth'
export const ENDPOINT_FACEBOOK = 'https://www.facebook.com/v2.8/dialog/oauth'
export const ENDPOINT_GITHUB = 'http://github.com/login/oauth/authorize'

import {
    EVENT_REQUEST_OPENER_ORIGIN,
    EVENT_PROVIDE_OPENER_ORIGIN,
    EVENT_OAUTH_RESULT
} from './events'

import { fixVendorDecodedCommaInState } from './util'

let popupWindow, pollInterval

export default function oauth(endpoint, {
    // Required params
    client_id,
    // Optional params
    scope,
    state = Math.random().toString(32).substr(2),
    display = 'popup',
    prompt = 'consent',
    ...others
    // redirect_uri
    // include_granted_scopes
} = {}, {
    // Popup window features
    popupHeight = 600,
    popupWidth = 400
} = {}) {
    if (!endpoint) throw new Error('OAuth `endpoint` must be provided')
    if (!client_id) throw new Error('OAuth `client_id` must be provided')
    if (popupWindow) throw new Error("Previous OAuth flow hasn't finished")

    if (Array.isArray(scope)) scope = scope.join(' ')

    let options = {
        client_id,
        scope,
        display,
        prompt,
        state,
        ...others
    }

    addNonceForGoogleIdToken(options)

    let url = endpoint + buildParams(options)

    /**
     * Open the popup
     * Since Chrome 59, `location` must be `no`
     * https://stackoverflow.com/questions/44417724/facebook-authentication-opening-tab-instead-of-popup-in-chrome-59
     */
    popupWindow = window.open(
        url,
        '',
        `width=${popupWidth},height=${popupHeight},top=${window.screenY + (window.outerHeight - popupHeight) / 2},left=${window.screenX + (window.outerWidth - popupWidth) / 2},location=no,toolbar=no,menubar=no`
    )

    return new Promise((res, rej) => {
        const reject = arg => {
            cleanup()
            window.removeEventListener('message', handleMessage)
            rej(arg)
        }

        const resolve = arg => {
            cleanup()
            window.removeEventListener('message', handleMessage)
            res(arg)
        }

        // poll to see if the popup is closed
        pollInterval = setInterval(() => {
            try {
                if (!popupWindow || popupWindow.closed) {
                    reject(new Error('User cancelled oauth'))
                }
            } catch (e) {
                // The iframe has been redirected `redirect_url`, which may not be same origin as host
                if (e.message === 'no access') {
                    // do nothing
                } else {
                    reject(e)
                }
            }
        }, 100)

        const handleMessage = ({ origin, source, data: { type, hash, search } = {} }) => {
            /**
             * Check whether the event comes from pending instance's popup,
             * before providing `origin` and `state`
             */
            if (!popupWindow || source !== popupWindow) return


            /**
             * `state` is encoded before transfer, so we need to compare encoded result
             */
            let encodedState = encodeURIComponent(state)

            /**
             * Send host(opener) origin to popup when requested,
             * so it can postMessage back with proper origin
             */
            if (type === EVENT_REQUEST_OPENER_ORIGIN) {
                source.postMessage({
                    type: EVENT_PROVIDE_OPENER_ORIGIN,
                    origin: location.origin,
                    encodedState
                }, origin)
            }

            /**
             * Handle OAuth result from popup
             */
            else if (type === EVENT_OAUTH_RESULT) {
                let result = parseParams(hash || search)
                if (encodedState !== result.state &&
                    encodedState !== fixVendorDecodedCommaInState(result.state)) return

                delete result.state
                result.error ? reject(result) : resolve(result)
            }
        }

        window.addEventListener('message', handleMessage)
    })
}


function cleanup() {
    popupWindow && popupWindow.close()
    clearInterval(pollInterval)
    popupWindow = null
}

function addNonceForGoogleIdToken(options) {
    if (options.response_type === 'id_token' && options.nonce === undefined) {
        options.nonce = Math.round(Math.random() * 10000000000)
    }
}