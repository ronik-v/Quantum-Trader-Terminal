use serde::Deserialize;

#[derive(Deserialize, Debug)]
pub struct Config {
    pub app_host: String,
    pub app_name: String,
    pub app_port: u16,
    pub db_url: String,
    pub password_salt: String,
    pub moex_data_base_url: String,
    pub moex_find_company_url: String,
}

impl Config {
    pub fn from_env() -> Self {
        dotenvy::dotenv().ok();
        envy::prefixed("").from_env::<Config>().expect("Failed to parse env")
    }
}
