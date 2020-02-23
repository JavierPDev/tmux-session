import * as vscode from 'vscode';
import { promisify } from 'util';
import { exec as _exec} from 'child_process';
const exec = promisify(_exec);

export async function activate(context: vscode.ExtensionContext) {
	if (await isMissingTmux()) {
		return vscode.window.showInformationMessage('tmux must be installed on your system for tmux-session to work');
	}

	vscode.window.onDidOpenTerminal((terminal: vscode.Terminal) => {
		const config = vscode.workspace.getConfiguration();
		const sessionName = config.get('tmuxSession.sessionName', vscode.workspace.name);

		terminal.sendText(`tmux new-session -As ${sessionName}`);
	});

	const disposable = vscode.commands.registerCommand('tmuxSession.setSession', async() => {
		const newSessionName = await vscode.window.showInputBox({
			prompt: 'Enter session name',
			value: vscode.workspace.name || '',
		});

		if (!newSessionName) return;

		const config = vscode.workspace.getConfiguration();
		const oldSessionName = config.get('tmuxSession.sessionName', vscode.workspace.name);

		await config.update('tmuxSession.sessionName', newSessionName);
		await exec(`tmux rename -t ${oldSessionName} ${newSessionName}`);
	});

	context.subscriptions.push(disposable);
}

async function isMissingTmux() {
	try {
		const output = (await exec('tmux -V')).stdout;
		return !output.toString().startsWith('tmux');
	} catch(e) {
		return true;
	}
}
