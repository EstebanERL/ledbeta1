-- ============================================================
-- TalentForge — Flujo controlado + biblioteca de tests por defecto
-- Idempotente.
-- ============================================================

-- 1) Ampliar enum de estados para incluir test_completado
ALTER TABLE postulaciones
  MODIFY estado ENUM(
    'enviada','en_revision','evaluacion','test_asignado','test_completado',
    'entrevista','entrevista_pendiente','entrevista_realizada',
    'aprobado','rechazada','contratada'
  ) NOT NULL DEFAULT 'enviada';

-- 2) Columna is_active en tests para poder desactivar de la biblioteca
ALTER TABLE tests ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1;

-- 3) Categoría descriptiva para tests
ALTER TABLE tests ADD COLUMN categoria VARCHAR(80) NULL;

-- 4) Biblioteca por defecto (UUID fijos, INSERT IGNORE = idempotente por PK)
-- PSICOLÓGICOS
INSERT IGNORE INTO tests (id, titulo, descripcion, tipo, categoria, preguntas, is_active) VALUES
('11111111-0000-0000-0000-000000000001','Personalidad laboral','Identifica rasgos de personalidad aplicados al entorno de trabajo.','psicologico','Personalidad',
 JSON_ARRAY(
   JSON_OBJECT('id','p1','enunciado','Prefiero trabajar de forma autónoma sin supervisión constante.','tipo','single','puntaje',1,'opciones',JSON_ARRAY(
     JSON_OBJECT('id','a','texto','Totalmente en desacuerdo'),JSON_OBJECT('id','b','texto','En desacuerdo'),
     JSON_OBJECT('id','c','texto','Neutral'),JSON_OBJECT('id','d','texto','De acuerdo'),JSON_OBJECT('id','e','texto','Totalmente de acuerdo'))),
   JSON_OBJECT('id','p2','enunciado','Me motiva resolver problemas complejos y poco estructurados.','tipo','single','puntaje',1,'opciones',JSON_ARRAY(
     JSON_OBJECT('id','a','texto','Totalmente en desacuerdo'),JSON_OBJECT('id','b','texto','En desacuerdo'),
     JSON_OBJECT('id','c','texto','Neutral'),JSON_OBJECT('id','d','texto','De acuerdo'),JSON_OBJECT('id','e','texto','Totalmente de acuerdo'))),
   JSON_OBJECT('id','p3','enunciado','Disfruto coordinar el trabajo de otros para alcanzar una meta.','tipo','single','puntaje',1,'opciones',JSON_ARRAY(
     JSON_OBJECT('id','a','texto','Totalmente en desacuerdo'),JSON_OBJECT('id','b','texto','En desacuerdo'),
     JSON_OBJECT('id','c','texto','Neutral'),JSON_OBJECT('id','d','texto','De acuerdo'),JSON_OBJECT('id','e','texto','Totalmente de acuerdo')))
 ),1),
('11111111-0000-0000-0000-000000000002','Inteligencia emocional','Evalúa autoconocimiento, autorregulación y empatía.','psicologico','Inteligencia emocional',
 JSON_ARRAY(
   JSON_OBJECT('id','e1','enunciado','Reconozco mis emociones en el momento en que aparecen.','tipo','single','puntaje',1,'opciones',JSON_ARRAY(
     JSON_OBJECT('id','a','texto','Casi nunca'),JSON_OBJECT('id','b','texto','A veces'),JSON_OBJECT('id','c','texto','Frecuentemente'),JSON_OBJECT('id','d','texto','Casi siempre'))),
   JSON_OBJECT('id','e2','enunciado','Mantengo la calma ante una crítica negativa.','tipo','single','puntaje',1,'opciones',JSON_ARRAY(
     JSON_OBJECT('id','a','texto','Casi nunca'),JSON_OBJECT('id','b','texto','A veces'),JSON_OBJECT('id','c','texto','Frecuentemente'),JSON_OBJECT('id','d','texto','Casi siempre'))),
   JSON_OBJECT('id','e3','enunciado','Soy capaz de identificar cómo se siente un compañero por su lenguaje no verbal.','tipo','single','puntaje',1,'opciones',JSON_ARRAY(
     JSON_OBJECT('id','a','texto','Casi nunca'),JSON_OBJECT('id','b','texto','A veces'),JSON_OBJECT('id','c','texto','Frecuentemente'),JSON_OBJECT('id','d','texto','Casi siempre')))
 ),1),
('11111111-0000-0000-0000-000000000003','Trabajo en equipo','Evalúa colaboración, escucha y compromiso colectivo.','psicologico','Trabajo en equipo',
 JSON_ARRAY(
   JSON_OBJECT('id','t1','enunciado','Comparto información y conocimiento con mi equipo sin que me lo pidan.','tipo','single','puntaje',1,'opciones',JSON_ARRAY(
     JSON_OBJECT('id','a','texto','Nunca'),JSON_OBJECT('id','b','texto','A veces'),JSON_OBJECT('id','c','texto','Siempre'))),
   JSON_OBJECT('id','t2','enunciado','Cuando hay un conflicto en el equipo, busco una solución colaborativa.','tipo','single','puntaje',1,'opciones',JSON_ARRAY(
     JSON_OBJECT('id','a','texto','Nunca'),JSON_OBJECT('id','b','texto','A veces'),JSON_OBJECT('id','c','texto','Siempre')))
 ),1),
('11111111-0000-0000-0000-000000000004','Liderazgo','Mide capacidad de influenciar, motivar y guiar.','psicologico','Liderazgo',
 JSON_ARRAY(
   JSON_OBJECT('id','l1','enunciado','Cuando lidero un proyecto, defino objetivos claros y medibles.','tipo','single','puntaje',1,'opciones',JSON_ARRAY(
     JSON_OBJECT('id','a','texto','Nunca'),JSON_OBJECT('id','b','texto','A veces'),JSON_OBJECT('id','c','texto','Siempre'))),
   JSON_OBJECT('id','l2','enunciado','Doy retroalimentación constructiva a las personas a mi cargo.','tipo','single','puntaje',1,'opciones',JSON_ARRAY(
     JSON_OBJECT('id','a','texto','Nunca'),JSON_OBJECT('id','b','texto','A veces'),JSON_OBJECT('id','c','texto','Siempre')))
 ),1),
('11111111-0000-0000-0000-000000000005','Adaptabilidad','Capacidad de ajustarse a nuevos contextos.','psicologico','Adaptabilidad',
 JSON_ARRAY(
   JSON_OBJECT('id','ad1','enunciado','Frente a un cambio inesperado, busco oportunidades de mejora.','tipo','single','puntaje',1,'opciones',JSON_ARRAY(
     JSON_OBJECT('id','a','texto','Casi nunca'),JSON_OBJECT('id','b','texto','A veces'),JSON_OBJECT('id','c','texto','Frecuentemente'),JSON_OBJECT('id','d','texto','Siempre'))),
   JSON_OBJECT('id','ad2','enunciado','Aprendo nuevas herramientas con rapidez cuando el rol lo exige.','tipo','single','puntaje',1,'opciones',JSON_ARRAY(
     JSON_OBJECT('id','a','texto','Casi nunca'),JSON_OBJECT('id','b','texto','A veces'),JSON_OBJECT('id','c','texto','Frecuentemente'),JSON_OBJECT('id','d','texto','Siempre')))
 ),1),
('11111111-0000-0000-0000-000000000006','Resolución de conflictos','Estilo y eficacia ante situaciones tensas.','psicologico','Resolución de conflictos',
 JSON_ARRAY(
   JSON_OBJECT('id','rc1','enunciado','Cuando dos compañeros discuten, escucho a ambas partes antes de actuar.','tipo','single','puntaje',1,'opciones',JSON_ARRAY(
     JSON_OBJECT('id','a','texto','Nunca'),JSON_OBJECT('id','b','texto','A veces'),JSON_OBJECT('id','c','texto','Siempre')))
 ),1);

-- TÉCNICOS (con respuesta correcta marcada en `correcta`)
INSERT IGNORE INTO tests (id, titulo, descripcion, tipo, categoria, preguntas, is_active) VALUES
('22222222-0000-0000-0000-000000000001','Fundamentos de programación','Conceptos básicos transferibles a cualquier lenguaje.','tecnico','Programación',
 JSON_ARRAY(
   JSON_OBJECT('id','c1','enunciado','¿Qué estructura de control se usa para repetir una acción mientras una condición sea verdadera?','tipo','single','puntaje',1,'opciones',JSON_ARRAY(
     JSON_OBJECT('id','a','texto','if','correcta',false),
     JSON_OBJECT('id','b','texto','while','correcta',true),
     JSON_OBJECT('id','c','texto','switch','correcta',false),
     JSON_OBJECT('id','d','texto','return','correcta',false))),
   JSON_OBJECT('id','c2','enunciado','¿Qué representa la complejidad O(n)?','tipo','single','puntaje',1,'opciones',JSON_ARRAY(
     JSON_OBJECT('id','a','texto','Tiempo constante','correcta',false),
     JSON_OBJECT('id','b','texto','Tiempo lineal','correcta',true),
     JSON_OBJECT('id','c','texto','Tiempo cuadrático','correcta',false),
     JSON_OBJECT('id','d','texto','Tiempo logarítmico','correcta',false)))
 ),1),
('22222222-0000-0000-0000-000000000002','Excel intermedio','Fórmulas y funciones de uso común.','tecnico','Excel',
 JSON_ARRAY(
   JSON_OBJECT('id','x1','enunciado','¿Qué función busca un valor en la primera columna y devuelve un valor en la misma fila?','tipo','single','puntaje',1,'opciones',JSON_ARRAY(
     JSON_OBJECT('id','a','texto','SI','correcta',false),
     JSON_OBJECT('id','b','texto','BUSCARV','correcta',true),
     JSON_OBJECT('id','c','texto','SUMAR.SI','correcta',false),
     JSON_OBJECT('id','d','texto','CONCAT','correcta',false))),
   JSON_OBJECT('id','x2','enunciado','¿Qué tecla bloquea una referencia en una fórmula?','tipo','single','puntaje',1,'opciones',JSON_ARRAY(
     JSON_OBJECT('id','a','texto','F2','correcta',false),
     JSON_OBJECT('id','b','texto','F4','correcta',true),
     JSON_OBJECT('id','c','texto','F9','correcta',false)))
 ),1),
('22222222-0000-0000-0000-000000000003','Servicio al cliente','Buenas prácticas en atención al cliente.','tecnico','Servicio al cliente',
 JSON_ARRAY(
   JSON_OBJECT('id','s1','enunciado','¿Cuál es la mejor respuesta ante un cliente molesto?','tipo','single','puntaje',1,'opciones',JSON_ARRAY(
     JSON_OBJECT('id','a','texto','Pedirle que se calme antes de hablar','correcta',false),
     JSON_OBJECT('id','b','texto','Escuchar activamente y validar su molestia','correcta',true),
     JSON_OBJECT('id','c','texto','Derivarlo a otro agente','correcta',false)))
 ),1),
('22222222-0000-0000-0000-000000000004','Ventas — fundamentos','Etapas y técnicas del proceso comercial.','tecnico','Ventas',
 JSON_ARRAY(
   JSON_OBJECT('id','v1','enunciado','¿Qué etapa del embudo está dedicada a generar interés inicial?','tipo','single','puntaje',1,'opciones',JSON_ARRAY(
     JSON_OBJECT('id','a','texto','Cierre','correcta',false),
     JSON_OBJECT('id','b','texto','Prospección','correcta',true),
     JSON_OBJECT('id','c','texto','Postventa','correcta',false)))
 ),1),
('22222222-0000-0000-0000-000000000005','Logística básica','Conceptos clave de cadena de suministro.','tecnico','Logística',
 JSON_ARRAY(
   JSON_OBJECT('id','lg1','enunciado','¿Qué significa SKU?','tipo','single','puntaje',1,'opciones',JSON_ARRAY(
     JSON_OBJECT('id','a','texto','Stock Keeping Unit','correcta',true),
     JSON_OBJECT('id','b','texto','Standard Key Unit','correcta',false),
     JSON_OBJECT('id','c','texto','Service Kit Unit','correcta',false)))
 ),1),
('22222222-0000-0000-0000-000000000006','Contabilidad — partida doble','Conceptos básicos contables.','tecnico','Contabilidad',
 JSON_ARRAY(
   JSON_OBJECT('id','co1','enunciado','En partida doble cada operación afecta…','tipo','single','puntaje',1,'opciones',JSON_ARRAY(
     JSON_OBJECT('id','a','texto','Una sola cuenta','correcta',false),
     JSON_OBJECT('id','b','texto','Dos o más cuentas','correcta',true),
     JSON_OBJECT('id','c','texto','Únicamente activos','correcta',false)))
 ),1),
('22222222-0000-0000-0000-000000000007','Recursos Humanos','Conceptos clave de gestión humana.','tecnico','Recursos Humanos',
 JSON_ARRAY(
   JSON_OBJECT('id','rh1','enunciado','¿Qué es un proceso de onboarding?','tipo','single','puntaje',1,'opciones',JSON_ARRAY(
     JSON_OBJECT('id','a','texto','Proceso de salida del empleado','correcta',false),
     JSON_OBJECT('id','b','texto','Integración del nuevo colaborador','correcta',true),
     JSON_OBJECT('id','c','texto','Evaluación anual de desempeño','correcta',false)))
 ),1);
