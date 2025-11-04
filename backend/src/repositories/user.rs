use axum::http::StatusCode;
use axum::Json;
use sqlx::{Error, PgPool};
use crate::handlers::moex::ErrorBody;
use crate::models::user::{User, UserTokens};

pub struct UserRepository<'a> {
    pool: &'a PgPool
}

impl <'a> UserRepository<'a> {
    pub fn new(pool: &'a PgPool) -> Self {
        Self { pool }
    }

    pub async fn auth(&self, username: &str, password: &str) -> sqlx::Result<Option<User>> {
        sqlx::query_as::<_, User>(
            "SELECT * FROM users WHERE username = $1 AND password = $2"
        )
            .bind(username)
            .bind(password)
            .fetch_optional(self.pool)
            .await
    }

    pub async fn create_token(&self, user_id: &i64, token: &str) -> sqlx::Result<UserTokens> {
        sqlx::query_as::<_, UserTokens>(
            "INSERT INTO user_tokens(user_id, token) values($1, $2) RETURNING *"
        )
            .bind(user_id)
            .bind(token)
            .fetch_one(self.pool)
            .await
    }

    pub async fn find_user_by_token(&self, token: &str) -> Result<Option<User>, Error> {
        sqlx::query_as::<_, User>(
            "SELECT * FROM users JOIN user_tokens ON users.id = user_tokens.user_id WHERE user_tokens.token = $1"
        )
            .bind(token)
            .fetch_optional(self.pool)
            .await
    }
}