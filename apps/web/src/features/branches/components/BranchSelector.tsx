"use client";

export type BranchOption = {
  id: string;
  name: string;
};

type BranchSelectorProps = {
  branches: readonly BranchOption[];
  value: string;
  isReadOnly?: boolean;
  onChange?: (branchId: string) => void;
};

export function BranchSelector({ branches, value, isReadOnly, onChange }: BranchSelectorProps) {
  return (
    <select
      aria-label="Current branch"
      className="h-9 max-w-64 rounded-md border border-[var(--gymops-border)] bg-[var(--gymops-surface)] px-3 text-sm"
      disabled={isReadOnly}
      value={value}
      onChange={(event) => {
        onChange?.(event.currentTarget.value);
      }}
    >
      {branches.map((branch) => (
        <option key={branch.id} value={branch.id}>
          {branch.name}
        </option>
      ))}
    </select>
  );
}
