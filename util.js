/**
 * Sometimes brwoser converts '%2C' to ',' and '%2F' to '/' to when appending params to `redirect_uri` 
 * We need to convert it back to verify `state`
 */
const commaRe = /,/g, encodedComma = encodeURIComponent(',')
const slashRe = /\//g, encodedSlash = encodeURIComponent('/')

export const fixWronglyDecoded = encodedState => encodedState
    .replace(commaRe, encodedComma)
    .replace(slashRe, encodedSlash)