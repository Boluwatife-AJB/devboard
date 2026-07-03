use async_trait::async_trait;
use resend_rs::{Resend, types::CreateEmailBaseOptions};

use crate::{error::EmailError, templates::InviteEmailData};

#[async_trait]
pub trait EmailProvider: Send + Sync {
    async fn send_invite(&self, data: InviteEmailData) -> Result<(), EmailError>;
}

pub struct ResendEmailProvider {
    client: Resend,
    from_address: String,
}

impl ResendEmailProvider {
    pub fn new(api_key: &str, from_address: String) -> Self {
        Self {
            client: Resend::new(api_key),
            from_address,
        }
    }
}

#[async_trait]
impl EmailProvider for ResendEmailProvider {
    #[tracing::instrument(skip(self, data), fields(to = %data.invitee_email))]
    async fn send_invite(&self, data: InviteEmailData) -> Result<(), EmailError> {
        let options = CreateEmailBaseOptions::new(
            &self.from_address,
            vec![data.invitee_email.clone()],
            format!("You're invited to join {} on DevBoard", data.org_name),
        )
        .with_html(&data.html_body())
        .with_text(&data.text_body());

        self.client
            .emails
            .send(options)
            .await
            .map_err(|e| EmailError::SendFailed(e.to_string()))?;

        tracing::info!(
          to = %data.invitee_email,
          org = %data.org_name,
          "invite email sent"
        );

        Ok(())
    }
}

pub struct LogEmailProvider;

#[async_trait]
impl EmailProvider for LogEmailProvider {
    async fn send_invite(&self, data: InviteEmailData) -> Result<(), EmailError> {
        tracing::info!(
          to = %data.invitee_email,
          url = %data.invite_url,
          "[TEST] invite email (not sent, logged only)"
        );
        Ok(())
    }
}
