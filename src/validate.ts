import type { Node } from './types';
import { allowedTags } from './utils';

const isEmpty = (str: string): boolean => {
  return /^[\s\t\n\r]*$/.test(str);
};

const branchHasContent = (node: Node): boolean => {
  for (const child of node.branches) {
    const isComment = child.type === 'comment',
      isEmptyText = child.type === 'text' && isEmpty(child.value);

    if (!isComment && !isEmptyText) {
      return true;
    }
  }

  return false;
};

export const validateSyntax = (ast: Node): void => {
  const allowedTypes = ['svelteBranch'],
    throwError = (details = '') => {
      throw new SyntaxError(`Invalid equality syntax. ${details}`);
    },
    branchErrorMsg = 'Statements may only contain {:else} branches.';

  for (const child of ast.branches) {
    if (
      !allowedTypes.includes(child.type) ||
      !allowedTags.includes(child.name)
    ) {
      console.log('invalid type or tag:', child.type, child.name);
      throwError(branchErrorMsg);
    }

    if (!(child.expression?.value?.length > 0) && child.name !== 'else') {
      throwError('Statements must contain an expression.');
    }
  }
};
