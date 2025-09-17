// services/stock.service.js

import Stock from '../Models/Stock/index.js';
import MovimientoStock from '../Models/MovimientoStock/index.js'
import Receta from '../Models/Receta/index.js';;
import Producto from '../Models/Producto/producto.js'; 

export async function applyMovimiento(args, opts = {}) {
  let {
    productoId,           // ObjectId del Producto
    tipo,                 // 'compra' | 'venta' | 'produccion' | 'ajuste' | 'merma' | ...
    cantidad,             // >0 entra, <0 sale
    unidad = 'un',
    costoUnitario,        // sólo para ENTRADAS (promedio móvil)
    loteCodigo,           // opcional
    fechaVencimiento,     // opcional
    referenciaTipo,       // opcional (p.ej. 'ProcesoProduccion')
    referenciaId,         // opcional (id externo)
    notas,                // opcional
    usuarioId             // opcional (auditoría)
  } = args;

  // ===== Validar / normalizar =====
  cantidad = Number(cantidad);
  if (!productoId || !tipo || !Number.isFinite(cantidad) || cantidad === 0) {
    throw new Error('productoId, tipo y cantidad válidos son obligatorios');
  }
  const isEntrada = cantidad > 0;
  const session = opts.session || null;

  // ===== Upsert de Stock =====
  const stock = await Stock.findOneAndUpdate(
    { producto: productoId },
    { $setOnInsert: { producto: productoId } },
    { new: true, upsert: true, session }
  );

  // asegurar estructuras
  stock.lotes = Array.isArray(stock.lotes) ? stock.lotes : [];
  const disponible = Number(stock.cantidadDisponible ?? 0);

  // ===== Reglas de disponibilidad (no permitir negativo) =====
  if (!isEntrada && disponible + cantidad < 0) {
    throw new Error('Stock insuficiente para realizar la salida');
  }

  // ===== Gestión de lotes =====
  const now = new Date();

  if (loteCodigo) {
    // Actualización sobre lote específico
    const idx = stock.lotes.findIndex(l => l.codigo === loteCodigo);

    if (idx === -1) {
      if (isEntrada) {
        // Crear lote en ENTRADA
        stock.lotes.push({
          codigo: loteCodigo,
          fechaVencimiento: fechaVencimiento || null,
          cantidad: cantidad, // (>0)
          costoUnitario: typeof costoUnitario === 'number'
            ? costoUnitario
            : (stock.ultimoCosto || 0),
          createdAt: now,
          updatedAt: now
        });
        stock.lotes.push({
          codigo: loteCodigo,
          fechaVencimiento: fechaVencimiento || null,
          cantidad: cantidad,                 // >0
          cantidadInicial: Number(cantidad),  // ⬅️ NUEVO: para poder calcular "descontada"
          costoUnitario: typeof costoUnitario === 'number'
            ? costoUnitario
            : (stock.ultimoCosto || 0),
          origen: tipo || 'entrada',          // p.ej. 'compra' | 'produccion' | 'ajuste'
          referenciaTipo: referenciaTipo || null,
          referenciaId: referenciaId || null,
          createdBy: usuarioId || null,
          createdByNombre: req?.user?.nombre || undefined, // si no tenés req acá, omitilo
          createdAt: now,
          updatedAt: now
        });
      } else {
        // Salida de lote inexistente
        throw new Error(`No existe el lote ${loteCodigo} para descontar`);
      }
    } else {
      // Modificar lote existente (+ / -)
      const nuevo = Number(stock.lotes[idx].cantidad || 0) + cantidad;
      if (nuevo < 0) {
        throw new Error(`Lote ${loteCodigo} quedaría negativo`);
      }
      stock.lotes[idx].cantidad = nuevo;
      stock.lotes[idx].updatedAt = now;

      // Si es ENTRADA y viene costo → actualiza costo del lote
      if (isEntrada && typeof costoUnitario === 'number') {
        stock.lotes[idx].costoUnitario = costoUnitario;
      }
    }
  } else if (!isEntrada) {
    // Salida SIN lote: consumir FIFO simple
    let aDescontar = Math.abs(cantidad);

    // (opcional) ordenar por createdAt asc si lo tenés
    // stock.lotes.sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt));

    for (let i = 0; i < stock.lotes.length && aDescontar > 0; i++) {
      const disponibleLote = Number(stock.lotes[i].cantidad || 0);
      const take = Math.min(disponibleLote, aDescontar);
      stock.lotes[i].cantidad = disponibleLote - take;
      stock.lotes[i].updatedAt = now;
      aDescontar -= take;
    }

    // Si hay lotes pero no alcanzó
    if (aDescontar > 0 && stock.lotes.length) {
      throw new Error('No hay cantidad suficiente en lotes para la salida');
    }

    // limpiar lotes vacíos
    stock.lotes = stock.lotes.filter(l => Number(l.cantidad || 0) > 0);
  }

  // ===== Totales =====
  const anterior = disponible;
  stock.cantidadDisponible = anterior + cantidad;
  stock.ultimoMovimientoAt = now;

  // ===== Costos (promedio móvil en ENTRADAS) =====
  if (isEntrada && typeof costoUnitario === 'number') {
    const qIn = cantidad;                       // (>0)
    const costoPrev = Number(stock.costoPromedio || 0);
    const qPrev = Math.max(anterior, 0);        // existencias previas
    const newQ = qPrev + qIn;
    const newAvg = newQ > 0
      ? ((costoPrev * qPrev) + (costoUnitario * qIn)) / newQ
      : costoUnitario;

    stock.costoPromedio = Number(newAvg.toFixed(6));
    stock.ultimoCosto = costoUnitario;
  }

  // Guardar stock
  await stock.save({ session });

  // ===== Registrar movimiento =====
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


const norm = (s='') => s
  .toString()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/\s+/g, ' ')
  .trim();

export async function descontarPorReceta(
  { recetaId, cantidad = 1, usuarioId, referenciaId, referenciaTipo = 'ProcesoProduccion' },
  opts = {}
) {
  if (!recetaId) throw new Error('recetaId es obligatorio');
  const session = opts.session || null;

  const receta = await Receta.findById(recetaId).lean();
  if (!receta) throw new Error('Receta no encontrada');

  const ingredientes = Array.isArray(receta.ingredientes) ? receta.ingredientes : [];
  console.log(`[STOCK] Receta ${receta.nombre} → ingredientes:`, ingredientes.length);

  // 🔎 Traer productos y mapear por nombre normalizado
  const productos = await Producto.find({}, { _id: 1, nombre: 1 }).lean();
  const mapPorNombre = new Map(productos.map(p => [norm(p.nombre), p]));

  console.log(`[STOCK] Productos en catálogo:`, productos.length);

  const afectados = [];

  for (const ing of ingredientes) {
    const base = Number(ing.cantidad || 0);
    const unidad = ing.unidad || 'un';
    const key = norm(ing.nombre);

    console.log(`[STOCK] ING -> "${ing.nombre}" (key="${key}") x base=${base} ${unidad}`);

    if (!base) { console.log('   ↳ skip (cantidad=0)'); continue; }

    let prod = mapPorNombre.get(key);

    // fallback suave: buscar por "incluye" si no hubo match exacto normalizado
    if (!prod) {
      prod = productos.find(p => norm(p.nombre).includes(key) || key.includes(norm(p.nombre)));
      if (prod) console.log(`   ↳ fallback match con "${prod.nombre}"`);
    }

    if (!prod?._id) {
      console.warn(`   ↳ ❗ No se encontró Producto para "${ing.nombre}"`);
      continue;
    }

    const qtySalida = -1 * base * Number(cantidad || 1); // salida → negativo
    console.log(`   ↳ movimiento: ${qtySalida} ${unidad} de ${prod.nombre} (${prod._id})`);

    const { stock, movimiento } = await applyMovimiento({
      productoId: prod._id,
      tipo: 'produccion',
      cantidad: qtySalida,
      unidad,
      referenciaTipo,
      referenciaId,
      notas: `Producción ${receta.nombre} x${cantidad}`,
      usuarioId
    }, { session });

    afectados.push({
      productoId: String(prod._id),
      delta: qtySalida,
      unidad,
      cantidadDisponible: stock.cantidadDisponible,
      movimientoId: movimiento._id
    });
  }

  console.log(`[STOCK] Afectados total:`, afectados.length);
  return { recetaId: String(receta._id), cantidad: Number(cantidad || 1), afectados };
}

export async function listStock({ q, lowOnly } = {}) {
  const filter = {};
  if (q) filter.$text = { $search: q }; // Nota: asegurar índice de texto si lo vas a usar
  if (lowOnly) filter.$expr = { $lt: ['$cantidadDisponible', '$stockMinimo'] };
  return Stock
    .find(filter)
    .populate('producto', 'nombre codigo codigoBarras');
}
