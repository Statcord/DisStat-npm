const baseURL = "https://disstat.numselli.xyz/api"
const autopostInterval = 90000
let apiKey = ""

let unposted = {
	commands: [],
	events: [],
	botUsers: []
}
let botId = ""
let bot = {}

class DisStat {
	constructor(apiKeyInput = "", botInput = "") {
		if (!apiKeyInput) return new Error("No DisStat API key provided. You can find the API key on the Manage Bot page of your bot.")

		botId = typeof botInput == "object" ? botInput.user.id : botInput
		if (!botId) return new Error("Missing or invalid bot ID provided, got type: " + typeof botInput)
		apiKey = apiKeyInput

		if (typeof botInput == "object") {
			bot = botInput
			setTimeout(autopost, 30000)
		}
	}

	async getBot(botIdInput = "") {
		return await getBot(botIdInput)
	}

	async postData(data = {}, returnStats = false) {
		return await postData(data, returnStats)
	}

	async sync() {
		return await sync()
	}

	async postCommand(command = "", userId = "") {
		return await postCommand(command, userId)
	}

	async postEvent(event = "", userId = "") {
		return await postEvent(event, userId)
	}
}

async function autopost() {
	const data = unposted
	if (bot) {
		data.guildCount = bot.guilds.cache.size
		data.shardCount = bot.shard ? bot.shard.count : 0
		data.userCount = bot.guilds.cache.reduce((acc, cur) => acc + cur.memberCount, 0)
	}
	data.commandsRun = unposted.commands ? unposted.commands.length : 0
	data.eventsReceived = unposted.events ? unposted.events.length : 0
	data.members = unposted.botUsers ? unposted.botUsers.length : 0
	data.ramUsage = process.memoryUsage().heapUsed / 1024 / 1024
	data.totalRam = process.memoryUsage().heapTotal / 1024 / 1024
	data.cpuUsage = process.cpuUsage().user / 1000 / 1000

	delete data.commands
	delete data.events
	delete data.botUsers
	await postData(data)
	unposted = {
		commands: [],
		events: [],
		botUsers: []
	}
	setTimeout(autopost, autopostInterval)
}

async function getBot(botIdInput = "") {
	const response = await fetch(baseURL + "/bots/" + (botIdInput || botId), {
		headers: {
			Authorization: apiKey
		}
	})
	return await response.json()
}

async function postData(data = {}, returnStats = false) {
	const response = await fetch(baseURL + "/stats/post", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: apiKey
		},
		body: JSON.stringify({
			...data,
			id: botId
		})
	})
	if (returnStats) return await response.json()
}

async function sync() {
	await fetch(baseURL + "/bots/sync", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: apiKey
		},
		body: JSON.stringify({
			bot: botId
		})
	})
}

async function postCommand(command = "", userId = "") {
	if (!command) return new Error("No command provided.")
	if (userId && (userId.length < 15 || userId.length > 25)) return new Error("Invalid user ID provided, expected length 15-25 but got length " + userId.length + ": " + userId)

	if (userId && unposted.botUsers.includes(userId)) unposted.botUsers.push(userId)
	unposted.commands.push(command)
}

async function postEvent(event = "", userId = "") {
	if (!event) return new Error("No event provided.")
	if (userId && (userId.length < 15 || userId.length > 25)) return new Error("Invalid user ID provided, expected length 15-25 but got length " + userId.length + ": " + userId)

	if (userId && unposted.botUsers.includes(userId)) unposted.botUsers.push(userId)
	unposted.events.push(event)
}

module.exports = DisStat
