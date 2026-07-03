use thiserror::Error;

#[derive(Debug, Error)]
pub enum EmailError {
    #[error("email send failed: {0}")]
    SendFailed(String),

    #[error("invalid email address: {0}")]
    InvalidAddress(String),
}
