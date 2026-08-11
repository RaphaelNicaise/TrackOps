---
name: revision-logica
description: Auditoría lógi+ca de una funcionalidad del marketplace de repuestos — analizar cómo se comporta REALMENTE un flujo (publicaciones, búsqueda, carrito, checkout, pagos, estados del pedido, envíos, devoluciones, reseñas, cobranzas) desde la perspectiva de cada actor (comprador, comercio, administrador), cuestionar lo que no cierra y proponer mejoras priorizadas ANTES de tocar código. Usar cuando el usuario pide "analizá la lógica", "qué mejorarías", "razoná si esto debería funcionar distinto", "cuestioná esto", o antes de dar por buena una feature. NO es para implementar: es para pensar y proponer.
---

# Revisión Lógica (cuestionar y proponer)

Esta skill captura la forma de razonar que al usuario le sirve: en vez de aceptar
que algo "funciona porque compila y los tests pasan", **cuestionar si la lógica es
la correcta** y proponer cómo funcionaría mejor — desde la mirada de quien usa el
sistema, no de quien lo escribió.

> Regla de oro: **primero pensar y proponer, después implementar.** Esta skill
> termina en una lista de sugerencias priorizadas y una pregunta al usuario sobre
> cuáles aplicar. No se escribe código hasta que el usuario elige.

## Cuándo usarla

- El usuario pide analizar/razonar/cuestionar una funcionalidad.
- Terminaste de implementar algo y querés validar que la lógica cierre (no solo que compile).
- Aparece un comportamiento que "técnicamente anda" pero se siente raro.
- Antes de dar por cerrada una feature de cara al usuario final.

## El método (5 pasos)

### 0. Partir de lo ya definido
Antes de razonar desde cero, leer lo que ya está decidido en los .md definidos del proyecto
Muchas reglas ya tienen su razón escrita, y varias son fáciles de violar sin darse
cuenta (un pedido = un comercio, el vendedor cobra al entregar, nada se publica sin
aprobación, plazos en días hábiles). Si la implementación contradice el documento,
eso ya es un hallazgo.

### 1. Entender el flujo REAL, no el ideal
Leé el código que gobierna el comportamiento (servicios, rutas, base de datos,
pantallas) y reconstruí qué pasa de verdad, paso a paso. No te quedes con el nombre
de la función ni con el comentario: seguí los datos.
- ¿Qué estados existen y cómo se transiciona entre ellos?
- ¿Qué se le muestra a cada actor y qué se le oculta?
- ¿Qué pasa en los bordes? Stock 1 en piezas de desarmadero, dos compradores a la vez,
  reserva vencida, pago a medio confirmar, comercio pausado o suspendido, publicación
  rechazada, envío a una zona sin cobertura, fin de semana y feriados en los plazos,
  catálogo de 50.000 ítems, búsqueda sin resultados, doble clic en comprar.

### 2. Mirar desde CADA actor
La misma feature se vive distinto según quién esté del otro lado. Recorré, una por una:
- **Comprador:** ¿entiende qué está comprando, si le sirve para su auto, cuándo le
  llega, cuánto paga de envío? ¿Sabe qué hacer si algo sale mal?
- **Comercio:** ¿puede operar rápido? ¿Se entera a tiempo de una venta? ¿Puede
  corregir un error? ¿Le falta información para preparar el pedido? ¿Entiende por qué
  le rechazaron una publicación o por qué todavía no cobró?
- **Administrador:** ¿puede resolver un conflicto con lo que ve? ¿El trabajo manual que
  implica esta feature es sostenible con muchos comercios?

La mayoría de los huecos aparecen en la asimetría: algo que un actor ve y otro no,
o que uno puede hacer y otro necesita pero no puede.

### 3. Cuestionar con "¿por qué así y no asá?"
Para cada decisión de diseño, preguntá:
- ¿Esto es **intencional** o es un efecto colateral de cómo se implementó?
- ¿El comportamiento **coincide con la expectativa** del actor, o lo sorprende?
- ¿Hay un **corte arbitrario** (un límite, un plazo, un filtro) que no representa la
  intención real del negocio?
- ¿Mostramos un dato que **no significa nada** en ese contexto?
- ¿Hay una acción que **no se puede deshacer** y debería?
- ¿Un aviso **no llega a quien debería** o **no lleva a ningún lado**?
- ¿Queda **plata sin resolver**? Es el rubro más sensible: reembolsos, comisiones,
  liberaciones, deudas en cuenta corriente.
- ¿Un comercio puede **perjudicar a otro**, o esquivar la comisión?

### 4. Separar lo que está bien de lo que conviene cambiar
Sé honesto en las dos direcciones:
- Listá explícitamente **lo que SÍ cierra** (para no re-tocar lo que funciona y para
  dejar registro de que se revisó).
- Para lo que no cierra, distinguí **bug lógico** (está mal) de **mejora de diseño**
  (funciona, pero hay una forma mejor) y de **decisión del usuario** (depende de su
  criterio de negocio — ahí no decidas vos, preguntá).

### 5. Presentar priorizado y pedir decisión
Entregá las sugerencias ordenadas por impacto, cada una con:
- **Qué no cierra** (el síntoma concreto, desde qué actor se nota).
- **Por qué** (el razonamiento).
- **Cómo funcionaría mejor** (la propuesta, sin sobre-diseñar).
- Una marca: 🔴 conviene corregir / 🟡 es de criterio (tu decisión).

Cerrá con una recomendación de por dónde empezar y **una pregunta**: ¿cuáles aplico?
No arranques a implementar hasta tener la respuesta.

## Formato de salida sugerido

```
## 🔴 Las que conviene corregir
**1. <título corto>.** <síntoma desde el actor>. <por qué>. <propuesta>.
**2. ...**

## 🟡 De criterio (te las planteo)
**4. ...** <opciones + tradeoff, sin decidir por el usuario>

## ✅ Lo que quedó coherente
<lista breve de lo revisado que sí cierra>

Mi prioridad sería empezar por X e Y. ¿Cuáles querés que aplique?
```

## Principios

- **Cuestionar el "porqué", no solo el "cómo".** Que compile no es que esté bien pensado.
- **El usuario final manda.** La lógica se evalúa contra la expectativa de comprador,
  comercio y administrador, no contra la elegancia del código.
- **Honestidad en ambas direcciones.** Decí qué está bien y qué no; no infles problemas
  ni escondas huecos.
- **No decidir por el usuario en lo que es criterio de negocio.** Distinguir bug de
  preferencia y preguntar.
- **YAGNI en las propuestas.** Proponé la mejora mínima que resuelve, no un rediseño.
- **Pensar antes de tocar.** Esta skill produce un análisis y una decisión, no un diff.
- **Si el hallazgo es de definición y no de código**, actualizar `idea de proyecto.md`
  (o sus pendientes), no resolverlo por las nuestras dentro del código.

## Después de la revisión

Cuando el usuario elige qué aplicar, pasá al flujo de implementación de **superpowers**:
`superpowers:brainstorming` (si hace falta explorar el diseño) → `superpowers:writing-plans`
→ `superpowers:subagent-driven-development` o `superpowers:executing-plans`. El TDD y el
trabajo en paralelo los maneja superpowers internamente.

Cerrá con la skill `pre-finish`. Los textos de cara al usuario van en **español
rioplatense (voseo)**.