import express from "express";
import { createCar,getAllCars, getOneCarById, removeCarById, updateCar } from "../controllers/car.controller";

import multer from "multer";

//here we are uploading the files to RAM
const upload = multer({ storage: multer.memoryStorage() });



const router = express.Router();

router.get("/", getAllCars);
router.get("/:id",getOneCarById);
router.post("/", upload.array('images'),  createCar);
router.delete("/:id",removeCarById)
router.put("/:id",updateCar)

export default router;
