const util = require("util")
const setImmediatePromise = util.promisify(setImmediate)


class RWLock
{
	constructor()
	{
		this.readingNum = 0
		this.writing = false
	}
	
	
	async acquireRead()
	{
		while (this.writing)
			await setImmediatePromise()
		
		this.readingNum += 1
	}
	
	
	releaseRead()
	{
		this.readingNum -= 1
	}
	
	
	async acquireWrite()
	{
		while (this.writing)
			await setImmediatePromise()
		
		this.writing = true
		
		while (this.readingNum > 0)
			await setImmediatePromise()
	}
	
	
	releaseWrite()
	{
		this.writing = false
	}
}


module.exports =
{
	RWLock
}