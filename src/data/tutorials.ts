export interface TutorialStep {
  id: string;
  stepNumber: number;
  title: string;
  cardTitle: string;
  cardDescription: string;
  subtitle: string;
  duration: string;
  learningPoints: string[];
}

export type TutorialTrack = "compradores" | "proveedores";

export const buyerSteps: TutorialStep[] = [
  {
    id: "buyer-1",
    stepNumber: 1,
    title: "1. Cómo crear una cuenta",
    cardTitle: "Cómo crear una cuenta",
    cardDescription: "Aprende a crear una cuenta en la plataforma.",
    subtitle: "Vídeo",
    duration: "2:15 min",
    learningPoints: [
      "Cómo crear una cuenta de comprador.",
      "Cómo llenar tu información.",
      "Cómo crear contraseña.",
      "Elegir preferencias.",
    ],
  },
  {
    id: "buyer-2",
    stepNumber: 2,
    title: "2. Cómo buscar productos",
    cardTitle: "Cómo buscar productos",
    cardDescription: "Aprende a encontrar rápidamente los productos que necesitas.",
    subtitle: "Vídeo",
    duration: "3:40 min",
    learningPoints: [
      "Cómo utilizar el buscador.",
      "Cómo filtrar productos.",
      "Cómo buscar productos por imagen.",
      "Cómo utilizar la Búsqueda Inteligente.",
      "Cómo consultar los detalles de cada producto.",
    ],
  },
  {
    id: "buyer-3",
    stepNumber: 3,
    title: "3. Conoce a nuestros proveedores",
    cardTitle: "Conoce a nuestros proveedores",
    cardDescription: "Aprende a ver la información, catálogos y calificaciones de los proveedores.",
    subtitle: "Vídeo",
    duration: "4:05 min",
    learningPoints: [
      "Cómo consultar perfiles de proveedores verificados.",
      "Revisar catálogo y lista de precios mayoristas.",
      "Verificar calificaciones, reseñas y ubicación.",
      "Conocer políticas de garantía y plazos de entrega.",
    ],
  },
  {
    id: "buyer-4",
    stepNumber: 4,
    title: "4. Cómo realizar un pedido",
    cardTitle: "Cómo realizar un pedido",
    cardDescription: "Aprende a realizar cotizaciones, agregar productos al carrito y realizar tu pedido.",
    subtitle: "Vídeo",
    duration: "3:50 min",
    learningPoints: [
      "Cómo solicitar cotizaciones a medida.",
      "Agregar productos al carrito mayorista.",
      "Seleccionar métodos de entrega y dirección.",
      "Confirmar el pedido y recibir notificaciones.",
    ],
  },
  {
    id: "buyer-5",
    stepNumber: 5,
    title: "5. Cómo contactar proveedores",
    cardTitle: "Cómo contactar proveedores",
    cardDescription: "Aprende a enviar mensajes y resolver dudas de tu pedido directamente desde la plataforma.",
    subtitle: "Vídeo",
    duration: "2:30 min",
    learningPoints: [
      "Cómo iniciar una conversación por chat interno.",
      "Resolver dudas sobre disponibilidad y volumen.",
      "Adjuntar comprobantes y documentos de soporte.",
      "Gestionar el seguimiento de tus pedidos.",
    ],
  },
  {
    id: "buyer-6",
    stepNumber: 6,
    title: "6. Cómo utilizar la Billetera Digital",
    cardTitle: "Cómo utilizar la Billetera Digital",
    cardDescription: "Aprende a utilizar la billetera digital de la plataforma.",
    subtitle: "Vídeo",
    duration: "4:15 min",
    learningPoints: [
      "Cómo consultar tu saldo disponible y transferencias.",
      "Cómo recargar mediante depósitos bancarios.",
      "Realizar pagos seguros de tus pedidos.",
      "Descargar historial de movimientos y facturas.",
    ],
  },
];

export const providerSteps: TutorialStep[] = [
  {
    id: "prov-1",
    stepNumber: 1,
    title: "1. Cómo crear una cuenta",
    cardTitle: "Cómo crear una cuenta",
    cardDescription: "Aprende a crear una cuenta en la plataforma.",
    subtitle: "Vídeo",
    duration: "2:45 min",
    learningPoints: [
      "Cómo registrar tu empresa como proveedor mayorista.",
      "Subir documentos requeridos (RUC y cédula).",
      "Configurar los datos de tu negocio y ubicación.",
      "Proceso de validación y aprobación de cuenta.",
    ],
  },
  {
    id: "prov-2",
    stepNumber: 2,
    title: "2. Cómo publicar productos",
    cardTitle: "Cómo publicar productos",
    cardDescription: "Aprende a publicar productos en tu catálogo.",
    subtitle: "Vídeo",
    duration: "5:10 min",
    learningPoints: [
      "Cómo crear nuevos productos en tu catálogo.",
      "Configurar precios unitarios y escalas por volumen.",
      "Subir imágenes y especificaciones técnicas.",
      "Administrar disponibilidad e inventario en tiempo real.",
    ],
  },
  {
    id: "prov-3",
    stepNumber: 3,
    title: "3. Cómo utilizar la Billetera Digital",
    cardTitle: "Cómo utilizar la Billetera Digital",
    cardDescription: "Aprende a utilizar la billetera digital de la plataforma.",
    subtitle: "Vídeo",
    duration: "3:30 min",
    learningPoints: [
      "Cómo recibir los ingresos de tus ventas al por mayor.",
      "Consultar comisiones y saldo neto retenido.",
      "Solicitar retiros a cuentas bancarias nacionales.",
      "Monitorear el estado de las transferencias.",
    ],
  },
  {
    id: "prov-4",
    stepNumber: 4,
    title: "4. Cómo visualizar los pedidos",
    cardTitle: "Cómo visualizar los pedidos",
    cardDescription: "Aprende a visualizar los pedidos.",
    subtitle: "Vídeo",
    duration: "3:15 min",
    learningPoints: [
      "Bandeja de pedidos pendientes y cotizaciones.",
      "Aceptar, preparar y marcar pedidos como despachados.",
      "Cargar guías de transporte y entrega.",
      "Historial de entregas completadas.",
    ],
  },
  {
    id: "prov-5",
    stepNumber: 5,
    title: "5. Cómo contactar a los compradores",
    cardTitle: "Cómo contactar a los compradores",
    cardDescription: "Aprende a enviar mensajes y resolver dudas de tu pedido directamente desde la plataforma.",
    subtitle: "Vídeo",
    duration: "2:50 min",
    learningPoints: [
      "Responder mensajes y solicitudes de compradores.",
      "Enviar ofertas personalizadas y acuerdos de precios.",
      "Coordinar detalles logísticos de entrega.",
      "Mantener una buena calificación de servicio.",
    ],
  },
  {
    id: "prov-6",
    stepNumber: 6,
    title: "6. Cómo actualizar tu información",
    cardTitle: "Cómo actualizar tu información",
    cardDescription: "Aprende a actualizar la información de tu negocio",
    subtitle: "Vídeo",
    duration: "3:05 min",
    learningPoints: [
      "Editar logo, nombre comercial y descripción.",
      "Actualizar cuentas bancarias registradas.",
      "Gestionar ubicaciones y zonas de cobertura.",
      "Cambiar contraseñas y permisos de acceso.",
    ],
  },
];
