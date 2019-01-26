const crypto = require("crypto")


function generateRandomId(byteNum = 6)
{
	return encodeUrlSafe(crypto.randomBytes(byteNum).toString("base64"))
}


function replaceAll(str, find, replace)
{
	return str.replace(new RegExp(escapeRegExp(find), "g"), replace)
}


function escapeRegExp(str)
{
	return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1")
}


function encodeUrlSafe(str)
{
	str = replaceAll(str, "+", "-")
	str = replaceAll(str, "/", "_")
	str = replaceAll(str, "=", "")
	return str
}


function decodeUrlSafe(str)
{
	str = replaceAll(str, "-", "+")
	str = replaceAll(str, "_", "/")
	
	switch (str.length % 4)
	{
		case 2: str += "=="; break
		case 3: str += "="; break
	}
	
	return str
}


module.exports =
{
	generateRandomId
}