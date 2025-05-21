🍸 AmericanoBack

Backend del sistema de gestión para el Bar Americano, desarrollado con Node.js, Express y MongoDB. Diseñado para soportar operaciones en tiempo real, integraciones con servicios externos y múltiples módulos funcionales.
📦 Módulos principales
🪑 Salón

    Gestión de mesas, pedidos y comensales

    Control de estados de mesa y pago

🛵 Delivery

    Control de pedidos por estado: espera, cocina, preparados, enviados

    Integración con APIs de plataformas como PedidosYa, Rappi, etc.

🍳 Producción

    Gestión de pedidos para cocina

    Estados: pendiente, en preparación, listo

    Soporte para impresión de tickets

💰 Ventas y Caja

    Registro de ventas con detalle de productos

    Cierres de caja y reportes diarios

🧰 Tecnologías

    Node.js + Express – servidor y manejo de rutas

    MongoDB + Mongoose – base de datos NoSQL

    Socket.IO – soporte para actualizaciones en tiempo real (en desarrollo)

    JWT – autenticación segura basada en tokens

    CORS, Helmet, Morgan – seguridad y monitoreo

⚙️ Instalación

npm install
npm run dev

    🔌 Asegurate de tener una instancia de MongoDB corriendo (local o remota) y configurar tu archivo .env.

