# Cumplimiento legal — Control Horario (España)

## 1. Normativa aplicable
- **Art. 34.9 ET** y **RD-ley 8/2019**: registro diario de jornada obligatorio para todas las empresas, cualquiera su tamaño.
- **Real Decreto 1/2025** (proyecto de registro horario digital, interoperable y accesible a la Inspección en tiempo real) — la app se diseña ya compatible con exportación estructurada (CSV/JSON) para anticiparse.
- **LOPDGDD / RGPD**: tratamiento de datos de geolocalización e IP como datos personales; principio de minimización.
- **Estatuto de los Trabajadores**: límites de jornada, horas extra (máx. 80 h/año), descansos (12h entre jornadas, pausa de 15 min si jornada continua > 6h).
- **Conservación**: los registros deben conservarse 4 años y estar a disposición de trabajadores, RLT e Inspección de Trabajo.

## 2. Requisitos obligatorios y su implementación

| Requisito legal | Implementación en la app |
|---|---|
| Registro de hora de inicio y fin de jornada, diario | `ClockEvent` (CLOCK_IN/CLOCK_OUT) con timestamp servidor (no editable por el cliente) |
| Registro de pausas | `ClockEvent` tipo PAUSE_START/PAUSE_END, no se descuentan automáticamente salvo configuración |
| Inmutabilidad del registro | Eventos nunca se hacen `DELETE`; correcciones generan nuevo evento + entrada en `AuditLog` |
| Trazabilidad de modificaciones | `AuditLog`: quién, cuándo, motivo, valor anterior, valor nuevo |
| Acceso del trabajador a sus propios registros | Pantalla "Mi historial" (día/semana/mes) |
| Conservación 4 años | `CompanySettings.retentionYears = 4`, sin job de borrado automático antes de ese plazo |
| Disponibilidad para Inspección | "Modo Inspección" → informe PDF/CSV con jornadas, horas extra, ausencias, histórico de modificaciones |
| Cómputo de horas extra | Cálculo = horas trabajadas - jornada pactada (`CompanySettings.weeklyHoursTarget`); se muestran en informes |
| Identificación inequívoca del usuario | Login JWT individual; cada `ClockEvent` ligado a `employeeId` autenticado |

## 3. RGPD
- **Base legal**: cumplimiento de obligación legal (art. 6.1.c RGPD) para fichaje; consentimiento explícito y desactivable para geolocalización (es opcional por diseño).
- **Minimización**: solo se guarda IP, user-agent y dispositivo (necesarios para acreditar autenticidad del fichaje ante Inspección), no se trackean otros datos de navegación.
- **Derechos ARCO/Suprimir**: como los registros horarios son obligación legal, no son borrables a petición del interesado mientras dure el plazo de conservación (excepción del art. 17.3.b RGPD) — debe documentarse en el Registro de Actividades de Tratamiento (RAT) y en la política de privacidad.
- **Encargado de tratamiento**: si se usa hosting de terceros (cloud), formalizar contrato de encargo de tratamiento (art. 28 RGPD).
- **Seguridad**: contraseñas con bcrypt, conexiones HTTPS obligatorias en producción, backups cifrados.

## 4. Riesgos legales identificados
1. **Edición de horas sin trazabilidad** → mitigado: toda corrección pasa por `AuditLog`, nunca update directo silencioso.
2. **Ambigüedad sobre pausas no remuneradas** → la app registra el evento pero el cómputo de "tiempo de trabajo efectivo" debe configurarse según convenio (campo configurable, no asumir automáticamente).
3. **Geolocalización percibida como vigilancia excesiva** → opcional, desactivada por defecto, debe informarse en política de privacidad y, si se activa, justificar proporcionalidad (p.ej. trabajo en ruta).
4. **Acceso de terceros (proveedor cloud)** → exige Encargado de Tratamiento (DPA) firmado.
5. **No notificar cambios al trabajador** → cualquier corrección de su registro debe ser visible para el empleado en su historial (transparencia, evita litigios).

## 5. Recomendación final
La aplicación es legalmente viable como sistema de registro horario para empresas ≤15 empleados, siempre que:
- Se publique una política de privacidad específica para el control horario.
- Se mantenga el `AuditLog` sin posibilidad de borrado (a nivel de permisos de BD, el rol de la app no debe tener `DELETE` sobre `clock_events` ni `audit_logs`).
- Se configure backup automático con retención ≥ 4 años.
