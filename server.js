"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const prismaClient_1 = require("./utils/prismaClient");
const car_route_1 = __importDefault(require("./routes/car.route"));
const env_1 = require("./config/env");
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use("/cars", car_route_1.default);
//this is the error handling middleware
app.use((error, req, res, next) => {
    res.status(error.status || 500).json({
        message: error.message || "Something went wrong!",
        status: error.status,
        stack: error.stack,
    });
});
const server = app.listen(env_1.PORT, () => {
    console.log(`Server running on port ${env_1.PORT}`);
});
// Gracefully shutdown Prisma Client on process exit
process.on('SIGINT', () => __awaiter(void 0, void 0, void 0, function* () {
    yield prismaClient_1.prisma.$disconnect();
    console.log('Prisma disconnected');
    process.exit(0);
}));
