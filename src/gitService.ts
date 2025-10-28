import * as childProcess from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import { DocCommit, DocFileChange, BranchDocs } from './types';

const execFile = promisify(childProcess.execFile);

export class GitService {
  constructor(private workspaceRoot: string) {}

  private async execGit(args: string[]): Promise<string> {
    const result = await execFile('git', args, { cwd: this.workspaceRoot });
    return result.stdout.trim();
  }

  /**
   * Get recent commits that touched Markdown files
   */
  async getRecentDocCommits(limit: number = 50): Promise<DocCommit[]> {
    const output = await this.execGit([
      'log',
      `-n`, String(limit * 5),
      '--pretty=format:%H|%h|%ct|%an|%s',
      '--name-status',
      '--',
      '*.md'
    ]);

    return this.parseCommitOutput(output, limit);
  }

  /**
   * Get branch activity for Markdown files
   */
  async getBranchDocActivity(baseBranch: string = 'main'): Promise<BranchDocs[]> {
    // Get list of local branches
    const branchOutput = await this.execGit([
      'for-each-ref',
      '--format=%(refname:short)',
      'refs/heads'
    ]);

    const branches = branchOutput.split('\n').filter(b => b && b !== baseBranch);
    const branchDocs: BranchDocs[] = [];

    for (const branch of branches) {
      try {
        const output = await this.execGit([
          'log',
          `${baseBranch}..${branch}`,
          '--pretty=format:%H|%h|%ct|%an|%s',
          '--name-status',
          '--',
          '*.md'
        ]);

        if (output.trim()) {
          const commits = this.parseCommitOutput(output);
          if (commits.length > 0) {
            branchDocs.push({ branchName: branch, commits });
          }
        }
      } catch (error) {
        // Branch might not exist or have diverged, skip it
        console.log(`Skipping branch ${branch}: ${error}`);
      }
    }

    // Sort by most recent commit timestamp
    branchDocs.sort((a, b) => {
      const latestA = Math.max(...a.commits.map(c => c.timestamp));
      const latestB = Math.max(...b.commits.map(c => c.timestamp));
      return latestB - latestA;
    });

    return branchDocs;
  }

  private parseCommitOutput(output: string, limit?: number): DocCommit[] {
    const lines = output.split('\n');
    const commits: DocCommit[] = [];
    let current: DocCommit | null = null;

    for (const line of lines) {
      // Commit header line: full hash|short hash|timestamp|author|message
      if (/^[0-9a-f]{40}\|/.test(line)) {
        if (current && current.files.length > 0) {
          commits.push(current);
        }

        const parts = line.split('|');
        if (parts.length >= 5) {
          current = {
            commitHash: parts[0],
            shortHash: parts[1],
            timestamp: Number(parts[2]),
            author: parts[3],
            message: parts.slice(4).join('|'),
            files: []
          };
        }
        continue;
      }

      // File status line: [M/A/D/R]\t path [oldPath]
      if (/^[MADRC]\s+/.test(line) && current) {
        const parts = line.trim().split(/\s+/);
        const status = parts[0];

        if (status.startsWith('R')) {
          // Rename: R100\told\tnew
          current.files.push({
            status: 'R',
            path: parts[2],
            oldPath: parts[1]
          });
        } else {
          current.files.push({
            status: status as DocFileChange['status'],
            path: parts[1]
          });
        }
      }
    }

    // Don't forget the last commit
    if (current && current.files.length > 0) {
      commits.push(current);
    }

    return limit ? commits.slice(0, limit) : commits;
  }

  /**
   * Format date for display
   */
  formatDate(timestamp: number): string {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  }

  /**
   * Show commit diff in a new tab
   */
  async showCommit(commitHash: string): Promise<string> {
    return await this.execGit(['show', commitHash]);
  }

  /**
   * Get diff between base branch and another branch
   */
  async showBranchDiff(baseBranch: string, targetBranch: string): Promise<string> {
    return await this.execGit(['diff', `${baseBranch}...${targetBranch}`, '--', '*.md']);
  }
}
