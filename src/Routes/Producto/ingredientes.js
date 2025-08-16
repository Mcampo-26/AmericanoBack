import { Router } from "express";
import {
  crearIngrediente,
  obtenerIngredientes,
  obtenerIngredientePorId,
  actualizarIngrediente,
  eliminarIngrediente,
} from "../../controllers/productoControllers/ingredientes.js";

const router = Router();


router.get("/get", obtenerIngredientes);
router.post("/create", crearIngrediente);
router.get("/:id", obtenerIngredientePorId);
router.put("/:id", actualizarIngrediente);
router.delete("/:id", eliminarIngrediente);

export default router;
