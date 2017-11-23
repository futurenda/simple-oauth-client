/**
 * GitHub wrongly decodes '%2C' to ',' when appending params to `redirect_uri` 
 * We need to convert it back to verify `state`
 */
const commaRe = /,/g, encodedComma = encodeURIComponent(',')
export const fixVendorDecodedCommaInState = encodedState => encodedState.replace(commaRe, encodedComma)