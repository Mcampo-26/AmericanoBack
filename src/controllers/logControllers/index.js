import LogEvento from "../../Models/Logs/index.js";

// Helpers tolerantes a fecha (YYYY-MM-DD o ISO)
const normDesde = (s) => (s?.includes("T") ? s : `${s}T00:00:00`);
const normHasta = (s) => (s?.includes("T") ? s : `${s}T23:59:59`);

export const listarLogs = async (req, res) => {
  try {
    const { userId, action, desde, hasta, page = 1, limit = 50, hideHb } = req.query;

    const q = {};
    if (userId) q.userId = userId;
    if (action) q.action = action;
    if (hideHb) q.action = { $ne: "ui.heartbeat" };
    if (desde || hasta) {
      q.ts = {};
      if (desde) q.ts.$gte = new Date(desde.includes("T") ? desde : `${desde}T00:00:00`);
      if (hasta) q.ts.$lte = new Date(hasta.includes("T") ? hasta : `${hasta}T23:59:59`);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const docs = await LogEvento.find(q)
      .sort({ ts: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate("userId", "nombre email")        // ← importante
      .lean();

    // Normalizamos 'user' para el frontend
    const items = docs.map(d => ({
      ...d,
      user: d.userId && typeof d.userId === "object"
        ? { _id: d.userId._id, nombre: d.userId.nombre, email: d.userId.email }
        : null
    }));

    const total = await LogEvento.countDocuments(q);
    res.json({ items, total, page: Number(page), limit: Number(limit) });
  } catch (e) {
    res.status(500).json({ message: "Error listando logs", error: e.message });
  }
};
// POST /api/log/heartbeat  { active, tsClient }
export const registrarHeartbeat = async (req, res) => {
  try {
    await LogEvento.create({
      ts: new Date(),
      userId: req.user?.id || null,           // si tu auth middleware setea req.user
      sessionId: req.user?.sessionId || null,
      action: "ui.heartbeat",
      result: "info",
      meta: { active: !!req.body?.active, tsClient: req.body?.tsClient },
      ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
      userAgent: req.headers["user-agent"],
    });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: "Error registrando heartbeat", error: e.message });
  }
};

// (Opcionales) endpoints para paneles rápidos:
export const sesionesDelDia = async (req, res) => {
  try {
    const { userId, fecha } = req.query;
    const start = new Date(`${fecha}T00:00:00`);
    const end   = new Date(`${fecha}T23:59:59`);

    const eventos = await LogEvento.find({
      userId, action: { $in: ["auth.login","auth.logout"] }, ts: { $gte: start, $lte: end }
    }).sort({ ts: 1 }).lean();

    const porSesion = new Map();
    for (const ev of eventos) {
      if (!porSesion.has(ev.sessionId)) porSesion.set(ev.sessionId, []);
      porSesion.get(ev.sessionId).push(ev);
    }

    const sesiones = [];
    for (const [sid, evs] of porSesion) {
      const login = evs.find(e => e.action === "auth.login");
      const logout = [...evs].reverse().find(e => e.action === "auth.logout");
      if (login) {
        sesiones.push({
          sessionId: sid,
          inicio: login.ts,
          fin: logout?.ts || null,
          duracionMs: logout ? (new Date(logout.ts) - new Date(login.ts)) : null
        });
      }
    }
    res.json(sesiones);
  } catch (e) {
    res.status(500).json({ message: "Error sesiones", error: e.message });
  }
};

export const produccionDia = async (req, res) => {
  try {
    const { userId, fecha } = req.query;
    const start = new Date(`${fecha}T00:00:00`);
    const end   = new Date(`${fecha}T23:59:59`);

    const eventos = await LogEvento.find({
      userId, action: { $in: ["prod.start","prod.end"] }, ts: { $gte: start, $lte: end }
    }).sort({ ts: 1 }).lean();

    const porProceso = new Map();
    for (const ev of eventos) {
      const key = ev.entityId || ev.meta?.procesoId;
      if (!key) continue;
      if (!porProceso.has(key)) porProceso.set(key, []);
      porProceso.get(key).push(ev);
    }

    let totalMs = 0;
    for (const [, evs] of porProceso) {
      const s = evs.find(e => e.action === "prod.start");
      const f = [...evs].reverse().find(e => e.action === "prod.end");
      if (s && f) totalMs += (new Date(f.ts) - new Date(s.ts));
    }
    res.json({ totalMs });
  } catch (e) {
    res.status(500).json({ message: "Error producción", error: e.message });
  }
};

export const ocioDia = async (req, res) => {
  try {
    const { userId, fecha } = req.query;
    const start = new Date(`${fecha}T00:00:00`);
    const end   = new Date(`${fecha}T23:59:59`);

    const beats = await LogEvento.find({
      userId, action: "ui.heartbeat", ts: { $gte: start, $lte: end }
    }).sort({ ts: 1 }).lean();

    let ocioMs = 0;
    const UMBRAL = 120_000; // 2min
    for (let i = 1; i < beats.length; i++) {
      const gap = new Date(beats[i].ts) - new Date(beats[i-1].ts);
      if (gap > UMBRAL) ocioMs += (gap - UMBRAL);
    }
    res.json({ ocioMs });
  } catch (e) {
    res.status(500).json({ message: "Error ocio", error: e.message });
  }
};

export const registrarEvento = async (req, res) => {
  try {
    const { action, entity, entityId, result = "ok", meta = {} } = req.body || {};
    if (!action) return res.status(400).json({ message: "action requerido" });

    const metaConUsuario = {
      ...meta,
      usuarioNombre: meta.usuarioNombre || req.user?.nombre || req.user?.email || undefined,
    };

    const ev = await LogEvento.create({
      ts: new Date(),
      userId: req.user?.id || null,
      sessionId: req.user?.sessionId || null,
      action,
      entity,
      entityId,
      result,
      meta: metaConUsuario,
      ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
      userAgent: req.headers["user-agent"],
    });

    res.json({ ok: true, _id: ev._id });
  } catch (e) {
    res.status(500).json({ message: "Error registrando evento", error: e.message });
  }
};
