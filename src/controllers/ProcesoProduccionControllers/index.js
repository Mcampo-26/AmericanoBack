import mongoose from 'mongoose'
import ProcesoProduccion from "../../Models/ProcesoProduccion/index.js";
// controllers
import LogEvento from '../../Models/Logs/index.js';
import MovimientoStock from '../../Models/MovimientoStock/index.js';
import { applyMovimiento, descontarPorReceta } from '../../Service/stock.js';

import Receta   from '../../Models/Receta/index.js';


/**
 * GET /procesos
 * Admin ve todos; usuario solo los suyos
 */
// En tu controlador de procesos (backend)

export const listarProcesos = async (req, res) => {
  try {
    const isAdmin = req.user?.role?.name === "Admin" || req.user?.permisos?.includes("admin");
    const query = isAdmin ? {} : { usuarioId: req.user.id };

    query.status = { $ne: "finalizado" };
    query.cancelado = { $ne: true }; // <- si agregaste el flag

    const procesosFromDB = await ProcesoProduccion.find(query).sort({ createdAt: -1 });
    const ahora = Date.now();

    const procesosActualizados = procesosFromDB.map(p => {
      const pObj = p.toObject();
      if (pObj.status === "en_proceso") {
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


export const finalizarProceso = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const procesoId = req.params.id;
    const io = req.app.get('io') || req.app.locals.io;

    // 1) Cargar proceso
    const p = await ProcesoProduccion.findById(procesoId).session(session);
    if (!p) {
      await session.abortTransaction(); session.endSession();
      return res.status(404).json({ message: 'Proceso no encontrado' });
    }

    // 2) Idempotencia (ya finalizado o ya tiene movimientos)
    const yaAplicado =
      p.status === 'finalizado' ||
      (await MovimientoStock.exists({
        referenciaTipo: 'ProcesoProduccion',
        referenciaId: p._id,
      }).session(session));

    if (yaAplicado) {
      await session.commitTransaction(); session.endSession();
      console.log('[PROC] finalizarProceso: ya aplicado', { procesoId: String(p._id) });
      io?.emit?.('proceso:updated', p);
      return res.json({ ok: true, proceso: p, stock: null, alreadyFinalized: true });
    }

    // 3) Marcar finalizado (acumula si estaba corriendo)
    if (p.status === 'en_proceso') {
      p.acumuladoMs += Date.now() - p.startedAt.getTime();
    }
    p.status = 'finalizado';
    await p.save({ session });

    // ===== STOCK =====
    const cantidadProducida = Number(req.body?.cantidadProducida || 1);

    // 4) Descontar insumos de la receta
    let result = null;
    if (p.recetaId) {
      result = await descontarPorReceta(
        {
          recetaId: p.recetaId,
          cantidad: cantidadProducida,           // escalar por cantidad producida
          usuarioId: req.user?.id,
          referenciaId: p._id,
          referenciaTipo: 'ProcesoProduccion',
        },
        { session }
      );
      console.log('[STOCK] descargas receta >>', {
        procesoId: String(p._id),
        afectados: (result?.afectados || []).length,
      });
    }

    // 5) Entrada del producto final (si corresponde)
    const recetaDoc = p.recetaId
      ? await Receta.findById(p.recetaId)
          .select('productoFinal unidadOutput nombre')
          .lean()
      : null;

    const productoFinalId =
      req.body.productoFinalId || recetaDoc?.productoFinal || p.productoFinal || null;

    let entradaFinal = null;
    if (productoFinalId) {
      entradaFinal = await applyMovimiento(
        {
          productoId: productoFinalId,
          tipo: 'produccion',
          cantidad: +cantidadProducida,
          unidad: req.body.unidadOutput || recetaDoc?.unidadOutput || 'Un',
          loteCodigo: req.body.loteSalida || undefined,
          fechaVencimiento: req.body.fechaVencimientoSalida || undefined,
          referenciaTipo: 'ProcesoProduccion',
          referenciaId: p._id,
          notas: `Producción ${recetaDoc?.nombre || ''} x${cantidadProducida}`,
          usuarioId: req.user?.id,
        },
        { session }
      );
      console.log('[STOCK] entrada producto final >>', {
        procesoId: String(p._id),
        productoId: String(productoFinalId),
        cantidad: cantidadProducida,
      });
    }

    // 6) Commit
    await session.commitTransaction();
    session.endSession();

    // 7) WebSocket: proceso actualizado
    io?.emit?.('proceso:updated', p);
    console.log('[WS] proceso:updated', { procesoId: String(p._id) });

    // 8) WebSocket: consumos (uno por afectado)
    if (result?.afectados?.length) {
      for (const a of result.afectados) {
        const pid = String(a.productoId);
        io?.emit?.('stock:changed', { productoId: pid, reason: 'consumo' });
        console.log('[WS] stock:changed (consumo)', { productoId: pid });
      }
    }

    // 9) WebSocket: entrada del producto final
    if (entradaFinal?.stock?.producto) {
      const pid = String(entradaFinal.stock.producto);
      io?.emit?.('stock:changed', { productoId: pid, reason: 'produccion' });
      console.log('[WS] stock:changed (produccion)', { productoId: pid });
    }

    // 10) Respuesta
    return res.json({
      ok: true,
      proceso: p,
      stock: {
        descargas: result,
        entradaFinal: entradaFinal || null,
      },
    });
  } catch (e) {
    await session.abortTransaction();
    session.endSession();
    console.error('finalizarProceso error:', e);
    return res.status(500).json({ message: e.message || 'Error al finalizar proceso' });
  }
};



export const cancelarProceso = async (req, res) => {
  try {
    const { id } = req.params;
    const motivo = (req.body?.motivo || "").trim();

    const p = await ProcesoProduccion.findById(id);
    if (!p) return res.status(404).json({ message: "Proceso no encontrado" });

    // acumular tiempo si estaba corriendo
    if (p.status === "en_proceso" && p.startedAt) {
      p.acumuladoMs = (p.acumuladoMs || 0) + (Date.now() - new Date(p.startedAt).getTime());
    }

    p.status = "finalizado";
    await p.save();

    // emitir por websocket si usás sockets
    req.app.get("io")?.emit("proceso:updated", p);

    // opcional: loguear desde el back (puedes quitar si lo hacés en el front)
    try {
      await LogEvento.create({
        ts: new Date(),
        userId: req.user?.id || null,
        sessionId: req.user?.sessionId || null,
        action: "prod.cancel",
        entity: "Proceso",
        entityId: String(p._id),
        result: "info",
        meta: {
          estado: "Proceso cancelado",
          motivo: motivo || null,
          nombreReceta: p?.nombreReceta || null,
          usuarioNombre: req.user?.nombre || req.user?.email || null,
        },
        ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
        userAgent: req.headers["user-agent"],
      });
    } catch (_) {}

    return res.json(p);
  } catch (e) {
    console.error("cancelarProceso:", e);
    return res.status(500).json({ message: "Error al cancelar proceso" });
  }
};