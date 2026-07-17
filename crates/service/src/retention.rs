use std::{sync::Arc, time::Duration};

use devboard_repository::messaging::ChannelRepository;

pub const RETENTION_LIMIT: u64 = 10_000;
const CLEANUP_INTERVAL: Duration = Duration::from_secs(3600);

pub fn spawn_retention_job(_channel_repo: Arc<dyn ChannelRepository>) {
    tokio::spawn(async move {
        tracing::info!("retention job started");

        loop {
            tokio::time::sleep(CLEANUP_INTERVAL).await;

            tracing::info!("running message retention cleanup");

            tracing::info!("retention cleanup complete")
        }
    });
}
