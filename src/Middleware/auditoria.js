// middleware/auditoria.js
import LogEvento from "../Models/Logs/index.js";

export const auditoriaMiddleware = (opts = {}) => async (req, res, next) => {
  const start = Date.now();
  res.on("finish", async () => {
    try {
      const userId = req.user?.id || null;
      // Podés filtrar rutas si no querés loguear TODO:
      const action = `http.${req.method.toLowerCase()}:${req.path}`;

      await LogEvento.create({
        ts: new Date(),
        userId,
        sessionId: req.session?.id,
        action,
        result: res.statusCode < 400 ? "ok" : "error",
        ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
        userAgent: req.headers["user-agent"],
        meta: {
          status: res.statusCode,
          durationMs: Date.now() - start,
          query: req.query,
          bodyKeys: Object.keys(req.body || {})
        }
      });
    } catch {}
  });
  next();
};
