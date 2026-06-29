use argon2::{
    Argon2,
    password_hash::{PasswordHash, PasswordHasher, PasswordVerifier, SaltString, rand_core::OsRng},
};
use tokio::task;

use crate::error::AuthError;

pub async fn hash_password(password: String) -> Result<String, AuthError> {
    task::spawn_blocking(move || {
        let salt = SaltString::generate(&mut OsRng);
        let argon2 = Argon2::default();

        argon2
            .hash_password(password.as_bytes(), &salt)
            .map(|hash| hash.to_string())
            .map_err(|_| AuthError::HashingFailed)
    })
    .await
    .map_err(|_| AuthError::HashingPanic)?
}

pub async fn verify_password(password: String, hash: String) -> Result<(), AuthError> {
    task::spawn_blocking(move || {
        let parsed_hash = PasswordHash::new(&hash).map_err(|_| AuthError::InvalidCredentials)?;

        Argon2::default()
            .verify_password(password.as_bytes(), &parsed_hash)
            .map_err(|_| AuthError::InvalidCredentials)
    })
    .await
    .map_err(|_| AuthError::HashingPanic)?
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn hash_and_verify_roundtrip() {
        let password = "correct-horse-battery-staple".to_string();
        let hash = hash_password(password.clone()).await.unwrap();

        assert_ne!(hash, password);

        verify_password(password, hash.clone()).await.unwrap();
    }

    #[tokio::test]
    async fn wrong_password_fails_verification() {
        let hash = hash_password("original".to_string()).await.unwrap();
        let result = verify_password("wrong".to_string(), hash).await;
        assert!(matches!(result, Err(AuthError::InvalidCredentials)));
    }

    #[tokio::test]
    async fn two_hashes_of_same_password_differ() {
        let hash_a = hash_password("password".to_string()).await.unwrap();
        let hash_b = hash_password("password".to_string()).await.unwrap();
        assert_ne!(hash_a, hash_b);
    }
}
