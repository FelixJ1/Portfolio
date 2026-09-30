import type { PortfolioNode } from './portfolio';

export type NavigationState = {
  nodes: PortfolioNode[];
  faceId: number;
};

export type NavigationAction =
  | {
      type: 'ENTER_CHILD';
      node: PortfolioNode;
      faceId: number;
    }
  | {
      type: 'GO_BACK';
      faceId: number;
    }
  | {
      type: 'RESET';
      root: PortfolioNode;
      faceId?: number;
    };

export function navigationReducer(
  state: NavigationState,
  action: NavigationAction,
): NavigationState {
  switch (action.type) {
    case 'ENTER_CHILD': {
      const currentNode = state.nodes[state.nodes.length - 1];
      const isChild = currentNode.children.some(
        (child) => child.id === action.node.id,
      );

      if (!isChild) return state;

      return {
        nodes: [...state.nodes, action.node],
        faceId: action.faceId,
      };
    }

    case 'GO_BACK':
      if (state.nodes.length <= 1) return state;

      return {
        nodes: state.nodes.slice(0, -1),
        faceId: action.faceId,
      };

    case 'RESET':
      return {
        nodes: [action.root],
        faceId: action.faceId ?? 0,
      };

    default:
      return state;
  }
}

export function getNodeAtPath(
  root: PortfolioNode,
  path: string[],
): PortfolioNode | null {
  let node = root;

  for (const id of path) {
    if (id === root.id) continue;

    const nextNode = node.children.find((child) => child.id === id);
    if (!nextNode) return null;

    node = nextNode;
  }

  return node;
}