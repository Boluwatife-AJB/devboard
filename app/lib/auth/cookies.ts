import Cookies from "js-cookie";

const ACCESS_TOKEN_COOKIE_NAME = "devboard_access_token";
const ORG_ID_KEY = "devboard_org_id";

export function setAccessToken(token: string) {
  Cookies.set(ACCESS_TOKEN_COOKIE_NAME, token, {
    expires: 1/48,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
}

export function getAccessToken() {
  return Cookies.get(ACCESS_TOKEN_COOKIE_NAME);
}

export function clearAuth() {
  Cookies.remove(ACCESS_TOKEN_COOKIE_NAME);
  Cookies.remove(ORG_ID_KEY);
}