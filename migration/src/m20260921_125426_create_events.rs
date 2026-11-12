use sea_orm_migration::prelude::*;

use crate::{
    m20260621_141230_create_organizations::Organization, m20260621_201057_create_users::User,
    m20260621_201126_create_teams::Team, m20260621_201203_create_projects::Project,
};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(EventSeries::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(EventSeries::Id)
                            .uuid()
                            .not_null()
                            .primary_key(),
                    )
                    .col(
                        ColumnDef::new(EventSeries::OrganizationId)
                            .uuid()
                            .not_null(),
                    )
                    .col(ColumnDef::new(EventSeries::CreatedBy).uuid().not_null())
                    .col(ColumnDef::new(EventSeries::Title).string().not_null())
                    .col(ColumnDef::new(EventSeries::Description).string().null())
                    .col(ColumnDef::new(EventSeries::EventType).string().not_null())
                    .col(
                        ColumnDef::new(EventSeries::AudienceType)
                            .string()
                            .not_null(),
                    )
                    .col(ColumnDef::new(EventSeries::TeamId).uuid().null())
                    .col(ColumnDef::new(EventSeries::ProjectId).uuid().null())
                    .col(ColumnDef::new(EventSeries::Location).string().null())
                    .col(ColumnDef::new(EventSeries::MeetingUrl).string().null())
                    .col(ColumnDef::new(EventSeries::Timezone).string().not_null())
                    .col(
                        ColumnDef::new(EventSeries::DurationMinutes)
                            .integer()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(EventSeries::RecurrenceKind)
                            .string()
                            .not_null(),
                    )
                    .col(ColumnDef::new(EventSeries::IntervalDays).integer().null())
                    .col(
                        ColumnDef::new(EventSeries::RecurrenceEndAt)
                            .timestamp()
                            .null(),
                    )
                    .col(ColumnDef::new(EventSeries::Status).string().not_null())
                    .col(
                        ColumnDef::new(EventSeries::CreatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .col(
                        ColumnDef::new(EventSeries::UpdatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_event_series_org")
                            .from(EventSeries::Table, EventSeries::OrganizationId)
                            .to(Organization::Table, Organization::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_event_series_created_by")
                            .from(EventSeries::Table, EventSeries::CreatedBy)
                            .to(User::Table, User::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_event_series_team")
                            .from(EventSeries::Table, EventSeries::TeamId)
                            .to(Team::Table, Team::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_event_series_project")
                            .from(EventSeries::Table, EventSeries::ProjectId)
                            .to(Project::Table, Project::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .if_not_exists()
                    .name("idx_event_series_org")
                    .table(EventSeries::Table)
                    .col(EventSeries::OrganizationId)
                    .col(EventSeries::Status)
                    .to_owned(),
            )
            .await?;

        manager
            .create_table(
                Table::create()
                    .table(EventOccurrence::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(EventOccurrence::Id)
                            .uuid()
                            .not_null()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(EventOccurrence::SeriesId).uuid().not_null())
                    .col(
                        ColumnDef::new(EventOccurrence::OrganizationId)
                            .uuid()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(EventOccurrence::StartsAt)
                            .timestamp_with_time_zone()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(EventOccurrence::EndsAt)
                            .timestamp_with_time_zone()
                            .not_null(),
                    )
                    .col(ColumnDef::new(EventOccurrence::Status).string().not_null())
                    .col(
                        ColumnDef::new(EventOccurrence::Reminded24hAt)
                            .timestamp_with_time_zone()
                            .null(),
                    )
                    .col(
                        ColumnDef::new(EventOccurrence::Reminded15mAt)
                            .timestamp_with_time_zone()
                            .null(),
                    )
                    .col(
                        ColumnDef::new(EventOccurrence::CreatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .col(
                        ColumnDef::new(EventOccurrence::UpdatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_event_occurrence_series")
                            .from(EventOccurrence::Table, EventOccurrence::SeriesId)
                            .to(EventSeries::Table, EventSeries::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_event_occurrence_org")
                            .from(EventOccurrence::Table, EventOccurrence::OrganizationId)
                            .to(Organization::Table, Organization::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .if_not_exists()
                    .name("idx_event_occurrence_series")
                    .table(EventOccurrence::Table)
                    .col(EventOccurrence::OrganizationId)
                    .col(EventOccurrence::SeriesId)
                    .col(EventOccurrence::Status)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .if_not_exists()
                    .name("idx_event_occurrence_series")
                    .table(EventOccurrence::Table)
                    .col(EventOccurrence::SeriesId)
                    .col(EventOccurrence::StartsAt)
                    .to_owned(),
            )
            .await?;

        manager
            .create_table(
                Table::create()
                    .table(EventAttendee::Table)
                    .if_not_exists()
                    .col(ColumnDef::new(EventAttendee::SeriesId).uuid().not_null())
                    .col(ColumnDef::new(EventAttendee::UserId).uuid().not_null())
                    .col(
                        ColumnDef::new(EventAttendee::CreatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .primary_key(
                        Index::create()
                            .col(EventAttendee::SeriesId)
                            .col(EventAttendee::UserId),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_event_attendee_series")
                            .from(EventAttendee::Table, EventAttendee::SeriesId)
                            .to(EventSeries::Table, EventSeries::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_event_attendee_user")
                            .from(EventAttendee::Table, EventAttendee::UserId)
                            .to(User::Table, User::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .if_not_exists()
                    .name("idx_event_attendee_user")
                    .table(EventAttendee::Table)
                    .col(EventAttendee::UserId)
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(EventAttendee::Table).to_owned())
            .await?;
        manager
            .drop_table(Table::drop().table(EventOccurrence::Table).to_owned())
            .await?;
        manager
            .drop_table(Table::drop().table(EventSeries::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
pub enum EventSeries {
    Table,
    Id,
    OrganizationId,
    CreatedBy,
    Title,
    Description,
    EventType,
    AudienceType,
    TeamId,
    ProjectId,
    Location,
    MeetingUrl,
    Timezone,
    DurationMinutes,
    RecurrenceKind,
    IntervalDays,
    RecurrenceEndAt,
    Status,
    CreatedAt,
    UpdatedAt,
}

#[derive(DeriveIden)]
pub enum EventOccurrence {
    Table,
    Id,
    SeriesId,
    OrganizationId,
    StartsAt,
    EndsAt,
    Status,
    Reminded24hAt,
    Reminded15mAt,
    CreatedAt,
    UpdatedAt,
}

#[derive(DeriveIden)]
pub enum EventAttendee {
    Table,
    SeriesId,
    UserId,
    CreatedAt,
}
