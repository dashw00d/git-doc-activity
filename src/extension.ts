import * as vscode from 'vscode';
import { DocsActivityTreeProvider } from './treeProvider';
import { GitService } from './gitService';

export function activate(context: vscode.ExtensionContext) {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  
  if (!workspaceFolders || workspaceFolders.length === 0) {
    vscode.window.showErrorMessage('No workspace folder found');
    return;
  }

  // Use the first workspace folder
  const workspaceRoot = workspaceFolders[0].uri.fsPath;
  const treeProvider = new DocsActivityTreeProvider(workspaceRoot);

  // Register tree view
  const treeView = vscode.window.createTreeView('gitDocActivity', {
    treeDataProvider: treeProvider,
    showCollapseAll: true
  });

  context.subscriptions.push(treeView);

  // Register refresh command
  const refreshCommand = vscode.commands.registerCommand('gitDocActivity.refresh', () => {
    treeProvider.refreshData();
  });
  context.subscriptions.push(refreshCommand);

  // Register show commit command
  const showCommitCommand = vscode.commands.registerCommand('gitDocActivity.showCommit', async (element: any) => {
    if (element.data) {
      const commit = element.data as any;
      if (commit.commitHash) {
        const gitService = new GitService(workspaceRoot);
        try {
          const diff = await gitService.showCommit(commit.commitHash);
          const doc = await vscode.workspace.openTextDocument({
            content: diff,
            language: 'plaintext'
          });
          await vscode.window.showTextDocument(doc);
        } catch (error) {
          vscode.window.showErrorMessage(`Failed to show commit: ${error}`);
        }
      }
    }
  });
  context.subscriptions.push(showCommitCommand);

  // Register open file command (handled by tree item command, but register anyway for context menu)
  const openFileCommand = vscode.commands.registerCommand('gitDocActivity.openFile', (element: any) => {
    if (element.data) {
      const file = element.data as any;
      if (file.path) {
        vscode.window.showTextDocument(vscode.Uri.file(file.path));
      }
    }
  });
  context.subscriptions.push(openFileCommand);

  // Register show diff command
  const showDiffCommand = vscode.commands.registerCommand('gitDocActivity.showDiff', async (element: any) => {
    if (element.data) {
      const commit = element.data as any;
      if (commit.commitHash) {
        // Get parent commit
        try {
          const gitService = new GitService(workspaceRoot);
          const diff = await gitService.showCommit(commit.commitHash);
          
          // Try to extract just the file changes from the diff
          const relevantDiff = diff.split('\ndiff --git').slice(1).join('\ndiff --git');
          
          const doc = await vscode.workspace.openTextDocument({
            content: diff,
            language: 'plaintext'
          });
          await vscode.window.showTextDocument(doc, { preview: false });
        } catch (error) {
          vscode.window.showErrorMessage(`Failed to show diff: ${error}`);
        }
      }
    }
  });
  context.subscriptions.push(showDiffCommand);

  // Initial data load
  treeProvider.refreshData();

  // Refresh when git changes
  vscode.commands.registerCommand('scm.refresh', () => {
    treeProvider.refreshData();
  });
}

export function deactivate() {}
