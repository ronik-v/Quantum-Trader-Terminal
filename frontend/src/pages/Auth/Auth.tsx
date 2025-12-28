import React, { type JSX, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiServiceFactory } from "../../api/connection";
import type { AuthRequest, AuthResponse } from "../../api/auth/types";
import type { ErrorResponse } from "../../api/base";
import { UserUtils } from "../../utils/user";
import styles from "./Auth.module.css"
import {Footer} from "../../components/Footer/Footer.tsx";

export function Auth(): JSX.Element {
    const [username, setUsername] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const navigate = useNavigate();
    const userUtils = new UserUtils();

    const isErrorResponse = (r: any): r is ErrorResponse =>
        r != null && typeof r === "object" && typeof r.message === "string" && typeof r.type === "string";

    const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!username || !password) {
            alert("Please fill in all fields");
            return;
        }

        const request: AuthRequest = { username, password };

        try {
            const apiConnector = ApiServiceFactory.authService(request);
            const response = await apiConnector.login();

            if (isErrorResponse(response)) {
                alert(response.message);
                return;
            }

            const auth = response as AuthResponse;
            if (!auth || typeof auth.token !== "string") {
                alert("Unexpected server response");
                console.warn("Unexpected auth response shape:", response);
                return;
            }

            userUtils.setToken(auth.token);
            userUtils.setUsername(auth.username);

            navigate("/data");
        } catch (err) {
            console.error(err);
            alert("Network or server error");
        }
    };

    return (
        <div>
            <div className={styles.authPage}>
                <form onSubmit={onSubmit} className={styles.authForm}>
                    <h3 className={styles.authTitle} >Quantum Trader Terminal</h3>
                    <input
                        className={styles.authInput}
                        name="username"
                        type="text"
                        value={username}
                        placeholder="Username"
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    <input
                        className={styles.authInput}
                        name="password"
                        type="password"
                        value={password}
                        placeholder="Password"
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <button className={styles.authBtn} type="submit">Log in</button>
                </form>
            </div>

            <Footer />
        </div>
    );
}
