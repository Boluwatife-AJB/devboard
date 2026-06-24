use thiserror::Error;

#[derive(Debug, Error)]
pub enum AuthError {
  #[error("invalid credentials")]
  InvalidCredentials,

  #[error("token expired")]
  TokenExpired,

  #[error("invalid token")]
  InvalidToken,

  #[error("token missing")]
  TokenMissing,

  #[error("password hashing failed")]
  HashingFailed,

  #[error("hashing thread panicked")]
  HashingPanic
}