# Ejemplo de uso del sistema de Ready en Godot
# Este script muestra cómo usar el RPC para marcar al jugador como listo

extends Node

var nakama_client
var nakama_socket
var current_match_id = ""

# OpCodes - deben coincidir con los del servidor
const RANKING_OP_CODE = 2
const READY_OP_CODE = 3
const COUNTDOWN_OP_CODE = 4
const GAME_START_OP_CODE = 5
const UNREADY_OP_CODE = 6
const COUNTDOWN_CANCELLED_OP_CODE = 7

func _ready():
	# Inicializar cliente Nakama (ajusta los parámetros según tu configuración)
	nakama_client = Nakama.create_client("defaultkey", "127.0.0.1", 7350, "http")
	
	# Conectar señales
	nakama_socket.received_match_state.connect(_on_match_state_received)

# Llamar a este método cuando el jugador presione el botón "Listo"
func mark_player_ready():
	if current_match_id.is_empty():
		print("Error: No hay match activo")
		return
	
	# Método 1: Usar el RPC (recomendado para este caso)
	var payload = JSON.stringify({
		"matchId": current_match_id
	})
	
	var result = await nakama_client.rpc_async(nakama_socket.session, "set_player_ready", payload)
	
	if result.is_exception():
		print("Error al marcar como listo: ", result.get_exception().message)
	else:
		print("Marcado como listo exitosamente")
		var response = JSON.parse_string(result.payload)
		print(response)

# Método 2: Enviar mensaje directo al match (alternativa)
func mark_player_ready_alternative():
	if current_match_id.is_empty():
		print("Error: No hay match activo")
		return
	
	# Enviar mensaje vacío al match con el OpCode de READY
	var data = {}
	var json_data = JSON.stringify(data)
	
	var result = await nakama_socket.send_match_state_async(
		current_match_id, 
		READY_OP_CODE, 
		json_data
	)
	
	if result.is_exception():
		print("Error al enviar estado ready: ", result.get_exception().message)
	else:
		print("Estado ready enviado al match")

# Llamar a este método cuando el jugador presione el botón "Cancelar" o "No Listo"
func mark_player_unready():
	if current_match_id.is_empty():
		print("Error: No hay match activo")
		return
	
	# Método 1: Usar el RPC (recomendado)
	var payload = JSON.stringify({
		"matchId": current_match_id
	})
	
	var result = await nakama_client.rpc_async(nakama_socket.session, "set_player_unready", payload)
	
	if result.is_exception():
		print("Error al desmarcar como listo: ", result.get_exception().message)
	else:
		print("Desmarcado como listo exitosamente")
		var response = JSON.parse_string(result.payload)
		print(response)

# Método 2: Enviar mensaje directo al match (alternativa)
func mark_player_unready_alternative():
	if current_match_id.is_empty():
		print("Error: No hay match activo")
		return
	
	# Enviar mensaje vacío al match con el OpCode de UNREADY
	var data = {}
	var json_data = JSON.stringify(data)
	
	var result = await nakama_socket.send_match_state_async(
		current_match_id, 
		UNREADY_OP_CODE, 
		json_data
	)
	
	if result.is_exception():
		print("Error al enviar estado unready: ", result.get_exception().message)
	else:
		print("Estado unready enviado al match")

# Manejar mensajes recibidos del servidor
func _on_match_state_received(state: NakamaRTAPI.MatchData):
	match state.op_code:
		RANKING_OP_CODE:
			# Actualizar ranking con información de quién está listo
			var ranking_data = JSON.parse_string(state.data)
			update_ranking_ui(ranking_data)
			
		COUNTDOWN_OP_CODE:
			# Mostrar el conteo regresivo
			var countdown_data = JSON.parse_string(state.data)
			var countdown_value = countdown_data["countdown"]
			print("Countdown: ", countdown_value)
			show_countdown(countdown_value)
			
		GAME_START_OP_CODE:
			# El juego ha comenzado!
			print("¡El juego comienza!")
			start_game()
			
		COUNTDOWN_CANCELLED_OP_CODE:
			# El countdown fue cancelado
			var cancel_data = JSON.parse_string(state.data)
			print("Countdown cancelado por: ", cancel_data["playerUsername"])
			hide_countdown()
			show_cancelled_message(cancel_data["playerUsername"])

func update_ranking_ui(ranking_data):
	# Actualizar UI con el ranking
	# Cada jugador ahora tiene un campo "ready" que puedes mostrar
	for player in ranking_data:
		print("Player: ", player["username"], 
			  " Score: ", player["score"], 
			  " Ready: ", player["ready"])
	# Aquí actualizarías tu interfaz gráfica

func show_countdown(value: int):
	# Mostrar el número del conteo regresivo en la pantalla
	# Por ejemplo, con un Label grande en el centro
	# $CountdownLabel.text = str(value)
	pass

func hide_countdown():
	# Ocultar el label del countdown
	# $CountdownLabel.visible = false
	pass

func show_cancelled_message(player_username: String):
	# Mostrar mensaje de que se canceló el countdown
	# $CancelledLabel.text = player_username + " canceló"
	# Opcionalmente, ocultar después de unos segundos
	print(player_username, " canceló el inicio del juego")

func start_game():
	# Iniciar el juego
	# Cambiar a la escena del juego o activar la lógica del juego
	print("Iniciando juego...")
	# get_tree().change_scene_to_file("res://scenes/game.tscn")
	pass

# Ejemplo de flujo completo
func example_flow():
	# 1. Crear o unirse a un match
	# var session = await nakama_client.authenticate_device_async(...)
	# nakama_socket = Nakama.create_socket_from(nakama_client)
	# await nakama_socket.connect_async(session)
	
	# 2. Crear match
	# var result = await nakama_client.rpc_async(session, "create_match", "")
	# var response = JSON.parse_string(result.payload)
	# current_match_id = response["matchId"]
	
	# 3. Unirse al match
	# await nakama_socket.join_match_async(current_match_id)
	
	# 4. Cuando el jugador esté listo
	# mark_player_ready()
	
	# 5. El servidor detectará cuando todos estén listos y enviará el countdown
	# Los mensajes serán recibidos en _on_match_state_received()
	pass
