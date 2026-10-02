import { getAllProgramNodes } from '../../program/index';

export function getNextNodeKey(currentNodeKey: string): string | null {
  const nodes = getAllProgramNodes();
  const index = nodes.findIndex((n) => n.key === currentNodeKey);
  if (index === -1 || index === nodes.length - 1) return null;
  return nodes[index + 1].key;
}

export function getPreviousNodeKey(currentNodeKey: string): string | null {
  const nodes = getAllProgramNodes();
  const index = nodes.findIndex((n) => n.key === currentNodeKey);
  if (index <= 0) return null;
  return nodes[index - 1].key;
}