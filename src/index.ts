import { parse } from 'svelte-parse';
import {
  Injection,
  Node,
  Position,
  PreprocessorOptions,
  PreprocessorOutput
} from './types';
import { allowedTags } from './utils';
import { validateSyntax } from './validate';
import MagicString, { SourceMap } from 'magic-string';

function walk (node: Node, cbs: { [key: string]: Function }) {
  const children = node.children || node.branches;
  const callback = cbs[node.type];

  if (children) {
    for (const child of children) {
      walk(child, cbs);
    }
  }
  if (typeof callback === 'function') {
    callback(node);
  }
  return node;
}

function buildConditions ({
    type,
    expression,
  }: {
    type: string,
    expression: string
  }): string {
  console.log('building conditions for: ', type, expression);
  const valuesLengthError = (op: string) => {
    throw new SyntaxError(`Invalid equality syntax. {#${op}} statements must contain two values.`);
  };

  switch (type) {
    case 'unless':
      return `!(${expression})`;
    case 'eq': {
      const sep = ',';
      const values = expression.split(sep);
      if (values.length > 2) {
        valuesLengthError('eq');
      }
      return values.join(' === ');
    }
    case 'neq': {
      const sep = ',';
      const values = expression.split(sep);
      if (values.length > 2) {
        valuesLengthError('neq');
      }
      return values.join(' !== ');
    }
    case 'gt': {
      const sep = ',';
      const values = expression.split(sep);
      if (values.length > 2) {
        valuesLengthError('gt');
      }
      return values.join(' > ');
    }
    case 'gte': {
      const sep = ',';
      const values = expression.split(sep);
      if (values.length > 2) {
        valuesLengthError('gte');
      }
      return values.join(' >= ');
    }
    case 'lt': {
      const sep = ',';
      const values = expression.split(sep);
      if (values.length > 2) {
        valuesLengthError('lt');
      }
      return values.join(' < ');
    }
    case 'lte': {
      const sep = ',';
      const values = expression.split(sep);
      if (values.length > 2) {
        valuesLengthError('lte');
      }
      return values.join(' <= ');
    }
    case 'and': {
      const sep = ',';
      const values = expression.split(sep);

      return values.join(' && ');
    }
    case 'or': {
      const sep = ',';
      const values = expression.split(sep);
      if (values.length > 2) {
        valuesLengthError('or');
      }
      return values.join(' || ');
    }
  }
  
  // Default fallback
  return `${expression}`;
}

function getInjectionValue (type: string, expression: string, branch: Node): string {
  const comment = `<!-- Injected by svelte-truth-helpers -->`;
  const branchType = branch?.name;
  console.log('getInjectionValue: branchType: ', branchType);

  switch (type) {
    case '_open_':
      return `${comment}\n{#if ${buildConditions({ type: branchType, expression })}}`;
    case 'else':
      return `{:else}`;
    case '_close_':
      return `{/if}`;
  }
  return '';
}

function getInjectionPosition ({
  block,
  branch,
  main,
  type
}: {
  block: Node,
  branch: Node,
  main: Node,
  type: string
}): Position {
  let firstChild;

  if (branch?.children) {
    [firstChild] = branch.children;
  }

  switch (type) {
    case '_open_':
      return {
        start: main.position.start.offset,
        end: firstChild
          ? firstChild.position.start.offset
          : main.position.end.offset
      };
    case 'else':
      return {
        start: branch.position.start.offset,
        end: firstChild
          ? firstChild.position.start.offset
          : branch.position.end.offset
      };
    case '_close_':
      return {
        start: branch.position.end.offset,
        end: block.position.end.offset
      };
  }
  return { start: -1, end: -1 };
}

const buildInjection = ({
  block,
  branch,
  main,
  customType = undefined
}: {
  block: Node,
  branch: Node,
  main: Node,
  customType?: string
}): Injection => {
  const type = (customType || branch?.name) as string,
    expression = branch?.expression?.value;

  return {
    value: getInjectionValue(type, expression, branch),
    ...getInjectionPosition({ block, branch, main, type })
  };
};

const processMarkup = ({
  content: code,
  filename
}: PreprocessorOptions): PreprocessorOutput => {
  const tree = parse({ value: code, generatePositions: true }) as Node,
    output: MagicString = new MagicString(code, { filename }),
    injections: Injection[] = [];

  walk(tree, {
    svelteBranchingBlock(node: Node) {
      if (!allowedTags.includes(node.name)) {
        return;
      }

      validateSyntax(node);
      const [mainBranch, ...branches] = node.branches;
      console.log('mainBranch', mainBranch);

      injections.push(
        buildInjection({
          block: node,
          main: mainBranch,
          branch: mainBranch,
          customType: '_open_'
        }),
        // Only branch we care about (& is valid) is {:else}
        ...branches.map((branch) => buildInjection({
          block: node,
          main: mainBranch,
          branch
        })),
        buildInjection({
          block: node,
          main: mainBranch,
          branch: mainBranch,
          customType: '_close_'
        })
      );
    }
  });

  // Ensure we can handle nested injections
  injections.sort((injectionA: Injection, injectionB: Injection) => {
    if (injectionA.start > injectionB.start) {
      return 1;
    } else if (injectionB.start > injectionA.start) {
      return -1;
    }
    return 0;
  });

  for (const { value, start, end } of injections.reverse()) {
    output.overwrite(start, end, value);
  }

  const map: SourceMap = output.generateMap();
  return { code: output.toString(), map };
};

export default function preprocess(): { markup: Function } {
  return {
    markup: processMarkup
  };
}
