use thiserror::Error;

#[derive(Debug, Error)]
pub enum RepositoryError {
  #[error("record not found")]
  NotFound,

  #[error("unique constraint violated: {constraint}")]
  UniqueViolation { constraint: String},

  #[error("foreign key constraint violated")]
  ForeignKeyViolation,

  #[error("invalid data in database: {message}")]
  InvalidData { message: String },

  #[error("database error: {0}")]
  Database(#[from] sea_orm::DbErr)
}

impl RepositoryError {
    pub fn from_db_err(err: sea_orm::DbErr) -> Self {
      use sea_orm::DbErr;

      match &err {
        DbErr::Query(sea_orm::RuntimeErr::SqlxError(sqlx_err)) => {
          if let Some(db_err) = sqlx_err
            .as_database_error() 
            {
              match db_err.code().as_deref() {
                Some("23505") => {
                  return RepositoryError::UniqueViolation { 
                    constraint: db_err
                        .constraint()
                        .unwrap_or("unknown")
                        .to_string(),
                   };
                }
                Some("23503") => {
                  return RepositoryError::ForeignKeyViolation;
                }
                _ => {}
              }
            }
            RepositoryError::Database(err)
        }
        _ => RepositoryError::Database(err)
      }
    }
}