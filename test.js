const { GraphDB } = require("./graphdb.js")


async function main()
{
	const db = new GraphDB("./.db")
	const teamHF = await db.create({ name: "Happy Farmers" })
	console.log(await db.getNode(teamHF))
	
	await db.set(teamHF, { name: "Happy Fellows" })
	console.log(await db.getNode(teamHF))
	
	const playerA = await db.create({ name: "Alvin" })
	console.log(await db.getNode(playerA))
	
	const playerB = await db.create({ name: "Betty" })
	console.log(await db.getNode(playerB))
	
	await db.link(teamHF, "roster", playerA)
	await db.link(teamHF, "roster", playerB)
	console.log(await db.getNode(teamHF))
	console.log(await db.getNode(playerA))
	console.log(await db.getNode(playerB))
	
	await db.del(teamHF)
	console.log(await db.getNode(teamHF))
	console.log(await db.getNode(playerA))
	console.log(await db.getNode(playerB))
	
	const root = await db.set(".root", {})
	
	console.log("")
	console.log("creating teams")
	let teams = []
	for (let i = 0; i < 1000; i++)
	{
		teams.push(await db.create({ name: "Team" + i }))
		await db.link(root, "team", teams[i])
	}
	
	console.log("creating players")
	let players = []
	for (let i = 0; i < 1000; i++)
	{
		players.push(await db.create({ name: "Player" + i }))
		await db.link(root, "player", players[i])
	}
	
	console.log("linking")
	for (let i = 0; i < 1000; i++)
	{
		let team = teams[Math.floor(Math.random() * teams.length)]
		let player = players[Math.floor(Math.random() * players.length)]
		
		await db.link(team, "roster", player)
	}
	
	console.log("done")
	console.log("")
	console.log(await db.getNode(root))
	console.log("")
	console.log(await db.getNode(teams[0]))
	console.log("")
	console.log(await db.getNode(teams[1]))
	console.log("")
	console.log(await db.getNode(teams[2]))
	console.log("")
	console.log(await db.getNode(players[0]))
	console.log("")
	console.log(await db.getNode(players[1]))
	console.log("")
	console.log(await db.getNode(players[2]))
}

main()