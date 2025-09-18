// services/stock.service.js

import Stock from '../Models/Stock/index.js';
import MovimientoStock from '../Models/MovimientoStock/index.js'
import Receta from '../Models/Receta/index.js';;
import Producto from '../Models/Producto/producto.js'; 

export const applyMovimiento = async (input, opts = {}) => {
  const { session = null, capToAvailable = false, allowNegative = false } = opts;

  let {
    productoId, tipo, cantidad, unidad, costoUnitario,
    loteCodigo, fechaVencimiento, referenciaTipo, referenciaId, notas, usuarioId
  } = input;

  cantidad = Number(cantidad || 0);
  if (!productoId) throw new Error('productoId es obligatorio');
  if (!tipo) throw new Error('tipo es obligatorio');
  if (!cantidad) throw new Error('cantidad es obligatoria');

  const isEntrada = cantidad > 0;

  const stock = await Stock.findOne({ producto: productoId }).session(session);
  if (!stock) throw new Error('Stock no encontrado');
  if (!Array.isArray(stock.lotes)) stock.lotes = [];

  // localizar lote si se indicó
  let lotIndex = -1;
  if (loteCodigo) {
    lotIndex = stock.lotes.findIndex(l => l.codigo === loteCodigo);
  }

  // ========= Validaciones y/o CAP =========
  if (!isEntrada) {
    const totalLotes = stock.lotes.reduce((a, l) => a + Number(l.cantidad || 0), 0);
    const dispTotal  = stock.lotes.length ? totalLotes : Number(stock.cantidadDisponible || 0);
    const dispLote   = (loteCodigo && lotIndex >= 0) ? Number(stock.lotes[lotIndex].cantidad || 0) : dispTotal;

    // Si hay lotes y NO vino lote -> luego hacemos FIFO (cap después)
    if (!(stock.lotes.length && !loteCodigo) && capToAvailable) {
      const cap = loteCodigo ? dispLote : dispTotal;
      if (cap + cantidad < 0) cantidad = -cap;
    }

    if (!allowNegative) {
      if (dispTotal + cantidad < 0) throw new Error('Stock insuficiente');
      if (loteCodigo && lotIndex >= 0 && stock.lotes[lotIndex].cantidad + cantidad < 0) {
        throw new Error('Stock de lote insuficiente');
      }
    }
  }

  // ========= Salida sin lote → FIFO por lotes =========
  let consumosPorLote = [];
  if (!isEntrada && !loteCodigo && stock.lotes.length) {
    const req = Math.abs(cantidad);
    let pendiente = req;

    const ordenados = [...stock.lotes].sort((a, b) => {
      const fa = a.fechaVencimiento ? new Date(a.fechaVencimiento).getTime() : Infinity;
      const fb = b.fechaVencimiento ? new Date(b.fechaVencimiento).getTime() : Infinity;
      if (fa !== fb) return fa - fb;
      const ca = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const cb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return ca - cb;
    });

    for (const l of ordenados) {
      if (pendiente <= 0) break;
      const disp = Number(l.cantidad || 0);
      if (disp <= 0) continue;

      const desc = Math.min(disp, pendiente);
      l.cantidad = disp - desc;
      pendiente -= desc;
      consumosPorLote.push({ codigo: l.codigo, cantidad: -desc, fechaVencimiento: l.fechaVencimiento });
    }

    if (pendiente > 0 && !allowNegative && !capToAvailable) {
      throw new Error('Stock de lotes insuficiente');
    }

    // cantidad real aplicada (para el movimiento "global" si hiciera falta)
    const aplicado = req - pendiente;
    cantidad = -aplicado;
  }

  // ========= Entrada/Salida a un lote específico =========
  if (loteCodigo) {
    if (lotIndex >= 0) {
      const l = stock.lotes[lotIndex];
      l.cantidad = Math.max(0, Number(l.cantidad || 0) + cantidad);
      if (fechaVencimiento) l.fechaVencimiento = fechaVencimiento;
      if (isEntrada && typeof costoUnitario === 'number') l.costoUnitario = costoUnitario;
    } else {
      // crear lote solo en ENTRADAS
      if (isEntrada) {
        stock.lotes.push({
          codigo: loteCodigo,
          fechaVencimiento: fechaVencimiento || null,
          cantidad: Math.max(0, cantidad),
          costoUnitario: typeof costoUnitario === 'number' ? costoUnitario : undefined,
          createdBy: usuarioId
        });
      }
      // si es salida y el lote no existe: no creamos nada (queda en 0)
    }
  }

  // ========= Recalcular TOTAL SIEMPRE al final =========
  if (stock.lotes.length) {
    stock.cantidadDisponible = stock.lotes.reduce((a, l) => a + Number(l.cantidad || 0), 0);
  } else {
    stock.cantidadDisponible = Number(stock.cantidadDisponible || 0) + cantidad;
  }

  // Asegurar persistencia de cambios en subdocumentos
  if (stock.markModified) stock.markModified('lotes');
  await stock.save({ session });

  // ========= Registrar movimiento(s) =========
  const base = {
    producto: productoId,
    stock: stock._id,
    tipo,
    unidad: unidad || stock.unidadBase,
    referenciaTipo, referenciaId, notas,
    usuario: usuarioId
  };

  let movimientos = [];
  if (!loteCodigo && consumosPorLote.length) {
    movimientos = await MovimientoStock.create(
      consumosPorLote.map(c => ({
        ...base,
        cantidad: c.cantidad,
        loteCodigo: c.codigo,
        fechaVencimiento: c.fechaVencimiento
      })),
      { session }
    );
  } else {
    const [mov] = await MovimientoStock.create([{
      ...base,
      cantidad,
      loteCodigo: loteCodigo || undefined,
      fechaVencimiento: fechaVencimiento || undefined,
      costoUnitario: typeof costoUnitario === 'number' ? costoUnitario : undefined
    }], { session });
    movimientos = [mov];
  }

  return { stock, movimiento: movimientos[0], movimientos };
};
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

// Service/stock.js (o donde tengas la función)
export async function descontarPorReceta(
  { recetaId, cantidad = 1, usuarioId, referenciaId, referenciaTipo = 'ProcesoProduccion' },
  opts = {}
) {
  if (!recetaId) throw new Error('recetaId es obligatorio');
  const session = opts.session || null;

  const receta = await Receta.findById(recetaId).lean();
  if (!receta) throw new Error('Receta no encontrada');

  const rindeBase = Number(receta.rindeBase ?? 1);
  const factor = Number(cantidad || 1) / (rindeBase || 1);

  // 👇 filtrar nulos/indefinidos/valores no-objeto
  const ingredientesRaw = Array.isArray(receta.ingredientes) ? receta.ingredientes : [];
  const ingredientes = ingredientesRaw.filter(i => i && typeof i === 'object');

  const productos = await Producto.find({}, { _id: 1, nombre: 1 }).lean();
  const norm = (s='') => s.toString().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
  const mapPorNombre = new Map(productos.map(p => [norm(p.nombre), p]));

  const afectados = [];

  for (const ing of ingredientes) {
    // ⛑️ si no tiene cantidad numérica válida, salteá
    const base = Number(ing?.cantidad ?? 0);
    if (!Number.isFinite(base) || base <= 0) continue;

    const unidad = ing?.unidad || 'un';

    let prodId = ing?.productoId || ing?.producto || null;
    let prodNombre = ing?.nombre;

    if (!prodId) {
      const key = norm(ing?.nombre || '');
      const prod = mapPorNombre.get(key)
        || productos.find(p => norm(p.nombre).includes(key) || key.includes(norm(p.nombre)));
      if (!prod?._id) { console.warn('⏭️ Ingrediente sin match de producto:', ing); continue; }
      prodId = prod._id;
      prodNombre = prod.nombre;
    }

    const consumo   = +(base * factor).toFixed(6);
    const qtySalida = -consumo;

    const { stock, movimiento } = await applyMovimiento({
      productoId: prodId,
      tipo: 'produccion',
      cantidad: qtySalida,
      unidad,
      referenciaTipo,
      referenciaId,
      notas: `Producción ${receta.nombre} x${cantidad}`,
      usuarioId
    }, { session, capToAvailable: true, allowNegative: false });

    afectados.push({
      productoId: String(prodId),
      nombre: prodNombre,
      delta: movimiento?.cantidad ?? 0,
      unidad,
      cantidadDisponible: stock.cantidadDisponible,
      movimientoId: movimiento?._id ?? null
    });
  }

  return { recetaId: String(receta._id), cantidad: Number(cantidad || 1), rindeBase, afectados };
}



export const listStock = async ({ q = "", lowOnly = false, page = 1, limit = 10 }) => {
  const matchMain = {};
  if (lowOnly) matchMain.$expr = { $lt: ["$cantidadDisponible", "$stockMinimo"] };

  const pipeline = [
    { $match: matchMain },

    // 👈 nombre real de la colección (modelo "Producto" → colección "productos")
    { $lookup: { from: "productos", localField: "producto", foreignField: "_id", as: "prod" } },
    { $unwind: "$prod" },

    // opcional: sólo productos activos
    { $match: { "prod.activo": { $ne: false } } },

    // filtro q sin $text
    ...(q ? [{
      $match: {
        $or: [
          { "prod.nombre":       { $regex: q, $options: "i" } },
          { "prod.codigo":       { $regex: q, $options: "i" } },
          { "prod.codigoBarras": { $regex: q, $options: "i" } }
        ]
      }
    }] : []),

    { $sort: { updatedAt: -1, _id: -1 } },

    {
      $facet: {
        data:  [{ $skip: (Number(page)-1)*Number(limit) }, { $limit: Number(limit) }],
        total: [{ $count: "count" }]
      }
    }
  ];

  const agg = await Stock.aggregate(pipeline);
  const data  = agg[0]?.data  ?? [];
  const total = agg[0]?.total?.[0]?.count ?? 0;

  // normalizar: mover prod → producto
  const items = data.map(d => ({ ...d, producto: d.prod, prod: undefined }));

  return { items, total, page: Number(page), limit: Number(limit) };
};
