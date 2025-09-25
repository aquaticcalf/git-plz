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

const diff_result = runGit(["diff"])
const log_result_obj = runGit(["log", "--oneline", "-5"])
const log_result = log_result_obj.stdout || "No recent commits."

const prompt = `Generate a concise, imperative commit message (one line, starting with a verb like "add", "fix", "update") based on the following:

Unstaged changes status:
${status_result.stdout}

Diff of changes:
${diff_result.stdout}

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

	const add_result = runGit(["add", "."])
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
