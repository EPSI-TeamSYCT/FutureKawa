# 🔄 Gestión del cambio — supervisar el café verde en tres países

> 🌐 **Idiomas:** [English](../en/change-management.md) · [Français](../fr/conduite-du-changement.md) · [Português](../pt/gestao-da-mudanca.md) · **Español**

Este plan describe cómo FutureKawa pasa de un seguimiento de almacenamiento
**semimanual y difícil de auditar** a una **plataforma supervisada y multipaís** — y,
sobre todo, **cómo los equipos de campo la adoptan**. Todo el enfoque se apoya en un
principio: el cambio ocurre **en el sitio y en el idioma local** (🇧🇷 portugués en
Brasil, 🇪🇨🇨🇴 español en Ecuador y Colombia), nunca como una orden enviada a distancia
desde la sede.

Este documento complementa la [guía de usuario](../../user-guide/es/index.md) (cómo usar
la aplicación) y el [esquema de automatización de la fase 2](../../phase2/automation-schema.md)
(hacia dónde va este cambio).

## Índice

- [🎯 Contexto & objetivo del cambio](#-contexto--objetivo-del-cambio)
- [👥 Partes interesadas & impacto](#-partes-interesadas--impacto)
- [🧭 Enfoque de adopción — los tres pilares](#-enfoque-de-adopción--los-tres-pilares)
- [🗺️ Despliegue por fases](#-despliegue-por-fases)
- [🎓 Plan de formación](#-plan-de-formación)
- [📣 Plan de comunicación](#-plan-de-comunicación)
- [🧱 Gestión de resistencias](#-gestión-de-resistencias)
- [🛟 Modelo de soporte](#-modelo-de-soporte)
- [📊 Indicadores de éxito (KPIs)](#-indicadores-de-éxito-kpis)
- [🔮 Vínculo con la fase 2](#-vínculo-con-la-fase-2)
- [🔗 Documentos relacionados](#-documentos-relacionados)

## 🎯 Contexto & objetivo del cambio

Hoy, las condiciones de almacenamiento del café verde se siguen de forma
**semimanual**: lecturas anotadas a mano o en hojas de cálculo dispersas, rotación
**FIFO** aplicada de memoria y ninguna traza de auditoría fiable cuando un cliente pide
**prueba de trazabilidad**. Cuando la temperatura o la humedad se desvía, nadie se
entera antes de que los granos ya hayan perdido aroma o hayan sido degradados — la
pérdida se constata **después** del daño.

El cambio introduce una **plataforma supervisada** única: los sensores publican
temperatura/humedad automáticamente, los lotes se siguen del más antiguo al más
reciente, las **alertas** se disparan en cuanto las condiciones salen de la franja
ideal, y la sede consolida los tres países en una vista única — manteniendo **cada país
dueño de sus datos** (soberanía).

| | Antes — semimanual | Después — plataforma supervisada |
|---|---|---|
| 🌡️ Condiciones | Leídas a mano, de forma intermitente | Medidas automáticamente, de forma continua |
| 🔁 Rotación FIFO | De memoria, propensa a errores | Lista del más antiguo, siempre visible |
| 🚨 Desviación | Notada tras el daño | Alerta en el instante en que ocurre |
| 🧾 Trazabilidad | Difícil de reconstruir | Historial registrado por lote |
| 🌍 Vista multipaís | Ninguna | Consolidada en la sede, los datos quedan locales |

> 💡 **Por qué importa a los equipos de campo.** No se trata de "más pantallas que
> rellenar". Elimina la toma de notas manual, sustituye la suposición en la rotación por
> una lista clara y hace que un jefe de almacén sea **avisado a tiempo** para salvar un
> lote, en vez de explicar una pérdida después. El objetivo de la gestión del cambio es
> **hacer sentir** ese beneficio, no solo anunciarlo.

![Vista de detalle del almacén con la curva de temperatura/humedad del lote saliendo de la franja verde](../../schemas/screenshot-warehouse-detail.png)

## 👥 Partes interesadas & impacto

Todas las personas afectadas por la plataforma, qué cambia para ellas y el beneficio
concreto que gana su adhesión. Los niveles de soporte **N1** (corresponsal de SI local) y
**N2** (infra/DevOps) se describen en el [modelo de soporte](#-modelo-de-soporte).

| Rol | 🔧 Impacto (qué cambia) | 🎁 Beneficio (qué ganan) |
|---|---|---|
| 🏭 **Jefe de explotación (finca)** | Recibe alertas de almacenamiento por correo; actúa sobre la desviación y la antigüedad de los lotes. | Menos pérdidas; reacciona a tiempo en vez de explicar daños. |
| 📦 **Jefe de almacén** | Usa la lista FIFO de lotes y las curvas a diario, en vez de notas manuales. | Orden de rotación claro; condiciones visibles de un vistazo. |
| 🔬 **Jefe de calidad** | Consulta el historial registrado para certificar las condiciones de un lote. | Prueba real de trazabilidad para clientes y auditorías. |
| 🚚 **Jefe de supply-chain** | Planifica los envíos sobre datos de stock consolidados y fiables. | Menos sorpresas; envía primero los lotes correctos. |
| 🏢 **Supervisor en la sede** | Obtiene una vista multipaís única y consolidada. | Dirige tres países desde un panel; detecta tendencias. |
| 🧑‍💻 **Corresponsal de SI local (N1)** | Se convierte en el primer punto de contacto y el enlace en el sitio. | Rol local reconocido; línea directa con el N2. |
| ⚙️ **Infra / DevOps (N2)** | Opera y monitorea las stacks por país y de la sede. | Despliegues reproducibles; una stack por país, guiada por variables. |

> 📸 **[SCREENSHOT]** — Correo de alerta recibido por el jefe de explotación: almacén,
> identificador del lote, valor de temperatura/humedad fuera de franja, fecha y hora.

## 🧭 Enfoque de adopción — los tres pilares

La adopción se apoya en los tres pilares de la MSPR. Ninguno funciona solo: la
**participación** genera confianza, la **comunicación** mantiene informados a todos, la
**formación** construye la competencia — todo entregado **en el sitio, en el idioma
local**.

| Pilar | Qué significa aquí | Cómo lo entregamos |
|---|---|---|
| 🤝 **Participación** | Los equipos de campo moldean el despliegue, no solo lo reciben. | Talleres en el sitio por país; usuarios clave locales elegidos pronto; los aportes guían las correcciones. |
| 📣 **Comunicación** | Todos conocen el porqué, el cuándo y dónde pedir ayuda. | Lanzamiento en idioma local, actualizaciones periódicas, un bucle de retroalimentación bidireccional (ver abajo). |
| 🎓 **Formación** | Cada rol sabe hacer su trabajo diario en la herramienta, con confianza. | Sesiones por rol, prácticas, **en el sitio y en PT / ES**; formación de formadores. |

> 💡 Los tres pilares se **repiten en el idioma local en cada país**, por un formador
> local siempre que sea posible. Un mensaje que cala en español en un almacén ecuatoriano
> o colombiano vale más que un material perfecto en inglés.

## 🗺️ Despliegue por fases

**No** encendemos los tres países a la vez. Hacemos un **piloto en un país**, probamos el
valor y luego **generalizamos** a los otros dos — trasladando los aprendizajes.

| Fase | Alcance | Enfoque | Salida → fase siguiente |
|---|---|---|---|
| 0️⃣ **Preparar** | Sede + país piloto | Stacks desplegadas, usuarios clave nombrados, materiales traducidos. | Entorno listo, formadores listos. |
| 1️⃣ **Pilotar** | 🇧🇷 Brasil (1–2 almacenes) | Uso real sobre lotes reales; recoger fricciones; ajustar umbrales/alertas. | **Go/no-go** alcanzado (abajo). |
| 2️⃣ **Generalizar** | 🇪🇨 Ecuador + 🇨🇴 Colombia | Repetir el guion probado, en ES, en el sitio. | Mismo go/no-go por país. |
| 3️⃣ **Operar & mejorar** | Los 3 países | Soporte de régimen, revisión de KPIs, preparación fase 2. | KPIs estables; entrevista de la fase 2 iniciada. |

Brasil es el piloto natural: mayor operación y referencia para los umbrales de
almacenamiento. Añadir un país es **repetir la misma stack**, configurada solo por
variables de entorno — ver [ejecutar la stack](../../deployment/running-the-stack.md).

### ✅ Criterios go / no-go

Antes de generalizar más allá del piloto, **todos** estos criterios deben cumplirse:

| Criterio | 🎯 Meta |
|---|---|
| 📈 Adopción | Los usuarios clave inician sesión y usan la lista FIFO **cada día** durante 2 semanas. |
| 🚨 Alertas creíbles | Las alertas generan acción, y las **falsas alertas** quedan bajo una tasa baja acordada. |
| 📥 Completitud de datos | Llegan mediciones de cada almacén piloto, con pocos huecos. |
| 🧑‍🏫 Capacidad local | Al menos **un formador local capacitado** por sitio piloto. |
| 😀 Satisfacción | Los usuarios piloto reportan que la herramienta **ahorra tiempo** vs. el modo manual. |

> ⚠️ Un **no-go** no es un fracaso: pausa la generalización hasta que el criterio
> bloqueante se corrija (p. ej. demasiadas falsas alertas → reajustar las tolerancias
> antes del despliegue).

## 🎓 Plan de formación

La formación es **en el sitio y en el idioma local** — es el corazón del plan. Ningún rol
se forma con un seminario web genérico en inglés; un formador está **en el almacén**,
hablando **portugués en Brasil** y **español en Ecuador y Colombia**.

### Sesiones por rol

| Rol | Idioma | Formato | Cubre |
|---|---|---|---|
| 🏭 Jefe de explotación | PT / ES | En el sitio, ~½ día | Leer alertas, actuar sobre desviación & antigüedad de lotes, escalado. |
| 📦 Jefe de almacén | PT / ES | En el sitio, práctico | Lista FIFO, abrir un lote, leer las curvas a diario. |
| 🔬 Jefe de calidad | PT / ES | En el sitio, ~½ día | Historial & trazabilidad, exportar prueba para clientes. |
| 🚚 Jefe de supply-chain | PT / ES | En el sitio / remoto | Vista de stock consolidada, planificar sobre datos fiables. |
| 🏢 Supervisor en la sede | EN / local | Remoto + en el sitio | Panel multipaís, tendencias entre países. |
| 🧑‍💻 Corresponsal N1 | Local | Profundo, en el sitio | Todo lo anterior + resolución de 1ª línea + cuándo escalar al N2. |

### Materiales & formación de formadores

| Elemento | Idioma | Notas |
|---|---|---|
| 🧑‍🏫 **Formación de formadores** | PT / ES | La sede forma primero a los formadores locales; ellos enseñan luego en el país. |
| 📘 **Guía de inicio rápido** | PT / ES | Breve, guiada por capturas; refleja la [guía de usuario](../../user-guide/es/index.md). |
| 🎬 **Tutoriales grabados en pantalla** | PT / ES | Lista FIFO, lectura de una curva, reacción a una alerta. |
| 🃏 **Hoja de referencia de una página** | PT / ES | Fijada en el almacén; umbrales + "qué hacer ante una alerta". |
| ❓ **FAQ** | PT / ES | Espejo local de la [FAQ](../../user-guide/es/preguntas-frecuentes.md) de la guía. |

> 💡 La **formación de formadores** es lo que permite escalar la formación en el sitio y
> en idioma local a los tres países: la sede forma a un puñado de formadores locales, y
> **son ellos** quienes dan las sesiones en el almacén en PT / ES — el conocimiento queda
> local, y el soporte también.

> 📸 **[SCREENSHOT]** — Página de portada de la guía de inicio rápido, localizada al
> español, mostrando la lista FIFO de lotes de un almacén ecuatoriano o colombiano.

## 📣 Plan de comunicación

Claro, repetido, **bidireccional** y siempre disponible en el idioma local.

| Canal | Público | Cadencia | Objetivo |
|---|---|---|---|
| 🚀 **Reunión de lanzamiento (en el sitio)** | Todos los roles por país | Una vez, al inicio de fase | Explicar el porqué, el plan y a quién pedir ayuda. |
| 🗞️ **Actualización de avance** | Todas las partes interesadas | Semanal durante el despliegue | Qué se entregó, qué sigue, logros del piloto. |
| 🧑‍🤝‍🧑 **Check-in local** | Almacén + N1 | Diario durante el piloto | Sacar fricciones rápido; nada espera una semana. |
| 📧 **Correos de alerta** | Jefes de explotación | Por evento | La señal operativa en sí (desviación / antigüedad del lote). |
| 🗣️ **Canal de retroalimentación** | Todos | Siempre abierto | Recoger problemas & ideas; cerrar el ciclo. |

### 🔑 Mensajes clave

- **"Salva tus lotes."** La plataforma avisa **a tiempo** para actuar, no después.
- **"Tus datos quedan en tu país."** La sede consolida una vista; nunca se lleva tu base.
- **"Sustituye las notas manuales"**, no añade papeleo encima.
- **"La ayuda es local."** Tu primer contacto es tu corresponsal N1 en el sitio.

### 🔁 Bucle de retroalimentación

Cada objeción, error o idea va al **corresponsal N1** local, se tría con el **N2** si es
técnica, y el resultado se **devuelve** a la persona que lo planteó. Un seguimiento
visible es lo que convierte la comunicación en confianza.

## 🧱 Gestión de resistencias

Las objeciones son esperables y legítimas. Las nombramos y las respondemos **antes** de
que se endurezcan — en el idioma local, en el sitio.

| 🗣️ Objeción esperada | ✅ Cómo la respondemos |
|---|---|
| "El modo manual funcionaba bien." | Mostrar lado a lado: una alerta que atrapa una desviación que el manual habría pasado por alto. |
| "Es trabajo extra sobre lo mío." | Demostrar que **elimina** las notas manuales; el gesto diario es una mirada, no teclear datos. |
| "Demasiadas/falsas alertas, las ignoraré." | Ajustar las tolerancias en el piloto; una baja tasa de falsas alertas es criterio **go/no-go**. |
| "No confío en los números del sensor." | Contrastar las lecturas en el sitio durante la formación; explicar la franja ideal & la tolerancia. |
| "En inglés no lo entiendo todo." | **Todo** se entrega en PT / ES, en el sitio, por un formador local. |
| "¿La sede nos vigila / toma nuestros datos?" | Explicar la soberanía: el país es dueño de su base; la sede solo consulta una vista consolidada. |
| "¿A quién llamo cuando se rompe?" | Un corresponsal **N1 local** nombrado, con el N2 detrás — impreso en la hoja de referencia. |

> 💡 El antídoto más fuerte contra la resistencia es un **campeón local**: un colega de
> almacén respetado, formado primero, que responde en el idioma local y prueba la
> herramienta sobre los propios lotes del equipo.

## 🛟 Modelo de soporte

Dos niveles, alineados con el contexto del cliente — **lo local primero**, la infra
detrás.

| Nivel | Quién | Alcance | Recurre a |
|---|---|---|---|
| 🧑‍💻 **N1 — corresponsal de SI local** | En el sitio, por país, habla el idioma local | Primer contacto: dudas de uso, "¿esta alerta es real?", comprobaciones básicas, triaje. | Escala problemas de infra/plataforma al N2. |
| ⚙️ **N2 — infra / DevOps** | Central, entre países | Plataforma: stacks, broker, APIs, despliegues, incidentes, flujo de datos. | Dueño del [sistema distribuido](../../architecture/distributed-system.md) & de los despliegues. |

```
Usuario de campo ──▶ N1 (local, en el sitio, PT/ES) ──▶ N2 (infra / DevOps, central)
   ▲                       │                                │
   └──────— respuesta ◀─────┴──— corrección de plataforma ◀──┘
```

> 💡 La mayoría de las dudas del día a día son dudas de **uso** y se detienen en el
> **N1** — en el idioma local, en el sitio. Solo las averías reales de plataforma suben
> al N2. Así el soporte se mantiene rápido, local y comprensible.

## 📊 Indicadores de éxito (KPIs)

Cómo sabemos que el cambio realmente caló — revisados por país y en la sede.

| KPI | 📐 Qué mide | 🎯 Dirección |
|---|---|---|
| 📈 **Tasa de adopción** | Usuarios activos vs. esperados, y uso diario de la lista FIFO. | ⬆️ Hacia un uso estable, casi total. |
| ⏱️ **Tiempo de respuesta a la alerta** | Tiempo desde la alerta disparada → acción tomada. | ⬇️ A la baja — reaccionar antes del daño. |
| 📉 **Reducción de pérdidas** | Lotes degradados/perdidos vs. la base manual. | ⬇️ A la baja — la ganancia central del negocio. |
| 📥 **Completitud de datos** | Parte de las mediciones esperadas efectivamente recibidas. | ⬆️ Al alza — pocos huecos por almacén. |
| 😀 **Satisfacción de usuarios** | Los equipos de campo reportan tiempo ahorrado & confianza en las alertas. | ⬆️ Al alza — adhesión duradera. |
| 🧑‍🏫 **Autonomía local** | Dudas resueltas en el N1 sin escalar. | ⬆️ Al alza — el soporte local funciona. |

> 💡 Los KPIs se revisan **con** los equipos locales, en su idioma — la revisión es, en
> sí misma, un momento de comunicación y participación, no una auditoría.

![Resumen del panel de la sede: KPIs, condiciones por almacén y últimas alertas](../../schemas/screenshot-dashboard.png)

## 🔮 Vínculo con la fase 2

La fase 1 hace que las personas **confíen en la supervisión**: aprenden a apoyarse en las
alertas, a actuar sobre la desviación y a leer las curvas. La fase 2 **cierra el bucle**
— las mismas mediciones accionan **actuadores** (calefacción, aireación, humidificación)
que mantienen cada almacén en su franja ideal **automáticamente** (ver el
[esquema de automatización](../../phase2/automation-schema.md)).

Esa automatización solo gana aceptación si la **fase humana vino primero**:

| Hábito de cambio (fase 1) | Prepara la aceptación en la fase 2 de… |
|---|---|
| Confiar en las alertas & en la franja ideal | Confiar en el controlador que actúa sobre la misma franja. |
| Reaccionar a la desviación a mano | Dejar que los actuadores reaccionen, con un **control manual** conservado. |
| Consultar el historial registrado | Revisar la traza de auditoría de los comandos automáticos. |
| Soporte N1 local + N2 central | Los mismos niveles de soporte operando el bucle de control. |

> 💡 Un equipo que ya confía en las alertas aceptará un actuador que actúa sobre esas
> mismas alertas. La gestión del cambio en la fase 1 es lo que hace que la automatización
> de la fase 2 sea **bienvenida** en vez de impuesta. Las decisiones abiertas se reúnen en
> el [cuestionario de entrevista](../../phase2/interview-questionnaire.md).

## 🔗 Documentos relacionados

- [Guía de usuario](../../user-guide/es/index.md) — cómo los equipos de campo usan la app en el día a día.
- [Fase 2 — esquema de automatización](../../phase2/automation-schema.md) — hacia dónde va este cambio.
- [Fase 2 — cuestionario de entrevista](../../phase2/interview-questionnaire.md) — decisiones aún abiertas.
- [Sistema distribuido](../../architecture/distributed-system.md) — la topología multipaís soberana.
- [Ejecutar la stack](../../deployment/running-the-stack.md) — desplegar una stack por país.
