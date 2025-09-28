# git-plz

git-plz is a command-line tool that simplifies git commits by automatically generating commit messages using ai. it helps you select files to stage and creates concise, imperative commit messages based on your changes.

## installation

1. clone the repository or download the files.
2. run the install script:

   ```bash
   ./install.sh
   ```

   this will install git-plz globally using bun.

3. set up your ai gateway api key. the first time you run git-plz, it will prompt you for your api key and save it securely.

## usage

run `git-plz` in a git repository with unstaged changes. it will:

- list modified and untracked files.
- let you select which files to stage.
- generate a commit message using ai based on the changes.
- stage the selected files and commit them.

example:

```bash
git add somefile.txt
git-plz
```

## uninstall

run the uninstall script:

```bash
./uninstall.sh
```

this will remove git-plz from your system.

## requirements

- bun (for installation)
- git
- ai gateway api key (for commit message generation)