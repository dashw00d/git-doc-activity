export type DocFileChangeStatus = "A" | "M" | "D" | "R";

export interface DocFileChange {
  status: DocFileChangeStatus;
  path: string;
  oldPath?: string; // for renames
}

export interface DocCommit {
  commitHash: string;
  shortHash: string;
  timestamp: number;
  author: string;
  message: string;
  files: DocFileChange[];
}

export interface BranchDocs {
  branchName: string;
  commits: DocCommit[];
}

export type TreeNodeType = 
  | "root"
  | "root-commits"
  | "root-branches"
  | "commit"
  | "branch"
  | "branch-commit"
  | "file";

export interface DocTreeNode {
  type: TreeNodeType;
  label: string;
  description?: string;
  data?: DocCommit | DocFileChange | BranchDocs | { branchName: string };
  collapsibleState: number;
  contextValue?: string;
  command?: {
    command: string;
    title: string;
    arguments?: any[];
  };
}
