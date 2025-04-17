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
exports.deleteImageById = exports.updateCar = exports.removeCarById = exports.createCar = exports.getOneCarById = exports.getCarsByMake = exports.getAllCars = void 0;
const multer_1 = __importDefault(require("multer"));
const imageKit_1 = require("../lib/imageKit");
const prismaClient_1 = require("../utils/prismaClient");
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
const getAllCars = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const cars = yield prismaClient_1.prisma.car.findMany({ include: { images: true } }); // Await the database query
        res.json(cars); // Send response to client
    }
    catch (error) {
        next(error); // Pass errors to Express error handler
    }
});
exports.getAllCars = getAllCars;
const getCarsByMake = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { make } = req.params;
    try {
        const cars = yield prismaClient_1.prisma.car.findMany({
            where: { make },
            include: { images: true },
        });
        if (cars.length === 0) {
            res.status(404).json({ message: "No cars found for this make" });
            return;
        }
        res.status(200).json(cars);
    }
    catch (error) {
        next(error);
    }
});
exports.getCarsByMake = getCarsByMake;
const getOneCarById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    console.log("getting a car be id");
    try {
        const car = yield prismaClient_1.prisma.car.findUnique({
            where: { id },
            include: { images: true },
        });
        if (!car) {
            res.status(404).json({ message: "Car not found" });
            return;
        }
        res.status(200).json(car);
        res.on('finish', () => __awaiter(void 0, void 0, void 0, function* () {
            try {
                yield prismaClient_1.prisma.car.update({
                    where: { id },
                    data: {
                        viewedBy: {
                            increment: 1
                        }
                    }
                });
            }
            catch (err) {
                console.error("View update failed (car ID:", id, "):", err);
            }
        }));
    }
    catch (error) {
        next(error);
    }
});
exports.getOneCarById = getOneCarById;
const createCar = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { make, model, year, price, fuelType, transmission, bodyType, color, description, mileage } = req.body;
    console.log("incoming data is", req.body, req.files);
    try {
        const newCar = yield prismaClient_1.prisma.car.create({
            data: {
                mileage: Number(mileage),
                make,
                model,
                year: Number(year),
                price: Number(price),
                fuelType,
                transmission,
                bodyType,
                color,
                description,
            }
        });
        let uploadedImages = [];
        console.log("req.files is", (_a = req.files) === null || _a === void 0 ? void 0 : _a.length);
        if (Array.isArray(req.files) && req.files.length > 0) {
            console.log("uploading images---");
            uploadedImages = yield Promise.all(req.files.map((file) => __awaiter(void 0, void 0, void 0, function* () {
                const uploaded = yield imageKit_1.imagekit.upload({
                    file: file.buffer,
                    folder: "/cars",
                    fileName: `${Date.now()}-${file.originalname}`,
                });
                console.log("uploading images");
                return { carId: newCar.id, url: uploaded.url, id: uploaded.fileId };
            })));
            // Step 3: Save image URLs in the database
            yield prismaClient_1.prisma.carImage.createMany({ data: uploadedImages });
        }
        res.status(201).json({
            message: "Car created successfully!",
            car: newCar,
            images: uploadedImages,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.createCar = createCar;
const removeCarById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const car = yield prismaClient_1.prisma.car.findUnique({
            where: { id },
            include: { images: true },
        });
        if (!car) {
            res.status(404).json({ message: "Car not found" });
            return;
        }
        // Delete images from ImageKit
        if (car.images.length > 0) {
            yield Promise.all(car.images.map((image) => __awaiter(void 0, void 0, void 0, function* () {
                const fileId = image.id;
                console.log("Extracted fileId:", fileId); // Debug log
                if (fileId) {
                    try {
                        yield imageKit_1.imagekit.deleteFile(fileId);
                        console.log(`✅ Deleted ImageKit file: ${fileId}`);
                    }
                    catch (err) {
                        console.error(`❌ Failed to delete ${fileId}:`);
                        // Continue even if deletion fails
                    }
                }
            })));
        }
        // Delete from database
        yield prismaClient_1.prisma.carImage.deleteMany({ where: { carId: id } });
        yield prismaClient_1.prisma.car.delete({ where: { id } });
        res.status(200).json({ message: "Car and images deleted successfully" });
    }
    catch (error) {
        next(error);
    }
});
exports.removeCarById = removeCarById;
const updateCar = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { make, model, year, price, fuelType, transmission, bodyType, color, description, } = req.body;
    try {
        const car = yield prismaClient_1.prisma.car.findUnique({ where: { id } });
        if (!car) {
            res.status(404).json({ message: "Car not found" });
            return;
        }
        // Update car details
        const updatedCar = yield prismaClient_1.prisma.car.update({
            where: { id },
            data: {
                make,
                model,
                year: Number(year),
                price: Number(price),
                fuelType,
                transmission,
                bodyType,
                color,
                description,
            },
        });
        let uploadedImages = [];
        if (Array.isArray(req.files) && req.files.length > 0) {
            // Upload new images
            uploadedImages = yield Promise.all(req.files.map((file) => __awaiter(void 0, void 0, void 0, function* () {
                const uploaded = yield imageKit_1.imagekit.upload({
                    file: file.buffer,
                    folder: "/cars",
                    fileName: `${Date.now()}-${file.originalname}`,
                });
                return { carId: id, url: uploaded.url, id: uploaded.fileId };
            })));
            // Save new images in the database
            yield prismaClient_1.prisma.carImage.createMany({ data: uploadedImages });
        }
        res.json({
            message: "Car updated successfully!",
            car: updatedCar,
            images: uploadedImages,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.updateCar = updateCar;
const deleteImageById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const image = yield prismaClient_1.prisma.carImage.findUnique({
            where: { id },
        });
        if (!image) {
            res.status(404).json({ message: "Image not found" });
            return;
        }
        // Delete images from ImageKit
        yield imageKit_1.imagekit.deleteFile(image.id);
        console.log(`✅ Deleted ImageKit file: ${image.id}`);
        // Delete from database 
        yield prismaClient_1.prisma.carImage.delete({ where: { id } });
        res.status(200).json({ message: "Image deleted successfully" });
    }
    catch (error) {
        next(error);
    }
});
exports.deleteImageById = deleteImageById;
