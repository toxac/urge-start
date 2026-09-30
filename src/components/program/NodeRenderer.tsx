import { getNode } from '@/program';

import { programComponentRegistry } from './registry';

type NodeRendererProps = {
  nodeKey: string;
};

export function NodeRenderer({
  nodeKey,
}: NodeRendererProps) {
  const node = getNode(nodeKey);

  if (!node) {
    throw new Error(
      `Program node not found: ${nodeKey}`,
    );
  }

  const Component =
    programComponentRegistry[node.component];

  if (!Component) {
    throw new Error(
      `Program component not registered: ${node.component}`,
    );
  }

  return <Component />;
}