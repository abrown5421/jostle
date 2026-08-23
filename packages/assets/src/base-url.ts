/**
 * The one place the "how are assets actually served" decision lives.
 * Today every app points its static file serving straight at this
 * package's public/ directory, same-origin, so no prefix is needed. If
 * that ever changes — a CDN, a dedicated asset host, API-served — only
 * this constant changes; every entry in images/fonts/audio is built from
 * it, so no consumer has to know or care where the bytes actually live.
 */
export const ASSET_BASE_URL = '';
