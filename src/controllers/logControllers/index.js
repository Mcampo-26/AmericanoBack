// src/controllers/logsController.js
import LogEvento from "../../Models/Logs/index.js";

/* ----------------- helpers de fecha y parsing ----------------- */
const normDesde = (s) => (s?.includes("T") ? s : `${s}T00:00:00`);
const normHasta = (s) => (s?.includes("T") ? s : `${s}T23:59:59`);
const toBool = (v) => v === true || v === "true" || v === "1";

/* =========================== LISTAR =========================== */
export const listarLogs = async (req, res) => {
  try {
    const page  = Math.max(1, Number(req.query.page ?? 1));
    const limit = Math.min(200, Math.max(1, Number(req.query.limit ?? 50)));

    const nombre = (req.query.nombre || req.query.q || "").trim();
    const evento = (req.query.evento || req.query.action || "").trim();
    const hideHb = toBool(req.query.hideHb);   // 👈 nuevo
    const desdeQ = req.query.desde ? new Date(normDesde(req.query.desde)) : null;
    const hastaQ = req.query.hasta ? new Date(normHasta(req.query.hasta)) : null;

    const and = [];
    if (evento) and.push({ action: evento });
    if (hideHb) and.push({ action: { $ne: "ui.heartbeat" } }); // 👈 excluir heartbeats

    if (nombre) {
      const re = new RegExp(nombre.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      and.push({
        $or: [
          { "meta.usuarioNombre": re },
          { "user.nombre": re },
          { "user.email": re },
        ],
      });
    }

    if (desdeQ || hastaQ) {
      const ts = {};
      if (desdeQ) ts.$gte = desdeQ;
      if (hastaQ) ts.$lte = hastaQ;
      and.push({ ts });
    }

    const query = and.length ? { $and: and } : {};
    const skip = (page - 1) * limit;

    const docs = await LogEvento.find(query)
      .sort({ ts: -1 })
      .skip(skip)
      .limit(limit)
      .populate("userId", "nombre email")
      .lean();

    const items = docs.map((d) => ({
      ...d,
      user:
        d.userId && typeof d.userId === "object"
          ? { _id: d.userId._id, nombre: d.userId.nombre, email: d.userId.email }
          : d.user || null,
    }));

    const total = await LogEvento.countDocuments(query);
    res.json({ items, total, page, limit });
  } catch (e) {
    res.status(500).json({ message: "Error listando logs", error: e.message });
  }
};

/* ======================== HEARTBEAT =========================== */
// POST /api/log/heartbeat  { active: boolean, tsClient?: ISO }
export const registrarHeartbeat = async (req, res) => {
  try {
    const usuarioNombre = req.user?.nombre || req.user?.email || undefined;

    await LogEvento.create({
      ts: new Date(),
      userId: req.user?._id || req.user?.id || null,
      user: req.user
        ? {
            _id: req.user._id || req.user.id,
            nombre: req.user.nombre,
            email: req.user.email,
            role: req.user?.role?.name || req.user?.role,
          }
        : undefined,
      sessionId: req.user?.sessionId || null,
      action: "ui.heartbeat",
      entity: "ui",
      entityId: req.user?.sessionId || undefined,
      result: "info",
      meta: {
        active: !!req.body?.active,
        tsClient: req.body?.tsClient,
        usuarioNombre, // siempre que podamos
      },
      ip: req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
      userAgent: req.headers["user-agent"],
    });

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: "Error registrando heartbeat", error: e.message });
  }
};

/* ===================== SESIONES DEL DÍA ======================= */
// GET /api/log/sesiones-del-dia?userId=...&fecha=YYYY-MM-DD
export const sesionesDelDia = async (req, res) => {
  try {
    const { userId, fecha } = req.query;
    if (!userId || !fecha) {
      return res.status(400).json({ message: "userId y fecha son requeridos" });
    }
    const start = new Date(normDesde(fecha));
    const end = new Date(normHasta(fecha));

    const eventos = await LogEvento.find({
      userId,
      action: { $in: ["auth.login", "auth.logout"] },
      ts: { $gte: start, $lte: end },
    })
      .sort({ ts: 1 })
      .lean();

    const porSesion = new Map();
    for (const ev of eventos) {
      if (!porSesion.has(ev.sessionId)) porSesion.set(ev.sessionId, []);
      porSesion.get(ev.sessionId).push(ev);
    }

    const sesiones = [];
    for (const [sid, evs] of porSesion) {
      const login = evs.find((e) => e.action === "auth.login");
      const logout = [...evs].reverse().find((e) => e.action === "auth.logout");
      if (login) {
        sesiones.push({
          sessionId: sid,
          inicio: login.ts,
          fin: logout?.ts || null,
          duracionMs: logout ? new Date(logout.ts) - new Date(login.ts) : null,
        });
      }
    }

    res.json(sesiones);
  } catch (e) {
    res.status(500).json({ message: "Error sesiones", error: e.message });
  }
};

/* ===================== PRODUCCIÓN DEL DÍA ===================== */
// GET /api/log/produccion-dia?userId=...&fecha=YYYY-MM-DD
export const produccionDia = async (req, res) => {
  try {
    const { userId, fecha } = req.query;
    if (!userId || !fecha) {
      return res.status(400).json({ message: "userId y fecha son requeridos" });
    }
    const start = new Date(normDesde(fecha));
    const end = new Date(normHasta(fecha));

    const eventos = await LogEvento.find({
      userId,
      action: { $in: ["prod.start", "prod.finish"] }, // unificado
      ts: { $gte: start, $lte: end },
    })
      .sort({ ts: 1 })
      .lean();

    const porProceso = new Map();
    for (const ev of eventos) {
      const key = ev.entityId || ev.meta?.procesoId;
      if (!key) continue;
      if (!porProceso.has(key)) porProceso.set(key, []);
      porProceso.get(key).push(ev);
    }

    let totalMs = 0;
    for (const [, evs] of porProceso) {
      const s = evs.find((e) => e.action === "prod.start");
      const f = [...evs].reverse().find((e) => e.action === "prod.finish");
      if (s && f) totalMs += new Date(f.ts) - new Date(s.ts);
    }

    res.json({ totalMs });
  } catch (e) {
    res.status(500).json({ message: "Error producción", error: e.message });
  }
};

/* ========================= OCIO DEL DÍA ======================= */
// Proxy simple de inactividad basada en gaps de heartbeats
// GET /api/log/ocio-dia?userId=...&fecha=YYYY-MM-DD
export const ocioDia = async (req, res) => {
  try {
    const { userId, fecha } = req.query;
    if (!userId || !fecha) {
      return res.status(400).json({ message: "userId y fecha son requeridos" });
    }
    const start = new Date(normDesde(fecha));
    const end = new Date(normHasta(fecha));

    const beats = await LogEvento.find({
      userId,
      action: "ui.heartbeat",
      ts: { $gte: start, $lte: end },
    })
      .sort({ ts: 1 })
      .lean();

    let ocioMs = 0;
    const UMBRAL = 120_000; // 2min
    for (let i = 1; i < beats.length; i++) {
      const gap = new Date(beats[i].ts) - new Date(beats[i - 1].ts);
      if (gap > UMBRAL) ocioMs += gap - UMBRAL;
    }
    res.json({ ocioMs });
  } catch (e) {
    res.status(500).json({ message: "Error ocio", error: e.message });
  }
};

/* ======================== REGISTRAR EVENTO ==================== */
// POST /api/log/evento  { action, entity?, entityId?, result?, meta? }
export const registrarEvento = async (req, res) => {
  try {
    const { action, entity, entityId, result = "ok", meta = {} } = req.body || {};
    if (!action) return res.status(400).json({ message: "action requerido" });

    const usuarioNombre = meta.usuarioNombre || req.user?.nombre || req.user?.email || undefined;

    const ev = await LogEvento.create({
      ts: new Date(),
      userId: req.user?._id || req.user?.id || null,
      user: req.user
        ? {
            _id: req.user._id || req.user.id,
            nombre: req.user.nombre,
            email: req.user.email,
            role: req.user?.role?.name || req.user?.role,
          }
        : undefined,
      sessionId: req.user?.sessionId || null,
      action,
      entity,
      entityId: entityId ? String(entityId) : undefined,
      result,
      meta: { ...meta, usuarioNombre },
      ip: req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
      userAgent: req.headers["user-agent"],
    });

    res.json({ ok: true, _id: ev._id });
  } catch (e) {
    res.status(500).json({ message: "Error registrando evento", error: e.message });
  }
};
