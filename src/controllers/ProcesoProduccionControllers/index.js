import ProcesoProduccion from "../../Models/ProcesoProduccion/index.js";

/**
 * GET /procesos
 * Admin ve todos; usuario solo los suyos
 */
// En tu controlador de procesos (backend)

export const listarProcesos = async (req, res) => {
  try {
    // ✅ LÓGICA DE ROL CORREGIDA Y ROBUSTA
    const isAdmin = req.user?.role?.name === 'Admin' || // Comprueba el objeto role.name
                    req.user?.permisos?.includes('admin'); // Mantiene la comprobación de permisos por si acaso

    // El resto de la lógica ya es correcta
    const query = isAdmin ? {} : { usuarioId: req.user.id };
    query.status = { $ne: 'finalizado' };

    const procesosFromDB = await ProcesoProduccion.find(query).sort({ createdAt: -1 });

    const ahora = Date.now();
    const procesosActualizados = procesosFromDB.map(p => {
      const pObj = p.toObject();
      if (pObj.status === 'en_proceso') {
        const tiempoTranscurrido = ahora - new Date(pObj.startedAt).getTime();
        const tiempoAcumulado = pObj.acumuladoMs || 0;
        pObj.remainingMs = Math.max(0, pObj.duracionMs - (tiempoAcumulado + tiempoTranscurrido));
      } else {
        pObj.remainingMs = Math.max(0, pObj.duracionMs - (pObj.acumuladoMs || 0));
      }
      return pObj;
    });

    res.json(procesosActualizados);
  } catch (e) {
    console.error("Error en listarProcesos:", e);
    res.status(500).json({ message: "Error al listar los procesos" });
  }
};
export const crearProceso = async (req, res) => {
  try {
    const { recetaId, nombreReceta, duracionMs } = req.body;

    const proceso = await ProcesoProduccion.create({
      recetaId,
      nombreReceta,
      duracionMs,  // ⬅ Tiempo TOTAL en ms
      usuarioId: req.user.id,
      usuarioNombre: req.user.nombre,
      startedAt: new Date(),
      status: "en_proceso",
      acumuladoMs: 0,  // ⬅ Tiempo ya transcurrido
      minimized: false,
    });

    // ⚠️ Asegúrate de devolver los campos que el frontend espera:
    const procesoParaFront = {
      ...proceso.toObject(),
      remainingMs: duracionMs,  // ⬅ Para que el timer empiece correctamente
    };

    req.app.get("io")?.emit("proceso:created", procesoParaFront);
    res.status(201).json(procesoParaFront);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Error al crear proceso" });
  }
};

export const setMinimized = async (req, res) => {
  try {
    const { minimized } = req.body;
    const proceso = await ProcesoProduccion.findByIdAndUpdate(
      req.params.id,
      { minimized: !!minimized },
      { new: true }
    );
    if (!proceso) return res.status(404).json({ message: "Proceso no encontrado" });

    req.app.get("io")?.emit("proceso:updated", proceso);
    res.json(proceso);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Error al minimizar proceso" });
  }
};

/**
 * PATCH /procesos/:id/pausar
 * Pasa de en_proceso -> pausado (acumula tiempo transcurrido)
 */
export const pausarProceso = async (req, res) => {
  try {
    const p = await ProcesoProduccion.findById(req.params.id);
    if (!p) return res.status(404).json({ message: "Proceso no encontrado" });
    if (p.status !== "en_proceso") {
      return res.status(400).json({ message: "El proceso no está en ejecución" });
    }
    p.acumuladoMs += Date.now() - p.startedAt.getTime();
    p.status = "pausado";
    await p.save();

    req.app.get("io")?.emit("proceso:updated", p);
    res.json(p);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Error al pausar proceso" });
  }
};

/**
 * PATCH /procesos/:id/reanudar
 * Pasa de pausado -> en_proceso (reinicia startedAt)
 */
export const reanudarProceso = async (req, res) => {
  try {
    const p = await ProcesoProduccion.findById(req.params.id);
    if (!p) return res.status(404).json({ message: "Proceso no encontrado" });
    if (p.status !== "pausado") {
      return res.status(400).json({ message: "El proceso no está pausado" });
    }
    p.startedAt = new Date();
    p.status = "en_proceso";
    await p.save();

    req.app.get("io")?.emit("proceso:updated", p);
    res.json(p);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Error al reanudar proceso" });
  }
};

/**
 * PATCH /procesos/:id/finalizar
 * Marca finalizado y acumula si está corriendo
 */
export const finalizarProceso = async (req, res) => {
  try {
    const p = await ProcesoProduccion.findById(req.params.id);
    if (!p) return res.status(404).json({ message: "Proceso no encontrado" });

    if (p.status === "en_proceso") {
      p.acumuladoMs += Date.now() - p.startedAt.getTime();
    }
    p.status = "finalizado";
    await p.save();

    req.app.get("io")?.emit("proceso:updated", p);
    res.json(p);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Error al finalizar proceso" });
  }
};



export const actualizarProcesoParcial = async (req, res) => {
  try {
    const { id } = req.params;

    // Lista de campos que el frontend puede modificar
    const allowedUpdates = ["status", "remainingMs", "minimized", "nombreReceta"];
    const patchData = {};
    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        patchData[key] = req.body[key];
      }
    }

    const procesoActualizado = await ProcesoProduccion.findByIdAndUpdate(
      id,
      { $set: patchData },
      { new: true } // 'new: true' devuelve el documento después de la actualización
    );

    if (!procesoActualizado) {
      return res.status(404).json({ message: "Proceso no encontrado" });
    }

    // ✅ SOLUCIÓN: Recalculamos el 'remainingMs' antes de enviar la respuesta.
    const pObj = procesoActualizado.toObject();
    if (pObj.status === 'en_proceso') {
      const ahora = Date.now();
      const tiempoTranscurrido = ahora - new Date(pObj.startedAt).getTime();
      const tiempoAcumulado = pObj.acumuladoMs || 0;
      pObj.remainingMs = Math.max(0, pObj.duracionMs - (tiempoAcumulado + tiempoTranscurrido));
    }

    // Emitir el evento de socket con los datos actualizados
    req.app.get("io")?.emit("proceso:updated", pObj);

    // Enviar la respuesta JSON con los datos actualizados
    res.json(pObj);

  } catch (e) {
    console.error("Error en actualizarProcesoParcial:", e);
    res.status(500).json({ message: "Error al actualizar el proceso" });
  }
};

export const eliminarProceso = async (req, res) => {
  try {
    const { id } = req.params;
    const eliminado = await ProcesoProduccion.findByIdAndDelete(id);
    if (!eliminado) {
      return res.status(404).json({ message: "Proceso no encontrado" });
    }
    const io = req.app.locals.io;
    io.to("procesos").emit("proceso:removed", { id });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Error al eliminar proceso" });
  }
};