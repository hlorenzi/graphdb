const level = require("level")
const utils = require("./utils.js")
const { RWLock } = require("./rwlock.js")


class GraphDB
{
	constructor(folder)
	{
		this.innerLock = new RWLock()
		this.db = new level(folder)
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
				
				const obj = { value, links: {} }
				
				await this.db.put(id, JSON.stringify(obj))
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
			
			let oldValue = null
			try
			{
				oldValue = JSON.parse(await this.db.get(id))
			}
			catch (err)
			{
				if (err.notFound)
					oldValue = { value: null, links: {} }
				else
					throw err
			}
			
			const newValue = { value, links: oldValue.links }
			await this.db.put(id, JSON.stringify(newValue))
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
			
			const value = JSON.parse(await this.db.get(id))
			return value.value
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
	
	
	async del(id)
	{
		try
		{
			await this.innerLock.acquireWrite()
			
			const oldValue = JSON.parse(await this.db.get(id))
			
			for (const key of Object.keys(oldValue.links))
			{
				const inverseKey = (key[0] == "<" ? ">" : "<") + key.substr(1)
				
				for (const toId of oldValue.links[key])
					await this._unlinkOneWay(toId, inverseKey, id)
			}
			
			await this.db.del(id)
		}
		finally
			{ this.innerLock.releaseWrite() }
	}
	
	
	async link(fromId, kind, toId)
	{
		try
		{
			await this.innerLock.acquireWrite()
				
			await this._linkOneWay(fromId, ">" + kind, toId)
			await this._linkOneWay(toId,   "<" + kind, fromId)
		}
		finally
			{ this.innerLock.releaseWrite() }
	}
	
	
	async unlink(fromId, kind, toId)
	{
		try
		{
			await this.innerLock.acquireWrite()
				
			await this._unlinkOneWay(fromId, ">" + kind, toId)
			await this._unlinkOneWay(toId,   "<" + kind, fromId)
		}
		finally
			{ this.innerLock.releaseWrite() }
	}
	
	
	async _linkOneWay(fromId, kind, toId)
	{
		const oldValue = JSON.parse(await this.db.get(fromId))
		
		let newArray = oldValue.links[kind] || []
		if (newArray.find(id => id == toId) == null)
			newArray.push(toId)
		
		let newLinks = oldValue.links
		newLinks[kind] = newArray
		
		const newValue = { value: oldValue.value, links: newLinks }
		await this.db.put(fromId, JSON.stringify(newValue))
	}
	
	
	async _unlinkOneWay(fromId, kind, toId)
	{
		const oldValue = JSON.parse(await this.db.get(fromId))
		
		let newArray = oldValue.links[kind]
		if (!newArray)
			return
		
		let index = newArray.findIndex(id => id == toId)
		if (index < 0)
			return
		
		newArray.splice(index, 1)
		
		let newLinks = oldValue.links
		if (newArray.length > 0)
			newLinks[kind] = newArray
		else
			delete newLinks[kind]
		
		const newValue = { value: oldValue.value, links: newLinks }
		await this.db.put(fromId, JSON.stringify(newValue))
	}
}


module.exports = { GraphDB }