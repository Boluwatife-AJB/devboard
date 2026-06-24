use thiserror::Error;


#[derive(Debug, Error)]
pub enum DomainError {
  #[error("invalid role transaction: cannot move from {from} to {to}")]
  InvalidRoleTransition { from: String, to: String },

  #[error("validation failed: {field} - {message}")]
  Validation { field: String, message: String }
}