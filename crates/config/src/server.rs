use serde::Deserialize;

#[derive(Debug, Deserialize, Clone)]
pub struct ServerConfig {
    pub host: String,
    pub port: u16,
}

impl ServerConfig {
    pub fn address(&self) -> String {
        format!("{}:{}", self.host, self.port)
    }
}
