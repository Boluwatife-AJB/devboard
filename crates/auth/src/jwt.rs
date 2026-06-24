use chrono::Utc;
use jsonwebtoken::{
  Algorithm, DecodingKey, EncodingKey, Header, TokenData, Validation, decode, encode, errors::ErrorKind
};
use serde::{Deserialize, Serialize};

use devboard_domain::{OrganizationId, UserId};

use crate::error::AuthError;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Claims {
  pub sub: String,
  pub org: String,
  pub iat: i64,
  pub exp: i64,
}

impl Claims {
    pub fn user_id(&self) -> Result<UserId, AuthError> {
      self.sub
        .parse::<uuid::Uuid>()
        .map(UserId::from)
        .map_err(|_| AuthError::InvalidToken)
    }

    pub fn organization_id(&self) -> Result<OrganizationId, AuthError> {
      self.org
        .parse::<uuid::Uuid>()
        .map(OrganizationId::from)
        .map_err(|_| AuthError::InvalidToken)
    }
}

pub struct JwtService {
  encoding_key: EncodingKey,
  decoding_key: DecodingKey,
  access_token_minutes: i64,
}

impl JwtService {
    pub fn new(secret: &str, access_token_minutes: i64) -> Self {
      let secret_bytes = secret.as_bytes();
      Self { 
        encoding_key: EncodingKey::from_secret(secret_bytes), decoding_key: DecodingKey::from_secret(secret_bytes), access_token_minutes 
      }
    }

    pub fn issue(
      &self,
      user_id: UserId,
      organization_id: OrganizationId
    ) -> Result<String, AuthError> {
      let now = Utc::now().timestamp();

      let claims = Claims {
        sub: user_id.to_string(),
        org: organization_id.to_string(),
        iat: now,
        exp: now + (self.access_token_minutes * 60)
      };

      encode(&Header::default(), &claims, &self.encoding_key)
        .map_err(|_| AuthError::HashingFailed)
    }

    pub fn verify(&self, token: &str) -> Result<Claims, AuthError> {
      let mut validation = Validation::new(Algorithm::HS256);
      validation.validate_exp = true;

      decode::<Claims>(token, &self.decoding_key, &validation)
        .map(|data: TokenData<Claims>| data.claims)
        .map_err(|err| match err.kind() {
          ErrorKind::ExpiredSignature => AuthError::TokenExpired,
          _ => AuthError::InvalidToken,
        })
    }
}

#[cfg(test)]
mod tests {
  use super::*;
  use uuid::Uuid;

  fn make_service() -> JwtService {
    JwtService::new("test-secret-that-is-long-enough-32ch", 30)
  }

  fn ids() -> (UserId, OrganizationId) {
    (
      UserId(Uuid::new_v4()),
      OrganizationId(Uuid::new_v4())
    )
  }

  #[test]
  fn issue_and_verify_roundtrip() {
    let service = make_service();
    let (user_id, org_id) = ids();

    let token = service.issue(user_id, org_id).unwrap();
    let claims = service.verify(&token).unwrap();

    assert_eq!(claims.user_id().unwrap(), user_id);
    assert_eq!(claims.organization_id().unwrap(), org_id)
  }

  #[test]
  fn tampered_token_is_rejected() {
    let service = make_service();
    let (user_id, org_id) = ids();

    let token = service.issue(user_id, org_id).unwrap();

    let mut tampered = token.clone();
    let last = tampered.pop().unwrap();
    tampered.push(if last == 'a' { 'b' } else { 'a' });

    let result = service.verify(&tampered);
    assert!(matches!(result, Err(AuthError::InvalidToken)));
  }

  #[test]
  fn wrong_secret_is_rejected() {
    let service_a = make_service();
    let service_b = JwtService::new(
      "completely-different-secret-32char", 30
    );
    let (user_id, org_id) = ids();

    let token = service_a.issue(user_id, org_id).unwrap();
    let result = service_b.verify(&token);
    assert!(matches!(result, Err(AuthError::InvalidToken)))
  }
}