import { generateText } from "ai"
import chalk from "chalk"
import { spawnSync } from "bun"

if (!process.env.AI_GATEWAY_API_KEY) {
	console.error(
		chalk.red("Error: AI_GATEWAY_API_KEY environment variable is required."),
	)
	process.exit(1)
}

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

const repoCheck = runGit(["rev-parse", "--is-inside-work-tree"])
if (!repoCheck.success) {
	console.error(chalk.red("Error: Not inside a Git repository."))
	process.exit(1)
}

const statusResult = runGit(["status", "--porcelain"])
if (statusResult.stdout === "") {
	console.log(chalk.yellow("No changes to commit."))
	process.exit(0)
}

const diffResult = runGit(["diff"])
const logResultObj = runGit(["log", "--oneline", "-5"])
const logResult = logResultObj.stdout || "No recent commits."

const prompt = `Generate a concise, imperative commit message (one line, starting with a verb like "Add", "Fix", "Update") based on the following:

Unstaged changes status:
${statusResult.stdout}

Diff of changes:
${diffResult.stdout}

Recent commit history:
${logResult}

Focus on the "why" and purpose of the changes, not just "what". Keep it under 72 characters.`

try {
	const { text } = await generateText({
		model: "xai/grok-4-fast-non-reasoning",
		prompt,
	})

	const message = text.trim()

	console.log(chalk.green(`Generated commit message: ${message}`))

	const addResult = runGit(["add", "."])
	if (!addResult.success) {
		console.error(chalk.red("Error: Failed to stage changes."))
		process.exit(1)
	}

	const commitResult = runGit(["commit", "-m", message])
	if (commitResult.success) {
		console.log(chalk.green("Commit successful!"))
	} else {
		console.error(chalk.red(`Error: Commit failed. ${commitResult.stderr}`))
		process.exit(1)
	}
} catch (error) {
	console.error(
		chalk.red(`Error generating commit message: ${(error as Error).message}`),
	)
	process.exit(1)
}
