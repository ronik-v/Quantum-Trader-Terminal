use anyhow::Result;
use crate::repositories::user::UserRepository;
use crate::api::ApiError;
use sha2::{Sha256, Digest};
use hex;
use uuid::Uuid;

pub struct UserService<'a> {
    repo: UserRepository<'a>,
    password_salt: String,
}

impl<'a> UserService<'a> {
    pub fn new(repo: UserRepository<'a>, password_salt: String) -> Self {
        Self { repo, password_salt }
    }

    pub async fn auth(&self, username: &str, password: &str) -> Result<String, ApiError> {
        let mut hasher = Sha256::new();
        hasher.update(password.as_bytes());
        hasher.update(self.password_salt.as_bytes());
        let hash_bytes = hasher.finalize();
        let hash_hex = hex::encode(hash_bytes);

        let maybe_user = self.repo.auth(username, &hash_hex).await
            .map_err(|e| ApiError::internal(format!("db error: {}", e)))?;

        let user = maybe_user.ok_or_else(|| ApiError::unauthorized("Invalid credentials"))?;

        let token = Uuid::new_v4().to_string();
        let _saved = self.repo.create_token(&user.id, &token).await
            .map_err(|e| ApiError::internal(format!("failed to save token: {}", e)))?;

        Ok(token)
    }

}
