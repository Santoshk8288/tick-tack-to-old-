var socket = io.connect('https://tick-tack-to.herokuapp.com')
// var socket = io.connect('http://192.168.88.73:3000')

$('#formContent').show()

var game, turn= false, stack=[], player

const joinGame = (e)=>{
	
	name = $('#name').val() 
	if(name != ''){
		socket.emit('add player', name)
		$('#formContent').hide()
		$('#formContentGames').show()	
	}
}

const invite = (p)=>{
	socket.emit('invite player', p)
	$('#game-list').hide()
	$('#invitaion').html('Invitation send').show()
}

const yes = ()=>{
	socket.emit('accepted', game)
}

function press(value){
	if(turn && !stack[value]){
		turn = false
		var step ={
			player   : player,
			position : value 
		}
		socket.emit('press', step)
	}
}

function reload(){
	socket.emit('rejoin')
}

socket.on('rejoin game', function(players){
	$('#game-board').hide()
	$('#winner').hide()
	$('#games').show()
	$('#game-list ul').empty()
	$('#game-list').show()
	$('#invitaion').hide()
	turn= false, stack=[]
	for(var i = 0; i<9 ; i++){
		$('#value'+i).html('')
	}
	for(var i=0; i<=players.length-1; i++){
		console.log(players[i])
		if(name != players[i].name){
			$('ul').append('<li>'+players[i].name+' <button onclick="invite('+players[i].id+')">invite</button></li>')
		}
	}
})

socket.on('available players', (players)=>{
	$('#game-list').empty()
	for(var i=0; i<=players.length-1; i++){
		if(name != players[i].name){
			$('ul').append(
				`<li> 
					${players[i].name} <button onclick="invite(${players[i].id})" class="fadeIn fourth" >invite</button>
				</li>`
			)
		}
	}
})

socket.on('send invitation', function(invi){
	turn = true
	
	var choice;
  if (confirm(invi.name +" Invited you to play!!!")) {
    choice = 'true';
  } else {
    choice = 'false';
  }
  if(choice == 'true'){
  	socket.emit('accepted', invi.game)
  }
  else{
  	socket.emit('rejected')
  }
})

socket.on('game board', function(game){
	if(game[0] == name){
		player = 'p1'
		$('#move').show()
		$('#move').html('please wait')
	}
	else{
		player = 'p2'
		$('#move').show()
		$('#move').html('your turn')
	}
	$('#games').hide()
	$('#game-board').show()
	$('#game-palyers').html(game[0] +' v/s '+ game[1])
})

socket.on('pressed', function(step){
	stack[step.position] = 1;
	var result = stack.filter(i => i === 1).length;
	if(step.player == player){
		turn = false
		$('#move').show()
		$('#move').html('please wait')
	}
	else{
		turn = true
		$('#move').show()
		$('#move').html('your turn')
	}
	if(step.player == 'p1'){
		$('#value'+step.position).html('O')
	}
	else{
		$('#value'+step.position).html('X')
	}	
	if(result == 9){
		socket.emit('draw')
	}
})

socket.on('winner', function(winner){
	$('#move').hide()
	$('#winner').show()
	$('#winner').html('winner is '+ winner +' <button onclick=reload()>Reload</button>')
})

socket.on('match draw', function(){
	$('#move').hide()
	$('#winner').show()
	$('#winner').html('Match Draw <button onclick=reload()>Reload</button>')
})