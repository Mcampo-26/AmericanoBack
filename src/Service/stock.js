// services/stock.service.js

import Stock from '../Models/Stock/index.js';
import MovimientoStock from '../Models/MovimientoStock/index.js';

/**
 * applyMovimiento:
 *  - Crea un MovimientoStock y actualiza el documento de Stock del producto.
 *  - Mantiene cantidades totales, lotes y costos (promedio móvil).
 *  - Soporta tipos: compra(+), venta(-), produccion(+/-), ajuste(+/-), merma(-), devolucion_in(+), devolucion_out(-)
 *  - Puede ejecutarse dentro de una transacción (opts.session)
 */
export async function applyMovimiento({
  productoId,        // id del Producto afectado
  tipo,              // tipo de movimiento (enum de negocio)
  cantidad,          // valor con signo: >0 entra; <0 sale
  unidad = 'un',     // unidad de medida (por defecto 'un')
  costoUnitario,     // costo de ENTRADAS para recalcular promedio (opcional pero recomendado)
  loteCodigo,        // identificar lote específico (opcional)
  fechaVencimiento,  // vencimiento del lote (opcional)
  referenciaTipo,    // tipo de documento externo (OrdenCompra, Venta, etc.)
  referenciaId,      // id del documento externo
  notas,             // observaciones
  usuarioId          // auditoría: usuario que ejecuta
}, opts = {}) {
  // Validaciones mínimas
  if (!productoId || !tipo || !cantidad) {
    throw new Error('productoId, tipo y cantidad son obligatorios');
  }

  // Determina si el movimiento es entrada (>0) o salida (<0)
  const isEntrada = cantidad > 0;

  // Transacción opcional
  const session = opts.session || null;

  // Upsert del documento de Stock para el producto
  // - Si no existe, lo crea con producto seteado.
  const stock = await Stock.findOneAndUpdate(
    { producto: productoId },
    { $setOnInsert: { producto: productoId } },
    { new: true, upsert: true, session }
  );

  // Evitar stock negativo en salidas
  if (!isEntrada && stock.cantidadDisponible + cantidad < 0) {
    throw new Error('Stock insuficiente para realizar la salida');
  }

  // --- Gestión de lotes ---
  const now = new Date();

  if (loteCodigo) {
    // Si especifican lote: se actualiza ese lote puntual
    const idx = stock.lotes.findIndex(l => l.codigo === loteCodigo);

    if (idx === -1) {
      // Lote no existe
      if (isEntrada) {
        // Si es entrada: se crea el lote con la cantidad que ingresa
        stock.lotes.push({
          codigo: loteCodigo,
          fechaVencimiento: fechaVencimiento || null,
          cantidad: cantidad, // cantidad > 0 aquí
          // Si no envían costoUnitario, usa el último costo conocido o 0
          costoUnitario: costoUnitario ?? (stock.ultimoCosto || 0),
          createdAt: now,
          updatedAt: now
        });
      } else {
        // Si es salida y no existe el lote → error
        throw new Error(`No existe el lote ${loteCodigo} para descontar`);
      }
    } else {
      // Lote ya existe: ajusta cantidad (suma o resta según el signo)
      const nuevo = stock.lotes[idx].cantidad + cantidad;
      if (nuevo < 0) throw new Error(`Lote ${loteCodigo} quedaría negativo`);
      stock.lotes[idx].cantidad = nuevo;
      stock.lotes[idx].updatedAt = now;

      // Si es ENTRADA y mandaron costoUnitario, se actualiza el costo del lote
      if (isEntrada && typeof costoUnitario === 'number') {
        stock.lotes[idx].costoUnitario = costoUnitario;
      }
    }
  } else if (!isEntrada) {
    // Salida SIN lote específico → consume lotes en orden (FIFO simple)
    let aDescontar = Math.abs(cantidad);
    for (let i = 0; i < stock.lotes.length && aDescontar > 0; i++) {
      const take = Math.min(stock.lotes[i].cantidad, aDescontar);
      stock.lotes[i].cantidad -= take;
      stock.lotes[i].updatedAt = now;
      aDescontar -= take;
    }
    // Si falta por descontar y existen lotes → no alcanza
    if (aDescontar > 0 && stock.lotes.length) {
      throw new Error('No hay cantidad suficiente en lotes para la salida');
    }
    // Limpia lotes que hayan quedado en 0
    stock.lotes = stock.lotes.filter(l => l.cantidad > 0);
  }

  // --- Totales de stock ---
  const anterior = stock.cantidadDisponible;            // cantidad previa
  stock.cantidadDisponible = anterior + cantidad;       // suma/resta según signo
  stock.ultimoMovimientoAt = now;

  // --- Costos: promedio móvil (solo ENTRADAS con costoUnitario) ---
  if (isEntrada && typeof costoUnitario === 'number') {
    const qIn = cantidad;                               // cantidad que entra
    const costoPrev = stock.costoPromedio || 0;         // promedio anterior
    const qPrev = Math.max(anterior, 0);                // existencias previas (no negativas)
    const newQ = qPrev + qIn;                           // nuevo total
    // promedio ponderado: (costoPrev*qPrev + costoUnitario*qIn) / newQ
    const newAvg = newQ > 0
      ? ((costoPrev * qPrev) + (costoUnitario * qIn)) / newQ
      : costoUnitario;

    stock.costoPromedio = Number(newAvg.toFixed(6));    // guarda con precisión razonable
    stock.ultimoCosto = costoUnitario;                  // último costo conocido de entrada
  }

  // Persiste los cambios del Stock (opcionalmente dentro de session)
  await stock.save({ session });

  // --- Registrar el movimiento en la bitácora (historial/auditoría) ---
  const mov = await MovimientoStock.create([{
    producto: productoId,
    stock: stock._id,
    tipo,
    cantidad,
    unidad,
    loteCodigo: loteCodigo || undefined,
    fechaVencimiento: fechaVencimiento || undefined,
    costoUnitario: typeof costoUnitario === 'number' ? costoUnitario : undefined,
    referenciaTipo,
    referenciaId,
    notas,
    usuario: usuarioId
  }], { session });

  // Retorna el stock actualizado y el movimiento creado
  return { stock, movimiento: mov[0] };
}

/**
 * getStockByProducto:
 *  - Busca el documento Stock por productoId.
 *  - Devuelve también datos básicos del producto (populate).
 */
export async function getStockByProducto(productoId) {
  return Stock
    .findOne({ producto: productoId })
    .populate('producto', 'nombre codigo codigoBarras');
}

/**
 * listStock:
 *  - Lista stock con filtros:
 *    - q: texto (requiere índice de texto en la colección si querés usarlo)
 *    - lowOnly: solo items por debajo del stockMinimo
 */
export async function listStock({ q, lowOnly } = {}) {
  const filter = {};
  if (q) filter.$text = { $search: q }; // Nota: asegurar índice de texto si lo vas a usar
  if (lowOnly) filter.$expr = { $lt: ['$cantidadDisponible', '$stockMinimo'] };
  return Stock
    .find(filter)
    .populate('producto', 'nombre codigo codigoBarras');
}
