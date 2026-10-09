import { defineStore } from "pinia";
import { ref, computed } from "vue";

export interface MockDocument {
  id: string;
  name: string;
  filename: string;
  filesize: string;
  type: "pdf" | "image";
  status: "Válido" | "Inválido" | "Pendiente";
}

export interface MockHistoryItem {
  date: string;
  title: string;
  description: string;
}

export interface MockProviderItem {
  id: string;
  // User Info
  userName: string;
  userEmail: string;
  userInitials: string;
  avatarBg: string;
  userPhone: string;
  userNationalId: string;
  // Business Info
  businessName: string;
  ruc: string;
  businessType: string;
  businessEmail: string;
  businessPhone: string;
  description: string;
  address: string;
  logoFilename: string;
  logoFilesize: string;
  // Metadata
  registeredAt: string;
  registeredDate: string; // ISO-like for filtering
  status: "Pendiente" | "Aprobado" | "Rechazado";
  role: string;
  // Documents & Timeline
  documents: MockDocument[];
  history: MockHistoryItem[];
  // Rejection Details if applicable
  rejectionReason?: string;
  rejectionNotes?: string;
}

const INITIAL_PROVIDERS: MockProviderItem[] = [
  {
    id: "prov-1",
    userName: "María López Velázquez",
    userEmail: "maria@dilopez.com",
    userInitials: "ML",
    avatarBg: "bg-[#0284c7]",
    userPhone: "+505 8378 5757",
    userNationalId: "001-180990-0004A",
    businessName: "Distribuidora López S.A.",
    ruc: "J0310000123456",
    businessType: "Comercio al por mayor",
    businessEmail: "ventas@dilopez.com",
    businessPhone: "+505 8378 5757",
    description: "Distribución de productos de consumo masivo, bebidas y alimentos.",
    address: "Managua, Nicaragua",
    logoFilename: "logo_negocio.jpg",
    logoFilesize: "312 KB",
    registeredAt: "02 oct 2026 10:25 AM",
    registeredDate: "2026-10-02T10:25:00",
    status: "Pendiente",
    role: "Importador",
    documents: [
      {
        id: "doc-1",
        name: "Cédula del propietario",
        filename: "cedula_maria_lopez.pdf",
        filesize: "2.4 MB",
        type: "pdf",
        status: "Válido",
      },
      {
        id: "doc-2",
        name: "RUC del negocio",
        filename: "ruc_distribuidora.pdf",
        filesize: "1.8 MB",
        type: "pdf",
        status: "Válido",
      },
      {
        id: "doc-3",
        name: "Logo del negocio",
        filename: "logo_negocio.jpg",
        filesize: "312 KB",
        type: "image",
        status: "Válido",
      },
    ],
    history: [
      {
        date: "17 sep 2026, 02:25 PM",
        title: "Solicitud enviada a revisión",
        description: "El importador adjuntó sus documentos legales y solicitó verificación de cuenta.",
      },
    ],
  },
  {
    id: "prov-2",
    userName: "José Castillo",
    userEmail: "jose@castillo.com",
    userInitials: "JC",
    avatarBg: "bg-[#b45309]",
    userPhone: "+505 8455 1290",
    userNationalId: "001-250488-0012B",
    businessName: "Comercial Castillo",
    ruc: "J0510000223457",
    businessType: "Comercio al por mayor",
    businessEmail: "ventas@comercialcastillo.com",
    businessPhone: "+505 8455 1290",
    description: "Venta de ferretería pesada y materiales de construcción al por mayor.",
    address: "León, Nicaragua",
    logoFilename: "logo_castillo.png",
    logoFilesize: "420 KB",
    registeredAt: "01 oct 2026 04:35 PM",
    registeredDate: "2026-10-01T16:35:00",
    status: "Pendiente",
    role: "Importador",
    documents: [
      {
        id: "doc-21",
        name: "Cédula del propietario",
        filename: "cedula_jose_castillo.pdf",
        filesize: "2.1 MB",
        type: "pdf",
        status: "Válido",
      },
      {
        id: "doc-22",
        name: "RUC del negocio",
        filename: "ruc_comercial_castillo.pdf",
        filesize: "1.5 MB",
        type: "pdf",
        status: "Válido",
      },
      {
        id: "doc-23",
        name: "Logo del negocio",
        filename: "logo_castillo.png",
        filesize: "420 KB",
        type: "image",
        status: "Válido",
      },
    ],
    history: [
      {
        date: "01 oct 2026, 04:35 PM",
        title: "Solicitud enviada a revisión",
        description: "Documentación enviada para aprobación de cuenta comercial.",
      },
    ],
  },
  {
    id: "prov-3",
    userName: "Dora Cruz",
    userEmail: "dora@delsur.com",
    userInitials: "DC",
    avatarBg: "bg-[#0f766e]",
    userPhone: "+505 8899 4433",
    userNationalId: "001-120385-0003K",
    businessName: "Importaciones del Sur",
    ruc: "J0510000323458",
    businessType: "Comercio al por mayor",
    businessEmail: "info@delsur.com",
    businessPhone: "+505 8899 4433",
    description: "Importación directa de textiles, calzado y accesorios desde Asia y Panamá.",
    address: "Granada, Nicaragua",
    logoFilename: "logo_delsur.jpg",
    logoFilesize: "285 KB",
    registeredAt: "01 oct 2026 11:40 AM",
    registeredDate: "2026-10-01T11:40:00",
    status: "Aprobado",
    role: "Importador",
    documents: [
      {
        id: "doc-31",
        name: "Cédula del propietario",
        filename: "cedula_dora_cruz.pdf",
        filesize: "1.9 MB",
        type: "pdf",
        status: "Válido",
      },
      {
        id: "doc-32",
        name: "RUC del negocio",
        filename: "ruc_importaciones_delsur.pdf",
        filesize: "2.0 MB",
        type: "pdf",
        status: "Válido",
      },
      {
        id: "doc-33",
        name: "Logo del negocio",
        filename: "logo_delsur.jpg",
        filesize: "285 KB",
        type: "image",
        status: "Válido",
      },
    ],
    history: [
      {
        date: "01 oct 2026, 02:15 PM",
        title: "Cuenta verificada y aprobada",
        description: "El administrador aprobó la solicitud de verificación.",
      },
      {
        date: "01 oct 2026, 11:40 AM",
        title: "Solicitud enviada a revisión",
        description: "Documentos legales presentados para revisión de catálogo.",
      },
    ],
  },
  {
    id: "prov-4",
    userName: "Fernanda Martínez",
    userEmail: "fmartinez@roble.com",
    userInitials: "FM",
    avatarBg: "bg-[#1e293b]",
    userPhone: "+505 8765 4321",
    userNationalId: "001-050692-0009J",
    businessName: "Mercantil El Roble S.A.",
    ruc: "J0610000423459",
    businessType: "Comercio al por mayor",
    businessEmail: "contacto@roble.com",
    businessPhone: "+505 8765 4321",
    description: "Distribución de insumos para hotelería, restaurantes y cafeterías.",
    address: "Managua, Nicaragua",
    logoFilename: "logo_el_roble.png",
    logoFilesize: "390 KB",
    registeredAt: "30 sep 2026 03:22 PM",
    registeredDate: "2026-09-30T15:22:00",
    status: "Aprobado",
    role: "Importador",
    documents: [
      {
        id: "doc-41",
        name: "Cédula del propietario",
        filename: "cedula_fernanda_martinez.pdf",
        filesize: "2.3 MB",
        type: "pdf",
        status: "Válido",
      },
      {
        id: "doc-42",
        name: "RUC del negocio",
        filename: "ruc_mercantil_el_roble.pdf",
        filesize: "1.7 MB",
        type: "pdf",
        status: "Válido",
      },
    ],
    history: [
      {
        date: "30 sep 2026, 05:00 PM",
        title: "Cuenta verificada y aprobada",
        description: "Validación de personería jurídica y documentación legal exitosa.",
      },
      {
        date: "30 sep 2026, 03:22 PM",
        title: "Solicitud enviada a revisión",
        description: "Ingreso de solicitud en el portal de proveedores.",
      },
    ],
  },
  {
    id: "prov-5",
    userName: "Ana Ramírez",
    userEmail: "ana@variedades.com",
    userInitials: "AR",
    avatarBg: "bg-[#991b1b]",
    userPhone: "+505 8234 5678",
    userNationalId: "001-140789-0010T",
    businessName: "Variedades Ana",
    ruc: "J0110000523460",
    businessType: "Comercio al por mayor",
    businessEmail: "contacto@variedades.com",
    businessPhone: "+505 8234 5678",
    description: "Comercialización de artículos para el hogar y novedades al mayoreo.",
    address: "Masaya, Nicaragua",
    logoFilename: "logo_variedades_ana.jpg",
    logoFilesize: "198 KB",
    registeredAt: "29 sep 2026 09:10 AM",
    registeredDate: "2026-09-29T09:10:00",
    status: "Rechazado",
    role: "Importador",
    rejectionReason: "Documentación inválida o incompleta",
    rejectionNotes: "La cédula adjunta no es legible y el RUC no coincide con la razón social registrada.",
    documents: [
      {
        id: "doc-51",
        name: "Cédula del propietario",
        filename: "cedula_ana_ramirez.pdf",
        filesize: "1.2 MB",
        type: "pdf",
        status: "Inválido",
      },
      {
        id: "doc-52",
        name: "RUC del negocio",
        filename: "ruc_variedades_ana.pdf",
        filesize: "1.1 MB",
        type: "pdf",
        status: "Inválido",
      },
    ],
    history: [
      {
        date: "29 sep 2026, 11:30 AM",
        title: "Cuenta rechazada (Documentación inválida o incompleta)",
        description: "La cédula adjunta no es legible y el RUC no coincide con la razón social registrada.",
      },
      {
        date: "29 sep 2026, 09:10 AM",
        title: "Solicitud enviada a revisión",
        description: "Envío inicial de solicitud.",
      },
    ],
  },
  {
    id: "prov-6",
    userName: "Suministros Miranda",
    userEmail: "ventas@miranda.com",
    userInitials: "SM",
    avatarBg: "bg-[#475569]",
    userPhone: "+505 8612 3456",
    userNationalId: "001-080287-0005V",
    businessName: "Suministros Miranda S.A.",
    ruc: "J0910000623461",
    businessType: "Comercio al por mayor",
    businessEmail: "ventas@miranda.com",
    businessPhone: "+505 8612 3456",
    description: "Suministros de papelería, tecnología y equipos de oficina.",
    address: "Chinandega, Nicaragua",
    logoFilename: "logo_miranda.png",
    logoFilesize: "310 KB",
    registeredAt: "28 sep 2026 02:48 PM",
    registeredDate: "2026-09-28T14:48:00",
    status: "Pendiente",
    role: "Importador",
    documents: [
      {
        id: "doc-61",
        name: "Cédula del propietario",
        filename: "cedula_miranda.pdf",
        filesize: "2.2 MB",
        type: "pdf",
        status: "Válido",
      },
      {
        id: "doc-62",
        name: "RUC del negocio",
        filename: "ruc_suministros_miranda.pdf",
        filesize: "1.9 MB",
        type: "pdf",
        status: "Válido",
      },
    ],
    history: [
      {
        date: "28 sep 2026, 02:48 PM",
        title: "Solicitud enviada a revisión",
        description: "Esperando validación de documentos por parte del auditor.",
      },
    ],
  },
  {
    id: "prov-7",
    userName: "Tienda Central",
    userEmail: "contacto@central.com",
    userInitials: "TC",
    avatarBg: "bg-[#7e22ce]",
    userPhone: "+505 8901 2345",
    userNationalId: "001-300194-0015L",
    businessName: "Tienda Central",
    ruc: "J0810000723462",
    businessType: "Pequeño comercio",
    businessEmail: "contacto@central.com",
    businessPhone: "+505 8901 2345",
    description: "Distribución de abarrotes y productos secos para comercios locales.",
    address: "Estelí, Nicaragua",
    logoFilename: "logo_central.jpg",
    logoFilesize: "260 KB",
    registeredAt: "27 sep 2026 11:12 AM",
    registeredDate: "2026-09-27T11:12:00",
    status: "Aprobado",
    role: "Importador",
    documents: [
      {
        id: "doc-71",
        name: "Cédula del propietario",
        filename: "cedula_propietario_central.pdf",
        filesize: "1.8 MB",
        type: "pdf",
        status: "Válido",
      },
      {
        id: "doc-72",
        name: "RUC del negocio",
        filename: "ruc_tienda_central.pdf",
        filesize: "1.6 MB",
        type: "pdf",
        status: "Válido",
      },
    ],
    history: [
      {
        date: "27 sep 2026, 01:20 PM",
        title: "Cuenta verificada y aprobada",
        description: "Revisión completada exitosamente.",
      },
      {
        date: "27 sep 2026, 11:12 AM",
        title: "Solicitud enviada a revisión",
        description: "Solicitud de verificación creada.",
      },
    ],
  },
];

export const useMockProvidersStore = defineStore("mockProviders", () => {
  const providers = ref<MockProviderItem[]>([...INITIAL_PROVIDERS]);

  // Tab counts
  const totalCount = computed(() => 128);
  const verifiedCount = computed(() => {
    const approvedInList = providers.value.filter((p) => p.status === "Aprobado").length;
    return 100 - (3 - approvedInList);
  });
  const rejectedCount = computed(() => {
    const rejectedInList = providers.value.filter((p) => p.status === "Rechazado").length;
    return 28 + (rejectedInList - 1);
  });
  const pendingCount = computed(() => {
    return providers.value.filter((p) => p.status === "Pendiente").length;
  });

  function getProviderById(id: string): MockProviderItem | undefined {
    return providers.value.find((p) => p.id === id);
  }

  function approveProvider(id: string): boolean {
    const p = providers.value.find((item) => item.id === id);
    if (!p) return false;

    p.status = "Aprobado";
    const nowStr = new Intl.DateTimeFormat("es-NI", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(new Date());

    p.history.unshift({
      date: nowStr,
      title: "Cuenta verificada y aprobada",
      description: "El usuario podrá publicar y gestionar sus productos con el sello de verificado.",
    });

    return true;
  }

  function rejectProvider(id: string, reason: string, notes?: string): boolean {
    const p = providers.value.find((item) => item.id === id);
    if (!p) return false;

    p.status = "Rechazado";
    p.rejectionReason = reason;
    p.rejectionNotes = notes;

    const nowStr = new Intl.DateTimeFormat("es-NI", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(new Date());

    p.history.unshift({
      date: nowStr,
      title: `Cuenta rechazada (${reason})`,
      description: notes || "No se especificaron detalles adicionales.",
    });

    return true;
  }

  function resetToDefaults() {
    providers.value = JSON.parse(JSON.stringify(INITIAL_PROVIDERS));
  }

  return {
    providers,
    totalCount,
    verifiedCount,
    rejectedCount,
    pendingCount,
    getProviderById,
    approveProvider,
    rejectProvider,
    resetToDefaults,
  };
});
