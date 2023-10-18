const express = require('express');
const app 		= express();
const http 		= require('http')
const server  = http.createServer(app);
const io 			= require('socket.io').listen(server);

const PORT = process.env.PORT || 3200
app.use(express.static(__dirname+'/client'));

app.get('/', (req, res)=>{
	res.render('/index.html')
})

let players={}, game={}, test = {}, availablePlayers=[]

io.sockets.on('connection', (socket)=>{
	socket.on('join game', (name)=>{
		socket.name = name
		players[socket.id] = socket
		availablePlayers.push({name:socket.name, id:socket.id})
		io.sockets.emit('available players',  availablePlayers)
	})

	socket.on('invite player',  (request)=>{
		let gameRoom = `game${parseInt(Math.random()*100).toString()}`
		game[gameRoom] = []
		socket.gameRoom = gameRoom
		socket.join(socket.gameRoom)
		game[gameRoom].push(socket.name)
		players[request].emit('send invitation', {name:socket.name, game:gameRoom})
		availablePlayers.forEach((player, index)=>{
			if(player.id == socket.id){
				availablePlayers.splice(index,1)
			}
			if(player.id == players[request].id){
				availablePlayers.splice(index,1)
			}
		})
		io.sockets.emit('available players',  availablePlayers)
	})

	socket.on('accepted', (g)=>{
		var room = io.sockets.adapter.rooms[g];
		if(room){
			socket.gameRoom = g
			socket.join(socket.gameRoom)
			game[g].push(socket.name)
			test[g] ={
				p1 : [],
				p2 : []
			}
			availablePlayers.forEach((player, index)=>{
				if(player.id == socket.palyerId){
					availablePlayers.splice(index,1)
				}
			})
			io.sockets.emit('available players',  availablePlayers)
			io.sockets.to(socket.gameRoom).emit('game board', game[g])
		}
		else{
			availablePlayers.push({name:socket.name, id:socket.palyerId})
			io.sockets.emit('available players',  availablePlayers)
		}
	})
	
	socket.on('press', (step)=>{
		if(step.player == 'p1'){
			io.sockets.to(socket.gameRoom).emit('pressed', step)
			test[socket.gameRoom].p1.push(step.position)
			if(test[socket.gameRoom].p1.length >2){
				evaluate(test[socket.gameRoom].p1, socket.name, socket.gameRoom, step.player)
			}
		}
		else{
			io.sockets.to(socket.gameRoom).emit('pressed', step)
			test[socket.gameRoom].p2.push(step.position)
			if(test[socket.gameRoom].p2.length >2){
				evaluate(test[socket.gameRoom].p2, socket.name, socket.gameRoom, step.player)
			}
		}
	})

	socket.on('draw', ()=>{
		var self = {}
		self.socket = socket
		self.room = io.sockets.adapter.rooms[socket.gameRoom];
		if(self.room){
			self.gameRoom = self.socket.gameRoom
			self.palyerId = self.socket.palyerId
			availablePlayers.push({name:self.socket.name, id:self.socket.palyerId})
			io.sockets.to(self.gameRoom).emit('match draw')
			players[self.palyerId].leave(self.gameRoom)
			test[self.gameRoom] = {}
		}
	})

	socket.on('rejoin', ()=>{
		availablePlayers.forEach((player, index)=>{
			if(player.id == socket.palyerId){
				availablePlayers.splice(index,1)
			}
		})
		Object.keys(players).forEach((id)=>{
			console.log(players[id])
			if(players[id].gameRoom == socket.gameRoom){
				players[id].emit('rejoin game',  availablePlayers)
			}
		})
		io.sockets.emit('available players', availablePlayers)
	})

	socket.on('disconnect', ()=>{
		Object.keys(players).forEach((id)=>{
			if(id == socket.palyerId){
				delete players[id]
			}
		})
		availablePlayers.forEach((player, index)=>{
			if(player.id == socket.palyerId){
				availablePlayers.splice(index,1)
			}
		})
		socket.leave(socket.gameRoom)
		io.sockets.emit('available players',  availablePlayers)
	})
})

let evaluate = (player, name, gameRoom, playerType)=>{
	var self = {}
	self.player = player
	self.name = name
	self.gameRoom = gameRoom
	self.playerType = playerType
	// console.log(self)
	if(self.player[self.player.length-1] == 0){
		if(self.player.indexOf(1)!= -1 && self.player.indexOf(2)!= -1)winner(self.name, self.gameRoom)
		if(self.player.indexOf(4)!= -1 && self.player.indexOf(8)!= -1)winner(self.name, self.gameRoom)
		if(self.player.indexOf(3)!= -1 && self.player.indexOf(6)!= -1)winner(self.name, self.gameRoom)
	}
	else if(self.player[self.player.length-1] == 1){
		if(self.player.indexOf(0)!= -1 && self.player.indexOf(2)!= -1)winner(self.name, self.gameRoom)
		if(self.player.indexOf(4)!= -1 && self.player.indexOf(7)!= -1)winner(self.name, self.gameRoom)
	}
	else if(self.player[self.player.length-1] == 2){
		if(self.player.indexOf(1)!= -1 && self.player.indexOf(0)!= -1)winner(self.name, self.gameRoom)
		if(self.player.indexOf(4)!= -1 && self.player.indexOf(6)!= -1)winner(self.name, self.gameRoom)
		if(self.player.indexOf(5)!= -1 && self.player.indexOf(8)!= -1)winner(self.name, self.gameRoom)
	}
	else if(self.player[self.player.length-1] == 3){
		if(self.player.indexOf(0)!= -1 && self.player.indexOf(6)!= -1)winner(self.name, self.gameRoom)
		if(self.player.indexOf(4)!= -1 && self.player.indexOf(5)!= -1)winner(self.name, self.gameRoom)
	}
	else if(self.player[self.player.length-1] == 4){
		if(self.player.indexOf(0)!= -1 && self.player.indexOf(8)!= -1)winner(self.name, self.gameRoom)
		if(self.player.indexOf(2)!= -1 && self.player.indexOf(6)!= -1)winner(self.name, self.gameRoom)
		if(self.player.indexOf(1)!= -1 && self.player.indexOf(7)!= -1)winner(self.name, self.gameRoom)
		if(self.player.indexOf(3)!= -1 && self.player.indexOf(5)!= -1)winner(self.name, self.gameRoom)
	}
	else if(self.player[self.player.length-1] == 5){
		if(self.player.indexOf(2)!= -1 && self.player.indexOf(8)!= -1)winner(self.name, self.gameRoom)
		if(self.player.indexOf(3)!= -1 && self.player.indexOf(4)!= -1)winner(self.name, self.gameRoom)
	}
	else if(self.player[self.player.length-1] == 6){
		if(self.player.indexOf(0)!= -1 && self.player.indexOf(3)!= -1)winner(self.name, self.gameRoom)
		if(self.player.indexOf(7)!= -1 && self.player.indexOf(8)!= -1)winner(self.name, self.gameRoom)
		if(self.player.indexOf(4)!= -1 && self.player.indexOf(2)!= -1)winner(self.name, self.gameRoom)
	}
	else if(self.player[self.player.length-1] == 7){
		if(self.player.indexOf(6)!= -1 && self.player.indexOf(8)!= -1)winner(self.name, self.gameRoom)
		if(self.player.indexOf(1)!= -1 && self.player.indexOf(4)!= -1)winner(self.name, self.gameRoom)
	}
	else if(self.player[self.player.length-1] == 8){
		if(self.player.indexOf(2)!= -1 && self.player.indexOf(5)!= -1)winner(self.name, self.gameRoom)
		if(self.player.indexOf(6)!= -1 && self.player.indexOf(7)!= -1)winner(self.name, self.gameRoom)
		if(self.player.indexOf(0)!= -1 && self.player.indexOf(4)!= -1)winner(self.name, self.gameRoom)
	}
}

let winner = (p, gameRoom)=>{
	io.sockets.to(gameRoom).emit('winner', p)
	test[gameRoom] = {}
	Object.keys(players).forEach((id)=>{
		if(players[id].gameRoom == gameRoom){
			availablePlayers.push({name:players[id].name, id:players[id].palyerId})
			players[id].leave(gameRoom)
		}
	})
}

server.listen(PORT, () => console.log(`Running on port ${PORT}...` ))
