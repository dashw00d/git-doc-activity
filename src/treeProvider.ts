import * as vscode from 'vscode';
import * as path from 'path';
import { GitService } from './gitService';
import { DocCommit, DocFileChange, BranchDocs, DocTreeNode, TreeNodeType } from './types';

export class DocsActivityTreeProvider implements vscode.TreeDataProvider<DocTreeNode> {
  private _onDidChangeTreeData: vscode.EventEmitter<DocTreeNode | undefined | null | void> = new vscode.EventEmitter<DocTreeNode | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<DocTreeNode | undefined | null | void> = this._onDidChangeTreeData.event;

  private gitService: GitService;
  private commitsCache: DocCommit[] = [];
  private branchesCache: BranchDocs[] = [];
  private workspaceRoot: string;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
    this.gitService = new GitService(workspaceRoot);
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  async refreshData(): Promise<void> {
    try {
      this.commitsCache = await this.gitService.getRecentDocCommits(50);
      this.branchesCache = await this.gitService.getBranchDocActivity();
      this.refresh();
    } catch (error) {
      console.error('Error refreshing data:', error);
      vscode.window.showErrorMessage(`Failed to refresh git doc activity: ${error}`);
    }
  }

  getTreeItem(element: DocTreeNode): vscode.TreeItem {
    const treeItem = new vscode.TreeItem(element.label);

    if (element.description) {
      treeItem.description = element.description;
    }

    treeItem.collapsibleState = element.collapsibleState as any;
    
    if (element.contextValue) {
      treeItem.contextValue = element.contextValue;
    }

    if (element.command) {
      treeItem.command = element.command;
    }

    return treeItem;
  }

  async getChildren(element?: DocTreeNode): Promise<DocTreeNode[]> {
    if (!element) {
      // Root level - show Commits and Branches
      return [
        {
          type: 'root-commits',
          label: 'Commits',
          collapsibleState: vscode.TreeItemCollapsibleState.Expanded,
        },
        {
          type: 'root-branches',
          label: 'Branches',
          collapsibleState: vscode.TreeItemCollapsibleState.Expanded,
        }
      ];
    }

    if (element.type === 'root-commits') {
      return this.commitsCache.map(c => ({
        type: 'commit' as TreeNodeType,
        label: `${this.gitService.formatDate(c.timestamp)} — ${c.shortHash} — ${c.message}`,
        description: c.author,
        collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
        data: c
      }));
    }

    if (element.type === 'commit' && element.data) {
      const commit = element.data as DocCommit;
      return commit.files.map(f => ({
        type: 'file' as TreeNodeType,
        label: `${f.status} ${f.path}`,
        collapsibleState: vscode.TreeItemCollapsibleState.None,
        data: f,
        command: {
          command: 'vscode.open',
          title: 'Open File',
          arguments: [vscode.Uri.file(path.join(this.workspaceRoot, f.path))]
        }
      }));
    }

    if (element.type === 'root-branches') {
      return this.branchesCache.map(b => ({
        type: 'branch' as TreeNodeType,
        label: b.branchName,
        collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
        data: b
      }));
    }

    if (element.type === 'branch' && element.data) {
      const branchDocs = element.data as BranchDocs;
      return branchDocs.commits.map(c => ({
        type: 'branch-commit' as TreeNodeType,
        label: `${this.gitService.formatDate(c.timestamp)} — ${c.shortHash} — ${c.message}`,
        description: c.author,
        collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
        contextValue: 'branchCommit',
        data: c
      }));
    }

    if (element.type === 'branch-commit' && element.data) {
      const commit = element.data as DocCommit;
      return commit.files.map(f => ({
        type: 'file' as TreeNodeType,
        label: `${f.status} ${f.path}`,
        collapsibleState: vscode.TreeItemCollapsibleState.None,
        data: f,
        command: {
          command: 'vscode.open',
          title: 'Open File',
          arguments: [vscode.Uri.file(path.join(this.workspaceRoot, f.path))]
        }
      }));
    }

    return [];
  }
}
