import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { createInterface } from "node:readline/promises"
import { generateText } from "ai"
import { spawnSync } from "bun"
import chalk from "chalk"
import inquirer from "inquirer"

const keyPath = `${process.env.HOME}/.local/share/git-plz/key.txt`

let apiKey: string
try {
	apiKey = readFileSync(keyPath, "utf8").trim()
} catch (_error) {
	console.log(
		chalk.yellow(
			"API key not found. Please enter it (it will be saved for future use):",
		),
	)
	const rl = createInterface({
		input: process.stdin,
		output: process.stdout,
	})
	apiKey = await rl.question("Enter your AI Gateway API key: ")
	rl.close()
	const dir = keyPath.substring(0, keyPath.lastIndexOf("/"))
	mkdirSync(dir, { recursive: true })
	writeFileSync(keyPath, apiKey)
	console.log(chalk.green("API key saved!"))
}
process.env.AI_GATEWAY_API_KEY = apiKey

function runGit(args: string[]): {
	stdout: string
	stderr: string
	success: boolean
} {
	const result = spawnSync(["git", ...args], {
		stdio: ["inherit", "pipe", "pipe"],
		stderr: "pipe",
	})
	const stdout = new TextDecoder().decode(result.stdout).trim()
	const stderr = new TextDecoder().decode(result.stderr).trim()
	return { stdout, stderr, success: result.success }
}

const repo_check = runGit(["rev-parse", "--is-inside-work-tree"])
if (!repo_check.success) {
	console.error(chalk.red("Error: Not inside a Git repository."))
	process.exit(1)
}

const status_result = runGit(["status", "--porcelain"])
if (status_result.stdout === "") {
	console.log(chalk.yellow("No changes to commit."))
	process.exit(0)
}

const log_result_obj = runGit(["log", "--oneline", "-5"])
const log_result = log_result_obj.stdout || "No recent commits."

const modified_result = runGit(["diff", "--name-only"])
const untracked_result = runGit(["ls-files", "--others", "--exclude-standard"])
const modified = modified_result.stdout.split("\n").filter(f => f.trim() !== "")
const untracked = untracked_result.stdout
	.split("\n")
	.filter(f => f.trim() !== "")
const allFiles = [...new Set([...modified, ...untracked])].sort()

if (allFiles.length > 0) {
	const question = {
		name: "files",
		type: "checkbox" as const,
		message: "Select files to stage: (Press <space> to select)",
		choices: allFiles.map(file => ({ name: file, value: file })),
	} as const

	const answers = await inquirer.prompt(question)

	const selected = (answers as { files: string[] }).files || []

	if (selected.length === 0) {
		console.log(chalk.yellow("No files selected to stage. Aborting."))
		process.exit(0)
	}

	console.log(chalk.green("\nYour selected files:"))
	selected.forEach((file: string) => {
		console.log(`- ${chalk.cyan(file)}`)
	})

	const selectedStatus = runGit(["status", "--porcelain", ...selected])
	const selectedDiff = runGit(["diff", ...selected])

	const prompt = `Generate a concise, imperative commit message (one line, starting with a verb like "add", "fix", "update") based on the following selected files:

${selected.join("\n")}

Unstaged changes status for selected files:
${selectedStatus.stdout}

Diff of changes for selected files:
${selectedDiff.stdout}

Recent commit history:
${log_result}

Focus on the "why" and purpose of the changes, not just "what". Keep it under 72 characters.`

	try {
		const { text } = await generateText({
			model: "xai/grok-4-fast-non-reasoning",
			prompt,
		})

		const message = text.trim()

		console.log(chalk.green(`Generated commit message: ${message}`))

		const add_result = runGit(["add", ...selected])
		if (!add_result.success) {
			console.error(chalk.red("Error: Failed to stage changes."))
			process.exit(1)
		}

		const commit_result = runGit(["commit", "-m", message])
		if (commit_result.success) {
			console.log(chalk.green("Commit successful!"))
		} else {
			console.error(chalk.red(`Error: Commit failed. ${commit_result.stderr}`))
			process.exit(1)
		}
	} catch (error) {
		console.error(
			chalk.red(`Error generating commit message: ${(error as Error).message}`),
		)
		process.exit(1)
	}
} else {
	console.log(chalk.yellow("No files to select."))
	process.exit(0)
}
