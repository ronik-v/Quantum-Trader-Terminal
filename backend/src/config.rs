use serde::Deserialize;

#[derive(Deserialize, Debug)]
pub struct Config {
    pub app_host: Option<String>,
    pub app_name: Option<String>,
    pub app_port: Option<u16>,
    pub db_url: String,
}

impl Config {
    pub fn from_env() -> Self {
        dotenvy::dotenv().ok();
        envy::prefixed("").from_env::<Config>().expect("Failed to parse env")
    }
}
