// Seed de vacantes realistas para demostración.
// Uso: node src/scripts/seed-vacantes.js
// Idempotente: no inserta si el título ya existe.
import 'dotenv/config';
import { v4 as uuid } from 'uuid';
import { pool, query, queryOne } from '../config/db.js';

const DEPARTAMENTOS = ['Tecnología', 'RRHH', 'Finanzas', 'Marketing', 'Operaciones', 'Comercial', 'Diseño', 'Soporte', 'Logística', 'Administración'];
const MODALIDADES = ['presencial', 'remoto', 'hibrido'];
const CONTRATOS = ['indefinido', 'temporal', 'practicas', 'freelance', 'prestacion_servicios'];
const CIUDADES = ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Bucaramanga', 'Cartagena', 'Remoto (LATAM)', 'Pereira', 'Manizales'];

const PLANTILLAS = [
  ['Desarrollador Frontend', 'Tecnología', 'Implementación de interfaces con React y Tailwind, integración con APIs REST y mejora continua de la experiencia de usuario.', 'React, TypeScript, Tailwind, Git, pruebas unitarias'],
  ['Desarrollador Backend', 'Tecnología', 'Diseño y mantenimiento de servicios Node.js/Express y bases de datos relacionales.', 'Node.js, Express, MySQL/PostgreSQL, REST, Docker'],
  ['Ingeniero de Sistemas', 'Tecnología', 'Administración de infraestructura, monitoreo y soporte a equipos internos.', 'Linux, Networking, Cloud (AWS/GCP), scripting'],
  ['Analista de Datos', 'Tecnología', 'Análisis de datos de negocio, dashboards y reportes accionables.', 'SQL, Python, Power BI/Looker, estadística'],
  ['Soporte Técnico N1', 'Soporte', 'Atención de tickets, diagnóstico inicial y escalamiento al equipo técnico.', 'Soporte a usuarios, helpdesk, comunicación, paciencia'],
  ['Soporte Técnico N2', 'Soporte', 'Resolución avanzada de incidencias y trabajo con equipos de ingeniería.', 'Troubleshooting, redes, sistemas operativos'],
  ['Diseñador Gráfico', 'Diseño', 'Diseño de piezas digitales, branding y soporte a marketing.', 'Adobe Suite, Figma, identidad visual'],
  ['Diseñador UX/UI', 'Diseño', 'Diseño de interfaces y experiencia de usuario centrada en negocio.', 'Figma, prototipado, investigación de usuarios'],
  ['Community Manager', 'Marketing', 'Gestión de comunidades en redes sociales y creación de contenido.', 'Redes sociales, copywriting, métricas, Canva'],
  ['Especialista en SEO', 'Marketing', 'Optimización on-page y off-page, análisis de palabras clave y reportes.', 'SEO, GA4, Search Console, redacción'],
  ['Ejecutivo Comercial', 'Comercial', 'Prospección, cierre de ventas y atención de clientes B2B.', 'Ventas consultivas, CRM, negociación'],
  ['Coordinador Comercial', 'Comercial', 'Liderazgo de equipo de ventas y cumplimiento de cuotas.', 'Liderazgo, KPIs, CRM, planeación'],
  ['Asistente de RRHH', 'RRHH', 'Apoyo al área de talento humano, reclutamiento y onboarding.', 'Reclutamiento, comunicación, organización'],
  ['Psicólogo Organizacional', 'RRHH', 'Aplicación de pruebas, entrevistas y acompañamiento al desarrollo.', 'Pruebas psicotécnicas, entrevistas por competencias'],
  ['Reclutador IT', 'RRHH', 'Búsqueda y filtrado de perfiles técnicos para múltiples vacantes.', 'Reclutamiento técnico, LinkedIn Recruiter, sourcing'],
  ['Contador', 'Finanzas', 'Conciliaciones, cierres mensuales y reportes contables.', 'NIIF, Excel avanzado, impuestos, ERP'],
  ['Analista Financiero', 'Finanzas', 'Análisis de presupuesto, flujo de caja y proyecciones.', 'Excel avanzado, modelado financiero, SQL'],
  ['Auxiliar Contable', 'Finanzas', 'Registro de operaciones, causación y soporte al área contable.', 'Excel, contabilidad básica, organización'],
  ['Auxiliar Administrativo', 'Administración', 'Gestión documental, agenda y soporte a operaciones internas.', 'Office, comunicación, organización'],
  ['Coordinador Logístico', 'Logística', 'Planificación de despachos, inventarios y proveedores.', 'Inventarios, logística, Excel, negociación'],
  ['Supervisor de Operaciones', 'Operaciones', 'Liderazgo operativo, control de calidad y mejora continua.', 'Liderazgo, KPIs, mejora continua, seguridad'],
  ['Jefe de Marketing', 'Marketing', 'Estrategia de marca, equipos de contenido y desempeño.', 'Estrategia, performance, liderazgo, branding'],
  ['Product Manager', 'Tecnología', 'Definición de roadmap, descubrimiento y entrega de producto.', 'Discovery, roadmap, métricas, agile'],
  ['QA Tester', 'Tecnología', 'Pruebas funcionales, regresión y automatización básica.', 'Testing, casos de prueba, Postman, Cypress'],
  ['DevOps', 'Tecnología', 'CI/CD, observabilidad e infraestructura como código.', 'Docker, Kubernetes, Terraform, CI/CD'],
  ['Data Engineer', 'Tecnología', 'Diseño e implementación de pipelines de datos.', 'Python, SQL, Airflow, BigQuery/Snowflake'],
  ['Customer Success', 'Comercial', 'Acompañamiento a clientes activos, retención y upsell.', 'Comunicación, CRM, gestión de cuentas'],
  ['Asistente de Marketing', 'Marketing', 'Apoyo a campañas, contenido y métricas.', 'Marketing digital, redacción, Canva'],
  ['Generalista RRHH', 'RRHH', 'Reclutamiento, bienestar y administración de personal.', 'Reclutamiento, bienestar, comunicación'],
  ['Tesorero', 'Finanzas', 'Gestión de pagos, conciliaciones bancarias y caja.', 'Bancos, pagos, Excel, ERP'],
];

function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function variantes(base) {
  const out = [];
  const niveles = ['Junior', 'Semi Senior', 'Senior'];
  for (const n of niveles) {
    out.push({ ...base, titulo: `${base.titulo} ${n}` });
  }
  // Versión sin nivel para diversidad
  out.push(base);
  return out;
}

async function ensureAdmin() {
  const row = await queryOne(`SELECT id FROM users WHERE role IN ('super_admin','rrhh') ORDER BY created_at LIMIT 1`);
  return row?.id || null;
}

async function main() {
  const adminId = await ensureAdmin();
  const todas = PLANTILLAS.flatMap(([titulo, departamento, descripcion, requisitos]) =>
    variantes({ titulo, departamento, descripcion, requisitos }),
  );
  // Mezcla y limita ~80
  todas.sort(() => Math.random() - 0.5);
  const objetivo = todas.slice(0, 80);

  let creadas = 0;
  for (const v of objetivo) {
    const exists = await queryOne('SELECT id FROM vacantes WHERE titulo = ? LIMIT 1', [v.titulo]);
    if (exists) continue;

    const modalidad = rand(MODALIDADES);
    const contrato = rand(CONTRATOS);
    const ciudad = modalidad === 'remoto' ? 'Remoto (LATAM)' : rand(CIUDADES);
    const salarioMin = (1500000 + Math.floor(Math.random() * 4000000));
    const salarioMax = salarioMin + 500000 + Math.floor(Math.random() * 5000000);
    const cupos = 1 + Math.floor(Math.random() * 3);

    await query(
      `INSERT INTO vacantes
        (id, titulo, descripcion, departamento, ubicacion, modalidad, tipo_contrato,
         salario_min, salario_max, moneda, requisitos, beneficios,
         vacantes_disponibles, estado, publicada, fecha_publicacion, created_by_id)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        uuid(), v.titulo, v.descripcion, v.departamento, ciudad, modalidad, contrato,
        salarioMin, salarioMax, 'COP', v.requisitos,
        'Plan de salud, formación continua, día libre por cumpleaños.',
        cupos, 'abierta', 1, new Date(), adminId,
      ],
    );
    creadas++;
  }
  console.log(`✅ Vacantes de demostración creadas: ${creadas}`);
}

main()
  .catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(() => pool.end());
