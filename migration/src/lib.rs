pub use sea_orm_migration::prelude::*;

mod m20260621_141230_create_organizations;
mod m20260621_201057_create_users;
mod m20260621_201126_create_teams;
mod m20260621_201149_create_team_memberships;
mod m20260621_201203_create_projects;
mod m20260621_201221_create_project_memberships;
mod m20260621_201248_create_tasks;
mod m20260621_201300_create_comments;
mod m20260701_190344_create_organization_memberships;
mod m20260701_201048_create_invitations;
mod m20260709_172459_create_task_attachments;
mod m20260709_174431_add_due_date_to_tasks;
mod m20260715_115330_create_channels;
mod m20260715_175037_create_channel_members;
mod m20260715_180458_create_messages;
mod m20260715_182709_create_message_reactions;
mod m20260715_183839_create_direct_messages;
mod m20260728_150000_create_message_clears;
mod m20260729_133700_one_reaction_per_user;
mod m20260729_164948_create_notifications;
mod m20260729_170514_create_notification_preferences;
mod m20260729_171138_create_push_subscriptions;

pub struct Migrator;

#[async_trait::async_trait]
impl MigratorTrait for Migrator {
    fn migrations() -> Vec<Box<dyn MigrationTrait>> {
        vec![
            Box::new(m20260621_141230_create_organizations::Migration),
            Box::new(m20260621_201057_create_users::Migration),
            Box::new(m20260621_201126_create_teams::Migration),
            Box::new(m20260621_201149_create_team_memberships::Migration),
            Box::new(m20260621_201203_create_projects::Migration),
            Box::new(m20260621_201221_create_project_memberships::Migration),
            Box::new(m20260621_201248_create_tasks::Migration),
            Box::new(m20260621_201300_create_comments::Migration),
            Box::new(m20260701_190344_create_organization_memberships::Migration),
            Box::new(m20260701_201048_create_invitations::Migration),
            Box::new(m20260709_172459_create_task_attachments::Migration),
            Box::new(m20260709_174431_add_due_date_to_tasks::Migration),
            Box::new(m20260715_115330_create_channels::Migration),
            Box::new(m20260715_175037_create_channel_members::Migration),
            Box::new(m20260715_180458_create_messages::Migration),
            Box::new(m20260715_182709_create_message_reactions::Migration),
            Box::new(m20260715_183839_create_direct_messages::Migration),
            Box::new(m20260728_150000_create_message_clears::Migration),
            Box::new(m20260729_133700_one_reaction_per_user::Migration),
            Box::new(m20260729_164948_create_notifications::Migration),
            Box::new(m20260729_170514_create_notification_preferences::Migration),
            Box::new(m20260729_171138_create_push_subscriptions::Migration),
        ]
    }
}
