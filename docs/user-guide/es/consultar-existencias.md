# Consultar existencias

Esta página explica cómo consultar sus existencias de café: elegir un país y un
almacén, leer la lista FIFO de lotes y abrir un lote.

## 1. Elegir un país y un almacén

Utilice el filtro de país en la parte superior de la aplicación para elegir
**Brasil**, **Ecuador** o **Colombia**. Después puede acotar a un único **almacén**
dentro de ese país. La pantalla **Almacenes** muestra cada almacén del país
seleccionado con su última temperatura y humedad medidas, de modo que pueda ver de
un vistazo qué sitios están sanos y cuáles están desviándose.

## 2. Leer la lista FIFO de lotes

Abra la pantalla **Lotes** para ver todos los lotes de café. Los lotes siempre se
ordenan por **FIFO — First In, First Out (primero en entrar, primero en salir)**, lo
que significa que el **lote más antiguo en almacenamiento aparece primero**. Este es
el orden en que el café debería salir normalmente del almacén, así que la parte
superior de la lista es lo que necesita su atención en primer lugar.

Para cada lote, la lista muestra:

- un identificador del lote;
- el almacén y el país donde está almacenado;
- la **fecha de almacenamiento** y cuántos **días** lleva en existencias;
- un indicador de **estado** (véase más abajo).

### Comprender el estado de un lote

| Estado | Significado |
|---|---|
| **OK / sano** | Las condiciones están dentro de la banda ideal y el lote no es demasiado antiguo. |
| **Fuera de rango** | La temperatura o la humedad está fuera de la banda de tolerancia del país. |
| **Demasiado antiguo** | El lote lleva almacenado más de 365 días. |

Puede filtrar la lista por país, por almacén y por estado para centrarse, por
ejemplo, únicamente en los lotes que requieren acción.

## 3. Abrir un lote

Haga clic en un lote de la lista para abrir su **página de detalle**. Allí
encontrará:

- la información clave del lote (almacén, país, fecha de almacenamiento, antigüedad);
- sus **curvas de temperatura y humedad** a lo largo del tiempo;
- la banda ideal del país, dibujada sobre el gráfico.

La lectura de estas curvas se trata en [Leer los gráficos](leer-graficos.md).

## Próximos pasos

- Comprenda las curvas en [Leer los gráficos](leer-graficos.md).
- Reaccione ante los problemas en [Comprender las alertas](alertas.md).
