import { Request, Response, NextFunction } from "express";
import { prisma } from "../utils/prismaClient";
import multer from "multer";
import { imagekit } from "../lib/imageKit";

const upload = multer({ storage: multer.memoryStorage() });

export const getAllCars = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const cars = await prisma.car.findMany({ include: { images: true } }); // Await the database query
    res.json(cars); // Send response to client
  } catch (error) {
    next(error); // Pass errors to Express error handler
  }
};

export const createCar = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const {
    make,
    model,
    year,
    price,
    fuelType,
    transmission,
    bodyType,
    color,
    description,
  } = req.body;

  console.log("incoming data is", req.body, req.files);

  try {
    const newCar = await prisma.car.create({
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

    let uploadedImages: { carId: string; url: string ; id:string }[] = [];

    console.log("req.files is", req.files?.length);

    if (Array.isArray(req.files) && req.files.length > 0) {
      console.log("uploading images---");
      uploadedImages = await Promise.all(
        (req.files as Express.Multer.File[]).map(async (file) => {
          const uploaded = await imagekit.upload({
            file: file.buffer,
            folder: "/cars",
            fileName: `${Date.now()}-${file.originalname}`,
          });
          console.log("uploading images");
          return { carId: newCar.id, url: uploaded.url, id:uploaded.fileId };
        })
      );

      // Step 3: Save image URLs in the database
      await prisma.carImage.createMany({ data: uploadedImages });
    }

    res.status(201).json({
      message: "Car created successfully!",
      car: newCar,
      images: uploadedImages,
    });
  } catch (error) {
    next(error);
  }
};


export const removeCarById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;

  try {
    const car = await prisma.car.findUnique({
      where: { id },
      include: { images: true },
    });

    if (!car) {
      res.status(404).json({ message: "Car not found" });
      return;
    }

    // Delete images from ImageKit
    if (car.images.length > 0) {
      await Promise.all(
        car.images.map(async (image) => {
          const fileId = image.id;
          console.log("Extracted fileId:", fileId); // Debug log
          if (fileId) {
            try {
              await imagekit.deleteFile(fileId);
              console.log(`✅ Deleted ImageKit file: ${fileId}`);
            } catch (err) {
              console.error(`❌ Failed to delete ${fileId}:`);
              // Continue even if deletion fails
            }
          }
        })
      );
    }

    // Delete from database
    await prisma.carImage.deleteMany({ where: { carId: id } });
    await prisma.car.delete({ where: { id } });

    res.status(200).json({ message: "Car and images deleted successfully" });
  } catch (error) {
    next(error);
  }
};

export const updateCar = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  const {
    make,
    model,
    year,
    price,
    fuelType,
    transmission,
    bodyType,
    color,
    description,
  } = req.body;

  try {
    const car = await prisma.car.findUnique({ where: { id } });

    if (!car) {
      res.status(404).json({ message: "Car not found" });
      return 
    }

    // Update car details
    const updatedCar = await prisma.car.update({
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

    let uploadedImages: { carId: string; url: string }[] = [];

    if (Array.isArray(req.files) && req.files.length > 0) {
      console.log("Uploading new images...");

      // Delete old images from ImageKit
      const oldImages = await prisma.carImage.findMany({ where: { carId: id } });
      await Promise.all(
        oldImages.map(async (image) => {
          const fileId = image.url.split("/").pop()?.split(".")[0];
          if (fileId) {
            await imagekit.deleteFile(fileId);
          }
        })
      );

      // Delete old images from database
      await prisma.carImage.deleteMany({ where: { carId: id } });

      // Upload new images
      uploadedImages = await Promise.all(
        req.files["images"].map(async (file: Express.Multer.File) => {
          const uploaded = await imagekit.upload({
            file: file.buffer,
            folder: "/cars",
            fileName: `${Date.now()}-${file.originalname}`,
          });
          return { carId: id, url: uploaded.url };
        })
      );

      // Save new images in the database
      await prisma.carImage.createMany({ data: uploadedImages });
    }

    res.json({
      message: "Car updated successfully!",
      car: updatedCar,
      images: uploadedImages,
    });
  } catch (error) {
    next(error);
  }
};
