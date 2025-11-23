import type {AuthRequest} from "./auth/types.ts";
import {AuthService} from "./auth/module.ts";
import {StockDataService} from "./stockData/module.ts";

export class ApiServiceFactory {
    static authService(userAuthRequest: AuthRequest): AuthService {
        return new AuthService(userAuthRequest);
    };

    static stockService(authToken: string): StockDataService {
        return new StockDataService(authToken);
    };
}