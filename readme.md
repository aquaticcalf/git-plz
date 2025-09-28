# git plz

git plz is a Git subcommand that simplifies commits by automatically generating commit messages using AI. It helps you select files to stage and creates concise, imperative commit messages based on your changes.

## Installation

1. Clone the repository or download the files.
2. Run the install script:

   ```bash
   ./install.sh
   ```

   This will set up the global Git alias 'plz' to run the tool using Bun.

3. Set up your AI Gateway API key. The first time you run `git plz`, it will prompt you for your API key and save it securely.

## Usage

Run `git plz` in a Git repository with unstaged changes. It will:

- List modified and untracked files.
- Let you select which files to stage.
- Generate a commit message using AI based on the changes.
- Stage the selected files and commit them.

Example:

```bash
git plz
```

## Uninstall

Run the uninstall script:

```bash
./uninstall.sh
```

This will remove the 'plz' alias from your Git config.

## Requirements

- Bun (to run the tool)
- Git
- AI Gateway API key (for commit message generation)