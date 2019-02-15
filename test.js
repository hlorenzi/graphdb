const { GraphDB } = require("./graphdb.js")


async function main()
{
	const db = new GraphDB("./.db")
	const teamHF = await db.create({ name: "Happy Farmers" })
	console.log()
	console.log(teamHF + " = ")
	console.log(await db.get(teamHF))
	
	await db.set(teamHF, { name: "Happy Fellows" })
	console.log()
	console.log(teamHF + " = ")
	console.log(await db.get(teamHF))
	
	const playerA = await db.create({ name: "Alvin" })
	console.log()
	console.log(playerA + " = ")
	console.log(await db.get(playerA))
	
	const playerB = await db.create({ name: "Betty" })
	console.log()
	console.log(playerB + " = ")
	console.log(await db.get(playerB))
	
	await db.link(teamHF, "roster", playerA)
	await db.link(teamHF, "roster", playerB)
	console.log()
	console.log(teamHF + ".linkKinds = ")
	console.log(await db.getLinkKindsFrom(teamHF))
	
	console.log()
	console.log(teamHF + ".>roster = ")
	console.log(await db.getLinksFrom(teamHF, "roster"))
	
	console.log()
	console.log(playerA + ".<roster = ")
	console.log(await db.getLinksTo(playerA, "roster"))
	
	console.log()
	console.log(playerB + ".<roster = ")
	console.log(await db.getLinksTo(playerB, "roster"))
	
	console.log()
	console.log("del " + playerA)
	await db.del(playerA)
	
	console.log()
	console.log(teamHF + ".>roster = ")
	console.log(await db.getLinksFrom(teamHF, "roster"))
	
	console.log()
	console.log(playerA + " = ")
	console.log(await db.get(playerA))
	
	console.log()
	console.log("del " + teamHF)
	await db.del(teamHF)
	
	console.log()
	console.log(playerB + ".<roster = ")
	console.log(await db.getLinksTo(playerB, "roster"))
	
	/*
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
	console.log(await db.getNode(players[2]))*/
}

main()