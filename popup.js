/**
 * Post oauth result back with postMessage.
 * This should be included in the redirected page of `redirect_uri`.
 */

import {
    EVENT_REQUEST_OPENER_ORIGIN,
    EVENT_PROVIDE_OPENER_ORIGIN,
    EVENT_OAUTH_RESULT
} from './events'

import { fixVendorDecodedCommaInState } from './util'

if (typeof window !== 'undefined') {
    let { hash, search } = location
    let oauthResult = hash || search
    if (window.opener && window.opener !== window) {
        /**
         * Request opener's origin, to send oauth result back
         */
        window.opener.postMessage({ type: EVENT_REQUEST_OPENER_ORIGIN }, '*')

        /**
         * When receiving opener's origin, send back oauth result
         */
        window.addEventListener('message', ({ data: { type, origin, encodedState } = {} }) => {
            if (type !== EVENT_PROVIDE_OPENER_ORIGIN) return
            /**
             * Verify if `state`(encodeURIComponent-ed) matches oauth result's
             */
            if (oauthResult.indexOf(encodedState) === -1 &&
                fixVendorDecodedCommaInState(oauthResult).indexOf(encodedState) === -1
            ) {
                let error = 'WARNING: Wrong state detected! Your browser is probably running malicious plugins or extensions trying to steal your auth token.'
                alert(error)
                throw new Error(error)
            }
            window.opener.postMessage({ type: EVENT_OAUTH_RESULT, hash, search }, origin)
        })
    }
}