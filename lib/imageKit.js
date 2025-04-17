"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.imagekit = void 0;
const imagekit_1 = __importDefault(require("imagekit"));
exports.imagekit = new imagekit_1.default({
    publicKey: process.env.NEXT_PUBLIC_PUBLIC_KEY,
    privateKey: process.env.PRIVATE_KEY,
    urlEndpoint: process.env.NEXT_PUBLIC_URL_ENDPOINT,
});
