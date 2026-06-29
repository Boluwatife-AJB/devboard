use tokio::sync::broadcast;

use crate::events::TaskEvent;

const CAPACITY: usize = 1024;

#[derive(Debug, Clone)]
pub struct EventBus {
    task_tx: broadcast::Sender<TaskEvent>,
}

impl EventBus {
    pub fn new() -> Self {
        let (task_tx, _) = broadcast::channel(CAPACITY);
        Self { task_tx }
    }

    pub fn publish_task(&self, event: TaskEvent) -> usize {
        match self.task_tx.send(event) {
            Ok(n) => n,
            Err(_) => 0,
        }
    }

    pub fn subscribe_tasks(&self) -> broadcast::Receiver<TaskEvent> {
        self.task_tx.subscribe()
    }
}

impl Default for EventBus {
    fn default() -> Self {
        Self::new()
    }
}
