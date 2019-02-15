const level = require("level")
const utils = require("./utils.js")
const { RWLock } = require("./rwlock.js")


class GraphDB
{
	constructor(folder)
	{
		this.innerLock = new RWLock()
		this.db = new level(folder)
		
		this.tables = {}
		this.indexes = {}
	}
	
	
	async create(value)
	{
		try
		{
			await this.innerLock.acquireWrite()
			
			while (true)
			{
				const id = utils.generateRandomId(6)
				let found = true
				
				try { await this.db.get(id) }
				catch (err)
				{
					if (err.notFound)
						found = false
					else
						throw err
				}
				
				if (found)
					continue
				
				await this.db.put(id, JSON.stringify(value))
				return id
			}
		}
		finally
			{ this.innerLock.releaseWrite() }
	}
	
	
	async set(id, value)
	{
		try
		{
			await this.innerLock.acquireWrite()
			
			await this.db.put(id, JSON.stringify(value))
			return id
		}
		finally
			{ this.innerLock.releaseWrite() }
	}
	
	
	async get(id)
	{
		try
		{
			this.innerLock.acquireRead()
			
			return JSON.parse(await this.db.get(id))
		}
		catch (err)
		{
			if (err.notFound)
				return null
			else
				throw err
		}
		finally
			{ this.innerLock.releaseRead() }
	}
	
	
	async getNode(id)
	{
		try
		{
			this.innerLock.acquireRead()
			
			return JSON.parse(await this.db.get(id))
		}
		catch (err)
		{
			if (err.notFound)
				return null
			else
				throw err
		}
		finally
			{ this.innerLock.releaseRead() }
	}
	
	
	async getLinksFrom(id, kind)
	{
		try
		{
			await this.innerLock.acquireRead()
			return await this._getLinksFrom(id, kind)
		}
		finally
			{ this.innerLock.releaseRead() }
	}
	
	
	async getLinksTo(id, kind)
	{
		try
		{
			await this.innerLock.acquireRead()
			return await this._getLinksTo(id, kind)
		}
		finally
			{ this.innerLock.releaseRead() }
	}
	
	
	async getLinkKindsFrom(id)
	{
		try
		{
			await this.innerLock.acquireRead()
			return await this._getLinkKindsFrom(id)
		}
		finally
			{ this.innerLock.releaseRead() }
	}
	
	
	async del(id)
	{
		try
		{
			await this.innerLock.acquireWrite()
			
			const linkKinds = await this._getLinkKindsFrom(id)
			
			for (const linkKind of linkKinds)
			{
				for (const linkDir of [">", "<"])
				{
					let linksToDelete = []
					
					await this._enumerateKeys(linkDir + linkKind + "#" + id, (key, stop) =>
					{
						const parts = key.split("#")
						if (parts[1] != id)
						{
							stop()
							return
						}
						
						linksToDelete.push(key)
					})
					
					for (let linkToDelete of linksToDelete)
					{
						const linkId = await this.db.get(linkToDelete)
						if (linkId != null && linkId != "")
							await this.db.del(linkId)
						
						await this.db.del(linkToDelete)
						
						const parts = linkToDelete.split("#")
						const inverseLinkToDelete = (linkDir == ">" ? "<" : ">") + parts[0].substr(1) + "#" + parts[2] + "#" + parts[1]
						
						await this.db.del(inverseLinkToDelete)
					}
				}
			}
			
			await this.db.del(id)
		}
		finally
			{ this.innerLock.releaseWrite() }
	}
	
	
	async link(fromId, kind, toId, linkData = null)
	{
		const linkId = (linkData != null ? await this.create(linkData) : null)
		
		try
		{
			await this.innerLock.acquireWrite()
			await this.db.put(">" + kind + "#" + fromId + "#" + toId, linkId)
			await this.db.put("<" + kind + "#" + toId + "#" + fromId, linkId)
			await this.db.put(":" + fromId + "#" + kind, null)
			await this.db.put(":" + toId + "#" + kind, null)
			
			return linkId
		}
		finally
			{ this.innerLock.releaseWrite() }
	}
	
	
	async unlink(fromId, kind, toId)
	{
		try
		{
			await this.innerLock.acquireWrite()
			
			const linkId = await this.db.get(">" + kind + "#" + fromId + "#" + toId)
			if (linkId != null && linkId != "")
				await this.db.del(linkId)
			
			await this.db.del(">" + kind + "#" + fromId + "#" + toId)
			await this.db.del("<" + kind + "#" + toId + "#" + fromId)
		}
		finally
			{ this.innerLock.releaseWrite() }
	}
	
	
	async _getLinkKindsFrom(id)
	{
		let linkKinds = []
		
		await this._enumerateKeys(":" + id, (key, stop) =>
		{
			const parts = key.split("#")
			if (parts[0].substr(1) != id)
			{
				stop()
				return
			}
			
			linkKinds.push(parts[1])
		})
		
		return linkKinds
	}
	
	
	async _getLinksFrom(id, kind)
	{
		let links = []
		
		await this._enumerateKeys(">" + kind + "#" + id, (key, stop) =>
		{
			const parts = key.split("#")
			if (parts[0].substr(1) != kind || parts[1] != id)
			{
				stop()
				return
			}
			
			links.push(parts[2])
		})
		
		return links
	}
	
	
	async _getLinksTo(id, kind)
	{
		let links = []
		
		await this._enumerateKeys("<" + kind + "#" + id, (key, stop) =>
		{
			const parts = key.split("#")
			if (parts[0].substr(1) != kind || parts[1] != id)
			{
				stop()
				return
			}
			
			links.push(parts[2])
		})
		
		return links
	}
	
	
	async _enumerateKeys(fromKey, callback)
	{
		return new Promise((resolve, reject) =>
		{
			let keyStream = this.db.createKeyStream({ gte: fromKey })
		
			let stop = () =>
			{
				resolve()
				keyStream.destroy()
			}
			
			keyStream.on("error", () => reject())
			keyStream.on("close", () => reject())
			keyStream.on("end", () => resolve())
			keyStream.on("data", (key) => callback(key, stop))
		})
	}
}


module.exports = { GraphDB }