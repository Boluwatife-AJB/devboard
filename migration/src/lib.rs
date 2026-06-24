pub use sea_orm_migration::prelude::*;

mod m20260621_141230_create_organizations;
mod m20260621_201057_create_users;
mod m20260621_201126_create_teams;
mod m20260621_201149_create_team_memberships;
mod m20260621_201203_create_projects;
mod m20260621_201221_create_project_memberships;
mod m20260621_201248_create_tasks;
mod m20260621_201300_create_comments;

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
        ]
    }
}
