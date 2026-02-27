# Sistema de Ready/Unready y Countdown

## Descripción
Sistema implementado en Nakama que permite a los jugadores indicar cuando están listos para comenzar el juego. Cuando todos los jugadores marcan ready, inicia un conteo regresivo de 5,4,3,2,1 antes de comenzar la partida. Los jugadores también pueden cancelar su estado de ready, lo que detendrá el countdown si está activo.

## Características

- ✅ Estado `ready` guardado en `state.ranking` asociado a cada usuario
- ✅ Verificación automática cuando todos los jugadores están listos
- ✅ Conteo regresivo de 5 segundos
- ✅ Broadcast de eventos de countdown a todos los jugadores
- ✅ Señal de inicio de juego cuando termina el countdown
- ✅ **Funcionalidad de unready** para cancelar el estado listo
- ✅ **Cancelación automática del countdown** si un jugador desmarca ready

## OpCodes

| Nombre | Código | Descripción |
|--------|--------|-------------|
| RANKING_OP_CODE | 2 | Actualización del ranking (incluye estado ready) |
| READY_OP_CODE | 3 | Mensaje del cliente indicando que está listo |
| COUNTDOWN_OP_CODE | 4 | Mensaje del servidor con el valor del countdown |
| GAME_START_OP_CODE | 5 | Mensaje del servidor indicando inicio del juego |
| UNREADY_OP_CODE | 6 | **NUEVO:** Mensaje del cliente indicando que NO está listo |
| COUNTDOWN_CANCELLED_OP_CODE | 7 | **NUEVO:** Mensaje del servidor indicando cancelación del countdown |

## Estructura de Datos

### PlayerScore
```typescript
interface PlayerScore {
    userId: string;
    username: string;
    score: number;
    timestamp: number;
    ready: boolean;
}
```

### Estado del Match
```typescript
{
    code: string,
    presences: {},
    ranking: PlayerScore[],
    Debug: string,
    countdownActive: boolean,
    countdownValue: number,      // 5,4,3,2,1
    gameStarted: boolean
}
```

## Uso desde el Servidor

### RPC: set_player_ready

Marca al jugador como listo para comenzar.

**Endpoint:** `set_player_ready`

**Payload:**
```json
{
    "matchId": "match-id-aqui"
}
```

**Respuesta exitosa:**
```json
{
    "success": true,
    "message": "Marcado como listo"
}
```

### RPC: set_player_unready (NUEVO)

Desmarca al jugador como listo y cancela el countdown si está activo.

**Endpoint:** `set_player_unready`

**Payload:**
```json
{
    "matchId": "match-id-aqui"
}
```

**Respuesta exitosa:**
```json
{
    "success": true,
    "message": "Desmarcado como listo"
}
```

## Uso desde Godot

### Marcar como listo

```gdscript
func mark_player_ready():
    var payload = JSON.stringify({
        "matchId": current_match_id
    })
    
    var result = await nakama_client.rpc_async(
        nakama_socket.session, 
        "set_player_ready", 
        payload
    )
    
    if result.is_exception():
        print("Error: ", result.get_exception().message)
    else:
        var response = JSON.parse_string(result.payload)
        print(response["message"])  # "Marcado como listo"
```

### Desmarcar como listo (NUEVO)

```gdscript
func mark_player_unready():
    var payload = JSON.stringify({
        "matchId": current_match_id
    })
    
    var result = await nakama_client.rpc_async(
        nakama_socket.session, 
        "set_player_unready", 
        payload
    )
    
    if result.is_exception():
        print("Error: ", result.get_exception().message)
    else:
        var response = JSON.parse_string(result.payload)
        print(response["message"])  # "Desmarcado como listo"
```

### Recibir eventos del servidor

```gdscript
func _on_match_state_received(state: NakamaRTAPI.MatchData):
    match state.op_code:
        2:  # RANKING_OP_CODE
            var ranking = JSON.parse_string(state.data)
            for player in ranking:
                print(player["username"], " ready: ", player["ready"])
            update_ui(ranking)
        
        4:  # COUNTDOWN_OP_CODE
            var data = JSON.parse_string(state.data)
            var countdown = data["countdown"]
            show_countdown(countdown)  # 5, 4, 3, 2, 1
        
        5:  # GAME_START_OP_CODE
            print("¡El juego comienza!")
            start_game()
        
        7:  # COUNTDOWN_CANCELLED_OP_CODE (NUEVO)
            var data = JSON.parse_string(state.data)
            print("Countdown cancelado por: ", data["playerUsername"])
            hide_countdown()
            show_message(data["playerUsername"] + " canceló el inicio")
```

## Flujo de Ejecución

### Flujo Normal (Ready)

1. **Jugadores se unen al match**
   - Cada jugador inicia con `ready: false` en el ranking

2. **Jugador marca ready**
   - Cliente llama al RPC `set_player_ready`
   - Servidor actualiza `state.ranking[player].ready = true`
   - Servidor hace broadcast del ranking actualizado

3. **Verificación de ready**
   - Cuando todos los jugadores tienen `ready: true`
   - Y hay al menos el mínimo de jugadores
   - Se activa el countdown: `countdownActive = true`, `countdownValue = 5`

4. **Countdown**
   - Cada segundo, el servidor envía COUNTDOWN_OP_CODE con el valor (5,4,3,2,1)
   - Los clientes muestran el número en pantalla

5. **Inicio del juego**
   - Cuando `countdownValue` llega a 0
   - Servidor envía GAME_START_OP_CODE
   - Marca `gameStarted = true`

### Flujo de Cancelación (Unready) - NUEVO

1. **Jugador desmarca ready**
   - Cliente llama al RPC `set_player_unready`
   - Servidor actualiza `state.ranking[player].ready = false`
   - Servidor hace broadcast del ranking actualizado

2. **Si countdown está activo**
   - El servidor detecta que `countdownActive = true`
   - Cancela el countdown: `countdownActive = false`, `countdownValue = 5`
   - Envía COUNTDOWN_CANCELLED_OP_CODE a todos los jugadores
   - El mensaje incluye el username del jugador que canceló

3. **Clientes reciben cancelación**
   - Ocultan el countdown
   - Muestran mensaje indicando quién canceló
   - Pueden volver a marcar ready cuando estén listos nuevamente

## Ejemplo de UI en Godot

```gdscript
# Ejemplo de botón toggle Ready/Unready
@onready var ready_button = $ReadyButton
var is_ready = false

func _on_ready_button_pressed():
    if is_ready:
        await mark_player_unready()
        ready_button.text = "Listo"
        is_ready = false
    else:
        await mark_player_ready()
        ready_button.text = "Cancelar"
        is_ready = true

# Mostrar lista de jugadores con estado ready
func update_ranking_ui(ranking_data):
    for i in range(ranking_data.size()):
        var player = ranking_data[i]
        var label = $PlayerList.get_child(i)
        label.text = player["username"]
        
        # Mostrar checkmark si está listo
        if player["ready"]:
            label.text += " ✓"
            label.modulate = Color.GREEN
        else:
            label.modulate = Color.WHITE

# Mostrar countdown
var countdown_label = null
func show_countdown(value: int):
    if countdown_label == null:
        countdown_label = $CountdownLabel
    countdown_label.visible = true
    countdown_label.text = str(value)
    # Opcional: agregar animación o sonido

func hide_countdown():
    if countdown_label:
        countdown_label.visible = false
```

## Configuración

### Mínimo de jugadores
En [match-handler.ts](match-handler.ts):
```typescript
const minPlayers = state.ranking.length >= 2; // Cambiar el número aquí
```

### Duración del countdown
En [match-handler.ts](match-handler.ts):
```typescript
state.countdownValue = 10; // Cambiar de 5 a 10 para countdown de 10 segundos
```

## Archivos Modificados

1. **[match-handler.ts](match-handler.ts)**
   - Añadidos OpCodes: UNREADY_OP_CODE, COUNTDOWN_CANCELLED_OP_CODE
   - Lógica de unready en `matchLoop`
   - Manejo de señales unready en `matchSignal`
   - Cancelación automática de countdown

2. **[rpc-match.ts](rpc-match.ts)**
   - Nuevo RPC `rpcSetPlayerUnready`

3. **[main.ts](main.ts)**
   - Registro del nuevo RPC `set_player_unready`

## Ejemplo Completo

Ver [godot-example-ready.gd](godot-example-ready.gd) para un ejemplo completo de implementación en Godot con ambas funcionalidades (ready y unready).

## Casos de Uso

### 1. Botón Toggle Ready/Unready
El jugador puede presionar el mismo botón para marcar/desmarcar ready.

### 2. Countdown Cancelable
Si un jugador se da cuenta que no está listo, puede cancelar durante el countdown.

### 3. Prevención de Inicio Accidental
Evita que el juego comience si alguien accidentalmente marca ready.

### 4. Feedback Visual
Los clientes pueden mostrar quién está listo y quién canceló el inicio.

## Notas Importantes

- ⚠️ El countdown se cancela **inmediatamente** cuando alguien desmarca ready
- ⚠️ Una vez que el juego ha comenzado (`gameStarted: true`), no se puede hacer unready
- ⚠️ Todos los jugadores pueden volver a marcar ready después de una cancelación
- ⚠️ El estado ready se resetea solo cuando el match es recreado
- 💡 Considera agregar un tiempo mínimo entre ready/unready para evitar spam
- 💡 Puedes agregar penalizaciones por cancelar muchas veces si es necesario
