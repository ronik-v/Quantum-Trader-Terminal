FROM rust:latest AS builder

WORKDIR /usr/src/app

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
     build-essential \
     pkg-config \
     libssl-dev \
     libpq-dev \
     ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY Cargo.toml Cargo.lock ./
COPY src/main.rs src/main.rs
RUN cargo fetch --locked
COPY . .

RUN cargo build --release --bin terminal_q_backend

FROM debian:bookworm-slim AS runtime

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
     ca-certificates \
     libssl3 \
     libpq5 \
  && rm -rf /var/lib/apt/lists/*

COPY --from=builder /usr/src/app/target/release/terminal_q_backend /usr/local/bin/terminal_q_backend

WORKDIR /app

EXPOSE 9999

ENV RUST_LOG=info

CMD ["/usr/local/bin/terminal_q_backend"]