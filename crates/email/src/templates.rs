pub struct InviteEmailData {
    pub invitee_email: String,
    pub org_name: String,
    pub inviter_name: String,
    pub invite_url: String,
    pub expires_hours: u64,
}

impl InviteEmailData {
    pub fn text_body(&self) -> String {
        format!(
            "{inviter} has invited you to join {org} on DevBoard.\n\n\
        Click the link below to accept your invitation:\n\
        {url}\n\n\
        This link expires in {hours} hours.\n\n\
        If you didn't expect this invitation, you can safely ignore this email.",
            inviter = self.inviter_name,
            org = self.org_name,
            url = self.invite_url,
            hours = self.expires_hours,
        )
    }

    pub fn html_body(&self) -> String {
        format!(
            r#"<!DOCTYPE html>
        <html>
        <body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #3b5bdb;">You've been invited to {org}</h2>
          <p><strong>{inviter}</strong> has invited you to join <strong>{org}</strong> on DevBoard.</p>
        <a href="{url}"
          style="display: inline-block; background: #3b5bdb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 16px 0;">
        Accept Invitation
        </a>
        <p style="color: #666; font-size: 14px;">
          This link expires in {hours} hours.<br>
          If you didn't expect this invitation, you can safely ignore this email.
        </p>
        </body>
        </html>"#,
            org = self.org_name,
            inviter = self.inviter_name,
            url = self.invite_url,
            hours = self.expires_hours
        )
    }
}
