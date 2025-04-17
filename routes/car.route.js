"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const car_controller_1 = require("../controllers/car.controller");
const multer_1 = __importDefault(require("multer"));
//here we are uploading the files to RAM
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
const router = express_1.default.Router();
router.get("/", car_controller_1.getAllCars);
router.get("/:id", car_controller_1.getOneCarById);
router.post("/", upload.array('images'), car_controller_1.createCar);
router.delete("/:id", car_controller_1.removeCarById);
router.put("/:id", car_controller_1.updateCar);
exports.default = router;
