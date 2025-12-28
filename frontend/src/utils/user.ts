export class UserUtils {
    private readonly username_key: string;
    private readonly auth_token_key: string;

    constructor() {
        this.auth_token_key = "auth-token";
        this.username_key = "username";
    }

    getUsername() {
        return localStorage.getItem(this.username_key)
    }

    setUsername(username: string) {
        localStorage.setItem(this.username_key, username);
    }

    getToken() {
        return localStorage.getItem(this.auth_token_key) as string;
    }

    setToken(token: string) {
        localStorage.setItem(this.auth_token_key, token);
    }
}