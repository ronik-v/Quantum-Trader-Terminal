use serde::Serialize;
use sqlx::FromRow;
use chrono::NaiveDateTime;

#[derive(Debug, Serialize, FromRow)]
pub struct User {
    pub id: i64,
    pub username: String,
    pub password: String,
    pub created_at: NaiveDateTime,
}
