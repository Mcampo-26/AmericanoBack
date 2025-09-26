import LogEvento from "../Models/Logs/index.js";

export const logEvent = async ({
  userId, sessionId, action, entity, entityId, result = "ok", meta = {}, req
}) => {
  return LogEvento.create({
    ts: new Date(),
    userId,
    sessionId,
    action,
    entity,
    entityId,
    result,
    ip: req?.headers?.["x-forwarded-for"] || req?.socket?.remoteAddress,
    userAgent: req?.headers?.["user-agent"],
    meta
  });
};