const escapeTemplate = (value) =>
  value.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${");

export const wrapClassNames = {
  meta: {
    type: "layout",
    docs: { description: "Wrap className and clsx strings without splitting individual classes." },
    fixable: "code",
    schema: [
      {
        type: "object",
        properties: { maxLength: { type: "integer", minimum: 1 } },
        additionalProperties: false,
      },
    ],
    messages: { wrap: "Перенесите классы на строки длиной не более {{maxLength}} символов." },
  },
  create(context) {
    const sourceCode = context.sourceCode;
    const { maxLength = 100 } = context.options[0] ?? {};

    const wrapValue = (valueNode, attribute) => {
      const node = attribute ?? valueNode;
      const sourceNode = attribute?.value ?? valueNode;
      let value;

      if (valueNode.type === "Literal" && typeof valueNode.value === "string") {
        value = valueNode.value;
      } else if (valueNode.type === "TemplateLiteral" && valueNode.expressions.length === 0) {
        value = valueNode.quasis[0].value.cooked;
      } else {
        return;
      }

      const original = sourceCode.getText(sourceNode);
      const exceedsLimit = original
        .split(/\r?\n/)
        .some(
          (line, index) =>
            line.length + (index === 0 ? sourceNode.loc.start.column : 0) > maxLength,
        );
      if (!exceedsLimit) return;

      const classes = value.trim().split(/\s+/).filter(Boolean).map(escapeTemplate);
      if (!classes.length) return;
      const indent = sourceCode.lines[node.loc.start.line - 1].match(/^[\t ]*/)[0];
      const contentIndent = `${indent}  `;
      const lines = [];

      for (const className of classes) {
        const last = lines.at(-1);
        if (last && contentIndent.length + last.length + 1 + className.length <= maxLength) {
          lines[lines.length - 1] = `${last} ${className}`;
        } else {
          // An indivisible class longer than the limit occupies its own line.
          lines.push(className);
        }
      }

      const newline = sourceCode.text.includes("\r\n") ? "\r\n" : "\n";
      const template = `\`${newline}${lines.map((line) => contentIndent + line).join(newline)}${newline}${indent}\``;
      const isJsxLiteral = attribute && sourceNode.type !== "JSXExpressionContainer";
      const replacement = isJsxLiteral ? `{${template}}` : template;
      if (sourceCode.getText(valueNode) === replacement) return;

      context.report({
        node,
        messageId: "wrap",
        data: { maxLength },
        fix: (fixer) => fixer.replaceText(valueNode, replacement),
      });
    };

    const visitArgument = (node) => {
      if (!node) return;
      if (node.type === "LogicalExpression") {
        visitArgument(node.right);
      } else if (node.type === "ConditionalExpression") {
        visitArgument(node.consequent);
        visitArgument(node.alternate);
      } else if (node.type === "ArrayExpression") {
        node.elements.forEach(visitArgument);
      } else {
        wrapValue(node);
      }
    };

    return {
      JSXAttribute(node) {
        if (node.name.name !== "className" || !node.value) return;
        const valueNode =
          node.value.type === "JSXExpressionContainer" ? node.value.expression : node.value;
        wrapValue(valueNode, node);
      },
      CallExpression(node) {
        if (node.callee.type !== "Identifier") return;
        for (let scope = sourceCode.getScope(node); scope; scope = scope.upper) {
          const variable = scope.set.get(node.callee.name);
          if (!variable) continue;
          const isClsx = variable.defs.some(
            ({ type, node: specifier, parent }) =>
              type === "ImportBinding" &&
              parent.source.value === "clsx" &&
              parent.importKind !== "type" &&
              (specifier.type === "ImportDefaultSpecifier" ||
                (specifier.type === "ImportSpecifier" &&
                  specifier.importKind !== "type" &&
                  specifier.imported.name === "clsx")),
          );
          if (isClsx) node.arguments.forEach(visitArgument);
          break;
        }
      },
    };
  },
};
