use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize)]
pub struct ApiResponse<T> {
    pub data: T,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub meta: Option<serde_json::Value>,
}

impl<T> ApiResponse<T> {
    pub fn new(data: T) -> Self {
        Self { data, meta: None }
    }

    pub fn with_meta(data: T, meta: serde_json::Value) -> Self {
        Self { data, meta: Some(meta) }
    }
}

/// Error format
#[derive(Debug, Serialize, Deserialize)]
pub struct ErrorDetail {
    pub field: Option<String>,
    pub message: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ErrorBody {
    pub r#type: String,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub details: Option<Vec<ErrorDetail>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub extra: Option<serde_json::Value>,
}

/// ApiError
#[derive(Debug)]
pub enum ApiError {
    BadRequest { message: String, details: Option<Vec<ErrorDetail>> },
    Unauthorized { message: String },
    NotFound { message: String },
    Conflict { message: String },
    Internal { message: String },
}

impl ApiError {
    pub fn bad_request(message: impl Into<String>, details: Option<Vec<ErrorDetail>>) -> Self {
        Self::BadRequest { message: message.into(), details }
    }
    pub fn unauthorized(message: impl Into<String>) -> Self {
        Self::Unauthorized { message: message.into() }
    }
    pub fn internal(message: impl Into<String>) -> Self {
        Self::Internal { message: message.into() }
    }
}

/// Api response into -> HTTP
impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let (status, body) = match self {
            ApiError::BadRequest { message, details } => (
                StatusCode::BAD_REQUEST,
                ErrorBody {
                    r#type: "validation_error".to_string(),
                    message,
                    details,
                    extra: None,
                },
            ),
            ApiError::Unauthorized { message } => (
                StatusCode::UNAUTHORIZED,
                ErrorBody { r#type: "unauthorized".to_string(), message, details: None, extra: None },
            ),
            ApiError::NotFound { message } => (
                StatusCode::NOT_FOUND,
                ErrorBody { r#type: "not_found".to_string(), message, details: None, extra: None },
            ),
            ApiError::Conflict { message } => (
                StatusCode::CONFLICT,
                ErrorBody { r#type: "conflict".to_string(), message, details: None, extra: None },
            ),
            ApiError::Internal { message } => (
                StatusCode::INTERNAL_SERVER_ERROR,
                ErrorBody { r#type: "internal_error".to_string(), message, details: None, extra: None },
            ),
        };

        let json_body = json!({ "error": body });
        (status, axum::Json(json_body)).into_response()
    }
}
